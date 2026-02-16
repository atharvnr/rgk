import logging
from datetime import UTC, datetime

from app.models.school_association_request import (
    AssociationStatus,
    SchoolAssociationRequest,
)
from app.models.user import User, UserRole
from app.schemas.school_association_request import AssociationRequestCreate
from app.utils.db import get_document_by_id
from app.utils.exceptions import BadRequestError, ForbiddenError

logger = logging.getLogger(__name__)


async def create_association_request(
    school_id: str, data: AssociationRequestCreate, user: User
) -> SchoolAssociationRequest:
    if user.role not in (UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER, UserRole.VOLUNTEER):
        raise ForbiddenError("Only school-affiliated roles can request association")

    if user.school_id:
        raise BadRequestError("User is already associated with a school")

    # Check for existing pending request
    existing = await SchoolAssociationRequest.find_one(
        SchoolAssociationRequest.user_id == str(user.id),
        SchoolAssociationRequest.status == AssociationStatus.PENDING,
    )
    if existing:
        raise BadRequestError("You already have a pending association request")

    req = SchoolAssociationRequest(
        user_id=str(user.id),
        school_id=school_id,
        role=user.role,
        school_issued_id=data.school_issued_id,
        school_email=data.school_email,
    )
    await req.insert()
    logger.info("Association request created: id=%s user=%s school=%s", req.id, user.id, school_id)
    return req


async def get_association_request_by_id(req_id: str) -> SchoolAssociationRequest:
    return await get_document_by_id(SchoolAssociationRequest, req_id, "Association request")


async def list_association_requests(
    school_id: str,
    status: AssociationStatus | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[SchoolAssociationRequest], int]:
    filters = [SchoolAssociationRequest.school_id == school_id]
    if status is not None:
        filters.append(SchoolAssociationRequest.status == status)

    query = SchoolAssociationRequest.find(*filters)
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return items, total


async def review_association_request(
    req_id: str,
    approved: bool,
    reviewer: User,
    rejection_reason: str | None = None,
    expected_school_id: str | None = None,
) -> SchoolAssociationRequest:
    req = await get_association_request_by_id(req_id)
    if req.status != AssociationStatus.PENDING:
        raise BadRequestError("Association request is not pending")

    # B6: Validate school_id matches the URL path
    if expected_school_id and req.school_id != expected_school_id:
        raise BadRequestError("Association request does not belong to this school")

    # school_admin requests -> root approves
    # school_user/volunteer requests -> school_admin approves
    if req.role == UserRole.SCHOOL_ADMIN:
        if reviewer.role != UserRole.ROOT:
            raise ForbiddenError("Only root can approve school_admin association requests")
    else:
        if reviewer.role not in (UserRole.SCHOOL_ADMIN, UserRole.ROOT):
            raise ForbiddenError("Only school_admin or root can approve association requests")

    now = datetime.now(UTC)
    new_status = AssociationStatus.APPROVED if approved else AssociationStatus.REJECTED

    update_data: dict = {
        "status": new_status,
        "reviewed_by": str(reviewer.id),
        "reviewed_at": now,
        "updated_at": now,
    }
    if not approved and rejection_reason:
        update_data["rejection_reason"] = rejection_reason

    await req.set(update_data)
    logger.info("Association request %s: id=%s by=%s", new_status, req.id, reviewer.id)

    # On approval, update user's school_id
    if approved:
        user = await User.get(req.user_id)
        if user:
            await user.set(
                {
                    "school_id": req.school_id,
                    "school_issued_id": req.school_issued_id,
                    "school_email": req.school_email,
                    "updated_at": now,
                }
            )

    return req
