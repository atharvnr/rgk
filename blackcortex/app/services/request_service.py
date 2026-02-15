from datetime import UTC, datetime

from beanie import PydanticObjectId

from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus, VolunteerRequest
from app.schemas.volunteer_request import VolunteerRequestCreate, VolunteerRequestUpdate
from app.utils.exceptions import BadRequestError, ForbiddenError, NotFoundError


async def create_request(data: VolunteerRequestCreate, elder: User) -> VolunteerRequest:
    vr = VolunteerRequest(
        elder_id=str(elder.id),
        **data.model_dump(),
    )
    await vr.insert()
    return vr


async def get_request_by_id(request_id: str) -> VolunteerRequest:
    try:
        vr = await VolunteerRequest.get(PydanticObjectId(request_id))
    except Exception:
        raise NotFoundError("Request not found")
    if vr is None:
        raise NotFoundError("Request not found")
    return vr


async def list_requests(
    skip: int = 0,
    limit: int = 20,
    status: RequestStatus | None = None,
    elder_id: str | None = None,
) -> tuple[list[VolunteerRequest], int]:
    filters = []
    if status:
        filters.append(VolunteerRequest.status == status)
    if elder_id:
        filters.append(VolunteerRequest.elder_id == elder_id)

    query = VolunteerRequest.find(*filters) if filters else VolunteerRequest.find()
    total = await query.count()
    items = await VolunteerRequest.find(*filters).skip(skip).limit(limit).to_list()
    return items, total


async def update_request(
    vr: VolunteerRequest, data: VolunteerRequestUpdate, user: User
) -> VolunteerRequest:
    if vr.elder_id != str(user.id) and user.role != UserRole.SCHOOL_ADMIN:
        raise ForbiddenError("Only the request owner or school admin can update")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await vr.set(update_data)
    return vr


async def accept_request(vr: VolunteerRequest, student: User) -> VolunteerRequest:
    if vr.status != RequestStatus.OPEN:
        raise BadRequestError("Request is not open for acceptance")

    if student.role != UserRole.STUDENT:
        raise ForbiddenError("Only students can accept requests")

    await vr.set(
        {
            "status": RequestStatus.ASSIGNED,
            "assigned_student_id": str(student.id),
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

    # Only assigned student, elder owner, or school admin can change status
    allowed_ids = [vr.elder_id]
    if vr.assigned_student_id:
        allowed_ids.append(vr.assigned_student_id)

    if str(user.id) not in allowed_ids and user.role != UserRole.SCHOOL_ADMIN:
        raise ForbiddenError("Not authorized to change request status")

    await vr.set({"status": new_status, "updated_at": datetime.now(UTC)})
    return vr
