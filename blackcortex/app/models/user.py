from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class UserRole(StrEnum):
    STUDENT = "student"
    SCHOOL_ADMIN = "school_admin"
    ELDER = "elder"


class User(Document):
    auth0_id: Indexed(str, unique=True)  # type: ignore[valid-type]
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    name: str
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    # Student-specific
    school_id: str | None = None
    # Elder-specific
    address: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "users"
