from fastapi import APIRouter, Depends

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.schemas.proxy_link import ProxyLinkCreate, ProxyLinkRejectBody, ProxyLinkResponse
from app.services import proxy_service

router = APIRouter(prefix="/proxy", tags=["proxy"])


def _to_response(link) -> dict:
    return {
        "id": str(link.id),
        "proxy_user_id": link.proxy_user_id,
        "needy_user_id": link.needy_user_id,
        "status": link.status,
        "rejection_reason": link.rejection_reason,
        "requested_at": link.requested_at,
        "confirmed_at": link.confirmed_at,
        "confirmed_by": link.confirmed_by,
        "revoked_at": link.revoked_at,
        "revoked_by": link.revoked_by,
        "created_at": link.created_at,
        "updated_at": link.updated_at,
    }


@router.post("/link", response_model=ProxyLinkResponse, status_code=201)
async def create_proxy_link(
    data: ProxyLinkCreate,
    user: User = Depends(require_role(UserRole.NEEDY_PROXY)),
):
    link = await proxy_service.create_proxy_link(data, user)
    return _to_response(link)


@router.get("/links")
async def get_my_proxy_links(
    user: User = Depends(require_role(UserRole.NEEDY_PROXY)),
):
    links = await proxy_service.get_proxy_links_for_user(str(user.id))
    return [_to_response(link) for link in links]


@router.put("/link/{link_id}/confirm", response_model=ProxyLinkResponse)
async def confirm_proxy_link(
    link_id: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    link = await proxy_service.confirm_proxy_link(link_id, user)
    return _to_response(link)


@router.put("/link/{link_id}/reject", response_model=ProxyLinkResponse)
async def reject_proxy_link(
    link_id: str,
    body: ProxyLinkRejectBody,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    link = await proxy_service.reject_proxy_link(link_id, user, body.rejection_reason)
    return _to_response(link)


@router.put("/link/{link_id}/revoke", response_model=ProxyLinkResponse)
async def revoke_proxy_link(
    link_id: str,
    user: User = Depends(get_current_user),
):
    link = await proxy_service.revoke_proxy_link(link_id, user)
    return _to_response(link)
