import logging
from datetime import UTC, datetime

from beanie import PydanticObjectId

logger = logging.getLogger(__name__)

from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.volunteer_session import VolunteerSessionCreate
from app.services.proxy_service import verify_elder_access
from app.utils.db import get_document_by_id
from app.utils.exceptions import BadRequestError, ForbiddenError, NotFoundError


async def create_session(data: VolunteerSessionCreate, volunteer: User) -> VolunteerSession:
    try:
        vr = await VolunteerRequest.get(PydanticObjectId(data.request_id))
    except Exception:
        raise NotFoundError("Volunteer request not found")
    if vr is None:
        raise NotFoundError("Volunteer request not found")

    if vr.assigned_student_id != str(volunteer.id):
        raise ForbiddenError("You are not assigned to this request")

    if vr.status not in (RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS):
        raise BadRequestError("Request is not in a valid state for logging hours")

    if not volunteer.school_id:
        raise BadRequestError("Volunteer must be associated with a school")

    session = VolunteerSession(
        request_id=data.request_id,
        student_id=str(volunteer.id),
        elder_id=vr.elder_id,
        school_id=volunteer.school_id,
        hours_logged=data.hours_logged,
        date=data.date,
        notes=data.notes,
    )
    await session.insert()
    logger.info("Session created: id=%s volunteer=%s request=%s", session.id, volunteer.id, data.request_id)
    return session


async def get_session_by_id(session_id: str) -> VolunteerSession:
    return await get_document_by_id(VolunteerSession, session_id, "Session")


async def list_sessions(
    skip: int = 0,
    limit: int = 20,
    student_id: str | None = None,
    school_id: str | None = None,
    elder_id: str | None = None,
    status: SessionStatus | None = None,
) -> tuple[list[VolunteerSession], int]:
    filters = []
    if student_id is not None:
        filters.append(VolunteerSession.student_id == student_id)
    if school_id is not None:
        filters.append(VolunteerSession.school_id == school_id)
    if elder_id is not None:
        filters.append(VolunteerSession.elder_id == elder_id)
    if status is not None:
        filters.append(VolunteerSession.status == status)

    query = VolunteerSession.find(*filters) if filters else VolunteerSession.find()
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return items, total


async def elder_confirm_session(session: VolunteerSession, user: User) -> VolunteerSession:
    if session.status != SessionStatus.PENDING_ELDER_CONFIRMATION:
        raise BadRequestError("Session is not pending elder confirmation")

    # D4: Use centralized verify_elder_access
    await verify_elder_access(user, session.elder_id)

    now = datetime.now(UTC)
    await session.set(
        {
            "status": SessionStatus.PENDING_APPROVAL,
            "elder_confirmed": True,
            "elder_confirmed_at": now,
            "elder_confirmed_by": str(user.id),
            "updated_at": now,
        }
    )
    logger.info("Session elder-confirmed: id=%s by=%s", session.id, user.id)
    return session


async def approve_session(
    session: VolunteerSession,
    approved: bool,
    approver: User,
    rejection_reason: str | None = None,
) -> VolunteerSession:
    if approver.role not in (UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER, UserRole.ROOT):
        raise ForbiddenError("Only school admins, school users, or root can approve sessions")

    # Non-root users must be in the same school
    if approver.role in (UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER):
        if session.school_id != approver.school_id:
            school = await School.get(PydanticObjectId(session.school_id))
            if school is None or str(approver.id) not in school.admin_ids:
                raise ForbiddenError("You are not authorized for this student's school")

    if session.status != SessionStatus.PENDING_APPROVAL:
        raise BadRequestError("Session is not pending approval")

    new_status = SessionStatus.APPROVED if approved else SessionStatus.REJECTED
    update_data: dict = {
        "status": new_status,
        "approved_by": str(approver.id),
        "approved_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    if not approved and rejection_reason:
        update_data["rejection_reason"] = rejection_reason

    await session.set(update_data)
    logger.info("Session %s: id=%s by=%s", new_status, session.id, approver.id)
    return session
