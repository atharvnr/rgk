from datetime import UTC, datetime

from beanie import PydanticObjectId

from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.volunteer_session import VolunteerSessionCreate
from app.utils.exceptions import BadRequestError, ForbiddenError, NotFoundError


async def create_session(data: VolunteerSessionCreate, student: User) -> VolunteerSession:
    # Validate request exists and is assigned to this student
    try:
        vr = await VolunteerRequest.get(PydanticObjectId(data.request_id))
    except Exception:
        raise NotFoundError("Volunteer request not found")
    if vr is None:
        raise NotFoundError("Volunteer request not found")

    if vr.assigned_student_id != str(student.id):
        raise ForbiddenError("You are not assigned to this request")

    if vr.status not in (RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS):
        raise BadRequestError("Request is not in a valid state for logging hours")

    if not student.school_id:
        raise BadRequestError("Student must be associated with a school")

    session = VolunteerSession(
        request_id=data.request_id,
        student_id=str(student.id),
        elder_id=vr.elder_id,
        school_id=student.school_id,
        hours_logged=data.hours_logged,
        date=data.date,
        notes=data.notes,
    )
    await session.insert()
    return session


async def get_session_by_id(session_id: str) -> VolunteerSession:
    try:
        session = await VolunteerSession.get(PydanticObjectId(session_id))
    except Exception:
        raise NotFoundError("Session not found")
    if session is None:
        raise NotFoundError("Session not found")
    return session


async def list_sessions(
    skip: int = 0,
    limit: int = 20,
    student_id: str | None = None,
    school_id: str | None = None,
    status: SessionStatus | None = None,
) -> tuple[list[VolunteerSession], int]:
    filters = []
    if student_id:
        filters.append(VolunteerSession.student_id == student_id)
    if school_id:
        filters.append(VolunteerSession.school_id == school_id)
    if status:
        filters.append(VolunteerSession.status == status)

    query = VolunteerSession.find(*filters) if filters else VolunteerSession.find()
    total = await query.count()
    items = await VolunteerSession.find(*filters).skip(skip).limit(limit).to_list()
    return items, total


async def approve_session(
    session: VolunteerSession, approved: bool, approver: User
) -> VolunteerSession:
    if approver.role != UserRole.SCHOOL_ADMIN:
        raise ForbiddenError("Only school admins can approve sessions")

    if session.school_id != approver.school_id:
        # Also check admin_ids on the school
        from app.models.school import School

        school = await School.get(PydanticObjectId(session.school_id))
        if school is None or str(approver.id) not in school.admin_ids:
            raise ForbiddenError("You are not an admin for this student's school")

    if session.status != SessionStatus.PENDING_APPROVAL:
        raise BadRequestError("Session is not pending approval")

    new_status = SessionStatus.APPROVED if approved else SessionStatus.REJECTED
    await session.set(
        {
            "status": new_status,
            "approved_by": str(approver.id),
            "approved_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    return session
