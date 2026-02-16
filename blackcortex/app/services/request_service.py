import logging
from datetime import UTC, datetime

from beanie.operators import In

logger = logging.getLogger(__name__)

from app.models.proxy_link import ProxyLink, ProxyLinkStatus
from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.schemas.volunteer_request import VolunteerRequestCreate, VolunteerRequestUpdate
from app.utils.db import get_document_by_id
from app.utils.exceptions import BadRequestError, ForbiddenError

MAX_ACTIVE_REQUESTS_VOLUNTEER = 3


async def create_request(data: VolunteerRequestCreate, user: User) -> VolunteerRequest:
    # Determine elder_id based on role
    if user.role == UserRole.NEEDY:
        elder_id = str(user.id)
    elif user.role == UserRole.NEEDY_PROXY:
        link = await ProxyLink.find_one(
            ProxyLink.proxy_user_id == str(user.id),
            ProxyLink.status == ProxyLinkStatus.ACTIVE,
        )
        if link is None:
            raise BadRequestError("No active proxy link found")
        elder_id = link.needy_user_id
    else:
        raise ForbiddenError("Only needy or needy_proxy users can create requests")

    vr = VolunteerRequest(
        elder_id=elder_id,
        **data.model_dump(),
    )
    await vr.insert()
    logger.info("Request created: id=%s elder_id=%s by user=%s", vr.id, elder_id, user.id)
    return vr


async def get_request_by_id(request_id: str) -> VolunteerRequest:
    return await get_document_by_id(VolunteerRequest, request_id, "Request")


async def list_requests(
    skip: int = 0,
    limit: int = 20,
    status: RequestStatus | None = None,
    elder_id: str | None = None,
) -> tuple[list[VolunteerRequest], int]:
    filters = []
    if status is not None:
        filters.append(VolunteerRequest.status == status)
    if elder_id is not None:
        filters.append(VolunteerRequest.elder_id == elder_id)

    query = VolunteerRequest.find(*filters) if filters else VolunteerRequest.find()
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return items, total


async def update_request(
    vr: VolunteerRequest, data: VolunteerRequestUpdate, user: User
) -> VolunteerRequest:
    # W2: Cannot modify completed/cancelled requests
    if vr.status in (RequestStatus.COMPLETED, RequestStatus.CANCELLED):
        raise BadRequestError("Cannot update a completed or cancelled request")

    is_owner = vr.elder_id == str(user.id)
    if not is_owner and user.role == UserRole.NEEDY_PROXY:
        is_owner = await _is_proxy_for_elder(user, vr.elder_id)
    if not is_owner and user.role not in (UserRole.SCHOOL_ADMIN, UserRole.ROOT):
        raise ForbiddenError("Only the request owner or school admin can update")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await vr.set(update_data)
    return vr


async def _is_proxy_for_elder(user: User, elder_id: str) -> bool:
    if user.role != UserRole.NEEDY_PROXY:
        return False
    link = await ProxyLink.find_one(
        ProxyLink.proxy_user_id == str(user.id),
        ProxyLink.needy_user_id == elder_id,
        ProxyLink.status == ProxyLinkStatus.ACTIVE,
    )
    return link is not None


async def accept_request(vr: VolunteerRequest, volunteer: User) -> VolunteerRequest:
    if vr.status != RequestStatus.OPEN:
        raise BadRequestError("Request is not open for acceptance")

    if volunteer.role != UserRole.VOLUNTEER:
        raise ForbiddenError("Only volunteers can accept requests")

    # Enforce max 3 active requests
    active_count = await VolunteerRequest.find(
        VolunteerRequest.assigned_student_id == str(volunteer.id),
        In(VolunteerRequest.status, [RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS]),
    ).count()
    if active_count >= MAX_ACTIVE_REQUESTS_VOLUNTEER:
        raise BadRequestError(
            f"Cannot accept more than {MAX_ACTIVE_REQUESTS_VOLUNTEER} active requests"
        )

    # B7: Atomic update — only succeeds if still OPEN
    result = await VolunteerRequest.find_one(
        VolunteerRequest.id == vr.id,
        VolunteerRequest.status == RequestStatus.OPEN,
    ).update(
        {
            "$set": {
                "status": RequestStatus.ASSIGNED,
                "assigned_student_id": str(volunteer.id),
                "updated_at": datetime.now(UTC),
            }
        }
    )
    if result is None or (hasattr(result, "modified_count") and result.modified_count == 0):
        raise BadRequestError("Request is no longer open for acceptance")

    # Reload to return updated state
    return await get_request_by_id(str(vr.id))


async def unassign_request(vr: VolunteerRequest, volunteer: User) -> VolunteerRequest:
    if vr.status != RequestStatus.ASSIGNED:
        raise BadRequestError("Can only unassign from assigned requests")

    if vr.assigned_student_id != str(volunteer.id):
        raise ForbiddenError("You are not assigned to this request")

    await vr.set(
        {
            "status": RequestStatus.OPEN,
            "assigned_student_id": None,
            "updated_at": datetime.now(UTC),
        }
    )
    return vr


async def update_request_status(
    vr: VolunteerRequest, new_status: RequestStatus, user: User
) -> VolunteerRequest:
    valid_transitions = {
        RequestStatus.ASSIGNED: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
        RequestStatus.IN_PROGRESS: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
        RequestStatus.OPEN: [RequestStatus.CANCELLED],
    }

    allowed = valid_transitions.get(vr.status, [])
    if new_status not in allowed:
        raise BadRequestError(f"Cannot transition from {vr.status} to {new_status}")

    # Only assigned volunteer, elder owner (or proxy), or school admin/root can change status
    allowed_ids = [vr.elder_id]
    if vr.assigned_student_id:
        allowed_ids.append(vr.assigned_student_id)

    is_allowed = str(user.id) in allowed_ids or await _is_proxy_for_elder(user, vr.elder_id)
    if not is_allowed and user.role not in (UserRole.SCHOOL_ADMIN, UserRole.ROOT):
        raise ForbiddenError("Not authorized to change request status")

    await vr.set({"status": new_status, "updated_at": datetime.now(UTC)})
    return vr
