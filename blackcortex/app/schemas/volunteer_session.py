from datetime import datetime

from pydantic import BaseModel, Field

from app.models.volunteer_session import SessionStatus


class VolunteerSessionCreate(BaseModel):
    request_id: str
    hours_logged: float = Field(gt=0, le=24)
    date: str = Field(max_length=50)
    notes: str | None = Field(None, max_length=1000)


class SessionApproveBody(BaseModel):
    approved: bool
    rejection_reason: str | None = Field(None, max_length=500)


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
    elder_confirmed: bool
    elder_confirmed_at: datetime | None = None
    elder_confirmed_by: str | None = None
    approved_by: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
