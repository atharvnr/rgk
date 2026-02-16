from fastapi import APIRouter, Depends, Query

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role, require_verified
from app.models.user import User, UserRole
from app.models.volunteer_request import RequestStatus
from app.schemas.volunteer_request import (
    VolunteerRequestCreate,
    VolunteerRequestResponse,
    VolunteerRequestUpdate,
)
from app.services import request_service
from app.utils.exceptions import ForbiddenError
from app.utils.response import paginated_response

router = APIRouter(prefix="/requests", tags=["requests"])


def _to_response(vr) -> dict:
    return {
        "id": str(vr.id),
        "elder_id": vr.elder_id,
        "title": vr.title,
        "description": vr.description,
        "category": vr.category,
        "status": vr.status,
        "location": vr.location,
        "preferred_date": vr.preferred_date,
        "preferred_time_slot": vr.preferred_time_slot,
        "assigned_student_id": vr.assigned_student_id,
        "created_at": vr.created_at,
        "updated_at": vr.updated_at,
    }


@router.post("/", response_model=VolunteerRequestResponse, status_code=201)
async def create_request(
    data: VolunteerRequestCreate,
    user: User = Depends(require_role(UserRole.NEEDY, UserRole.NEEDY_PROXY)),
    _verified: User = Depends(require_verified()),
):
    vr = await request_service.create_request(data, user)
    return _to_response(vr)


@router.get("/")
async def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: RequestStatus | None = None,
    user: User = Depends(get_current_user),
):
    # Needy/proxy see only their own requests; volunteers/root see all
    elder_id = None
    if user.role == UserRole.NEEDY:
        elder_id = str(user.id)
    elif user.role == UserRole.NEEDY_PROXY:
        from app.services.proxy_service import get_needy_id_for_proxy

        elder_id = await get_needy_id_for_proxy(str(user.id))
        # B5: No active link → empty list (not unfiltered access)
        if elder_id is None:
            return paginated_response([], 0, skip, limit)

    items, total = await request_service.list_requests(skip, limit, status, elder_id)
    return paginated_response(items, total, skip, limit, _to_response)


@router.get("/{request_id}", response_model=VolunteerRequestResponse)
async def get_request(request_id: str, user: User = Depends(get_current_user)):
    vr = await request_service.get_request_by_id(request_id)
    # W3: IDOR — needy/proxy can only view their own requests
    if user.role == UserRole.NEEDY and vr.elder_id != str(user.id):
        raise ForbiddenError("You can only view your own requests")
    if user.role == UserRole.NEEDY_PROXY:
        from app.services.proxy_service import get_needy_id_for_proxy

        elder_id = await get_needy_id_for_proxy(str(user.id))
        if elder_id is None or vr.elder_id != elder_id:
            raise ForbiddenError("You can only view requests for your linked elder")
    return _to_response(vr)


@router.put("/{request_id}", response_model=VolunteerRequestResponse)
async def update_request(
    request_id: str,
    data: VolunteerRequestUpdate,
    user: User = Depends(get_current_user),
):
    vr = await request_service.get_request_by_id(request_id)
    updated = await request_service.update_request(vr, data, user)
    return _to_response(updated)


@router.post("/{request_id}/accept", response_model=VolunteerRequestResponse)
async def accept_request(
    request_id: str,
    user: User = Depends(require_role(UserRole.VOLUNTEER)),
    _verified: User = Depends(require_verified()),
):
    vr = await request_service.get_request_by_id(request_id)
    updated = await request_service.accept_request(vr, user)
    return _to_response(updated)


@router.put("/{request_id}/unassign", response_model=VolunteerRequestResponse)
async def unassign_request(
    request_id: str,
    user: User = Depends(require_role(UserRole.VOLUNTEER)),
):
    vr = await request_service.get_request_by_id(request_id)
    updated = await request_service.unassign_request(vr, user)
    return _to_response(updated)


@router.put("/{request_id}/status", response_model=VolunteerRequestResponse)
async def update_request_status(
    request_id: str,
    status: RequestStatus = Query(...),
    user: User = Depends(get_current_user),
):
    vr = await request_service.get_request_by_id(request_id)
    updated = await request_service.update_request_status(vr, status, user)
    return _to_response(updated)
