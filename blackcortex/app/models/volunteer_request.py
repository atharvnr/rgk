from datetime import UTC, datetime
from enum import StrEnum

from beanie import Document, Indexed
from pydantic import Field


class RequestCategory(StrEnum):
    COMPANIONSHIP = "companionship"
    ERRANDS = "errands"
    TECH_HELP = "tech_help"
    YARD_WORK = "yard_work"
    TRANSPORTATION = "transportation"
    OTHER = "other"


class RequestStatus(StrEnum):
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VolunteerRequest(Document):
    elder_id: Indexed(str)  # type: ignore[valid-type]
    title: str
    description: str
    category: RequestCategory
    status: RequestStatus = RequestStatus.OPEN
    location: str | None = None
    preferred_date: str | None = None
    preferred_time_slot: str | None = None
    assigned_student_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "volunteer_requests"
