from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import EmailStr, Field


class UserRole(StrEnum):
    ROOT = "root"
    SCHOOL_ADMIN = "school_admin"
    SCHOOL_USER = "school_user"
    VOLUNTEER = "volunteer"
    NEEDY = "needy"
    NEEDY_PROXY = "needy_proxy"


class VerificationStatus(StrEnum):
    NOT_REQUIRED = "not_required"
    UNVERIFIED = "unverified"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    VERIFICATION_FAILED = "verification_failed"


class User(Document):
    auth0_id: Indexed(str, unique=True)  # type: ignore[valid-type]
    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    name: str
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    # School-affiliated fields
    school_id: str | None = None
    school_issued_id: str | None = None
    school_email: str | None = None
    # Needy-specific
    address: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "users"
        indexes = [
            [("school_id", 1), ("role", 1), ("is_active", 1)],
        ]
