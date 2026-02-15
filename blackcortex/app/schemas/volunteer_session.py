from datetime import datetime

from pydantic import BaseModel, Field

from app.models.volunteer_session import SessionStatus


class VolunteerSessionCreate(BaseModel):
    request_id: str
    hours_logged: float = Field(gt=0)
    date: str
    notes: str | None = None


class VolunteerSessionResponse(BaseModel):
    id: str
    request_id: str
    student_id: str
    elder_id: str
    school_id: str
    hours_logged: float
    date: str
    notes: str | None = None
    status: SessionStatus
    approved_by: str | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
