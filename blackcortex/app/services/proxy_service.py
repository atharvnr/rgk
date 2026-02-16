from datetime import UTC, datetime

from beanie.operators import In

from app.models.proxy_link import ProxyLink, ProxyLinkStatus
from app.models.user import User, UserRole
from app.schemas.proxy_link import ProxyLinkCreate
from app.utils.db import get_document_by_id
from app.utils.exceptions import BadRequestError, ForbiddenError, NotFoundError


async def create_proxy_link(data: ProxyLinkCreate, proxy_user: User) -> ProxyLink:
    # Check needy user exists and has needy role
    needy_user = await User.get(data.needy_user_id)
    if needy_user is None:
        raise NotFoundError("Needy user not found")
    if needy_user.role != UserRole.NEEDY:
        raise BadRequestError("Target user is not a needy user")

    # 1:1 enforcement — proxy can only have one link
    existing_proxy = await ProxyLink.find_one(
        ProxyLink.proxy_user_id == str(proxy_user.id),
        In(ProxyLink.status, [ProxyLinkStatus.PENDING, ProxyLinkStatus.ACTIVE]),
    )
    if existing_proxy:
        raise BadRequestError("You already have an active or pending proxy link")

    # 1:1 enforcement — needy can only have one proxy
    existing_needy = await ProxyLink.find_one(
        ProxyLink.needy_user_id == data.needy_user_id,
        In(ProxyLink.status, [ProxyLinkStatus.PENDING, ProxyLinkStatus.ACTIVE]),
    )
    if existing_needy:
        raise BadRequestError("This needy user already has an active or pending proxy")

    link = ProxyLink(
        proxy_user_id=str(proxy_user.id),
        needy_user_id=data.needy_user_id,
    )
    await link.insert()
    return link


async def get_proxy_link_by_id(link_id: str) -> ProxyLink:
    return await get_document_by_id(ProxyLink, link_id, "Proxy link")


async def get_proxy_links_for_user(user_id: str) -> list[ProxyLink]:
    return await ProxyLink.find(ProxyLink.proxy_user_id == user_id).to_list()


async def confirm_proxy_link(link_id: str, root_user: User) -> ProxyLink:
    link = await get_proxy_link_by_id(link_id)
    if link.status != ProxyLinkStatus.PENDING:
        raise BadRequestError("Proxy link is not pending")

    now = datetime.now(UTC)
    await link.set(
        {
            "status": ProxyLinkStatus.ACTIVE,
            "confirmed_at": now,
            "confirmed_by": str(root_user.id),
            "updated_at": now,
        }
    )
    return link


async def reject_proxy_link(
    link_id: str, root_user: User, rejection_reason: str
) -> ProxyLink:
    link = await get_proxy_link_by_id(link_id)
    if link.status != ProxyLinkStatus.PENDING:
        raise BadRequestError("Proxy link is not pending")

    now = datetime.now(UTC)
    await link.set(
        {
            "status": ProxyLinkStatus.REJECTED,
            "rejection_reason": rejection_reason,
            "updated_at": now,
        }
    )
    return link


async def revoke_proxy_link(link_id: str, user: User) -> ProxyLink:
    link = await get_proxy_link_by_id(link_id)
    if link.status != ProxyLinkStatus.ACTIVE:
        raise BadRequestError("Proxy link is not active")

    # Only root or the needy user can revoke
    if user.role != UserRole.ROOT and str(user.id) != link.needy_user_id:
        raise ForbiddenError("Only root or the needy user can revoke a proxy link")

    now = datetime.now(UTC)
    await link.set(
        {
            "status": ProxyLinkStatus.REVOKED,
            "revoked_at": now,
            "revoked_by": str(user.id),
            "updated_at": now,
        }
    )
    return link


async def get_needy_id_for_proxy(proxy_user_id: str) -> str | None:
    link = await ProxyLink.find_one(
        ProxyLink.proxy_user_id == proxy_user_id,
        ProxyLink.status == ProxyLinkStatus.ACTIVE,
    )
    return link.needy_user_id if link else None


async def verify_elder_access(user: User, elder_id: str) -> None:
    """Verify user is the elder or an active proxy for the elder. Raises ForbiddenError."""
    if user.role == UserRole.NEEDY:
        if str(user.id) != elder_id:
            raise ForbiddenError("You are not the elder for this resource")
    elif user.role == UserRole.NEEDY_PROXY:
        link = await ProxyLink.find_one(
            ProxyLink.proxy_user_id == str(user.id),
            ProxyLink.needy_user_id == elder_id,
            ProxyLink.status == ProxyLinkStatus.ACTIVE,
        )
        if link is None:
            raise ForbiddenError("No active proxy link to this elder")
    else:
        raise ForbiddenError("Only needy or needy_proxy users can perform this action")
