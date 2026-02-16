from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field


class SessionStatus(StrEnum):
    PENDING_ELDER_CONFIRMATION = "pending_elder_confirmation"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class VolunteerSession(Document):
    request_id: Indexed(str)  # type: ignore[valid-type]
    student_id: Indexed(str)  # type: ignore[valid-type]
    elder_id: str
    school_id: str
    hours_logged: float
    date: str
    notes: str | None = None
    status: SessionStatus = SessionStatus.PENDING_ELDER_CONFIRMATION
    # Elder confirmation
    elder_confirmed: bool = False
    elder_confirmed_at: datetime | None = None
    elder_confirmed_by: str | None = None
    # School approval
    approved_by: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "volunteer_sessions"
        indexes = [
            [("school_id", 1), ("status", 1)],
            [("elder_id", 1)],
            [("status", 1), ("created_at", 1)],
        ]
