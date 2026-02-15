from datetime import UTC, datetime

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.exceptions import ConflictError, NotFoundError


async def create_user(data: UserCreate) -> User:
    existing = await User.find_one(User.auth0_id == data.auth0_id)
    if existing:
        raise ConflictError("User already registered")

    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise ConflictError("Email already in use")

    user = User(**data.model_dump())
    await user.insert()
    return user


async def get_user_by_id(user_id: str) -> User:
    user = await User.get(user_id)
    if user is None:
        raise NotFoundError("User not found")
    return user


async def update_user(user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await user.set(update_data)
    return user
