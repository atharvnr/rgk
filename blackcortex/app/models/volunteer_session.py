from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field


class SessionStatus(StrEnum):
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
    status: SessionStatus = SessionStatus.PENDING_APPROVAL
    approved_by: str | None = None
    approved_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "volunteer_sessions"
