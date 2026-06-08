from datetime import UTC, datetime

from beanie import Document, Indexed
from pydantic import Field


class VerificationRequestStatus(str):
    PENDING = "pending"
    RESOLVED = "resolved"


class VerificationRequest(Document):
    user_id: str
    user_email: str
    user_name: str | None = None
    phone: str | None = None
    message: str | None = None
    status: str = VerificationRequestStatus.PENDING
    admin_notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    resolved_by: str | None = None
    resolved_at: datetime | None = None

    class Settings:
        name = "verification_requests"
