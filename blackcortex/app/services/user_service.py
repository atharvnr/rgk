from app.utils.exceptions import ConflictError
from app.utils.db import get_document_by_id
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User, UserRole, VerificationStatus
import logging
from datetime import UTC, datetime

from app.config import settings

logger = logging.getLogger(__name__)


def _verification_status_for_role(role: UserRole) -> VerificationStatus:
    if role in (UserRole.ROOT, UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER):
        return VerificationStatus.NOT_REQUIRED
    return VerificationStatus.UNVERIFIED


async def create_user(data: UserCreate, auth0_id: str, email: str) -> User:
    existing = await User.find_one(User.auth0_id == auth0_id)
    existing_email = await User.find_one(User.email == email)
    if existing or existing_email:
        raise ConflictError("Registration failed")

    # Auto-assign root if email matches RGK_ROOT_USERS or rgk_admin_emails
    role = data.role
    if email in settings.rgk_root_users or email in settings.rgk_admin_emails:
        role = UserRole.ROOT

    verification_status = _verification_status_for_role(role)

    user = User(
        **data.model_dump(exclude={"role"}),
        role=role,
        auth0_id=auth0_id,
        email=email,
        verification_status=verification_status,
    )
    await user.insert()
    logger.info("User registered: auth0_id=%s role=%s", auth0_id, role)
    return user


async def get_user_by_id(user_id: str) -> User:
    return await get_document_by_id(User, user_id, "User")


async def update_user(user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await user.set(update_data)
    return user


async def list_users(
    skip: int = 0,
    limit: int = 20,
    role: UserRole | None = None,
    verification_status: VerificationStatus | None = None,
) -> tuple[list[User], int]:
    filters = []
    if role is not None:
        filters.append(User.role == role)
    if verification_status is not None:
        filters.append(User.verification_status == verification_status)

    query = User.find(*filters) if filters else User.find()
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return items, total


async def verify_user(user_id: str, new_status: VerificationStatus) -> User:
    user = await get_user_by_id(user_id)
    await user.set(
        {
            "verification_status": new_status,
            "updated_at": datetime.now(UTC),
        }
    )
    return user
