from datetime import UTC, datetime, timedelta
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field

from app.models.user import UserRole


class AssociationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class SchoolAssociationRequest(Document):
    user_id: Indexed(str)  # type: ignore[valid-type]
    school_id: Indexed(str)  # type: ignore[valid-type]
    role: UserRole
    school_issued_id: str
    school_email: str
    status: AssociationStatus = AssociationStatus.PENDING
    rejection_reason: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC) + timedelta(days=14)
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "school_association_requests"
        indexes = [
            [("school_id", 1), ("status", 1)],
            [("status", 1), ("expires_at", 1)],
        ]
