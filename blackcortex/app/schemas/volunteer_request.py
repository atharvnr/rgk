from datetime import datetime

from pydantic import BaseModel

from app.models.volunteer_request import RequestCategory, RequestStatus


class VolunteerRequestCreate(BaseModel):
    title: str
    description: str
    category: RequestCategory
    location: str | None = None
    preferred_date: str | None = None
    preferred_time_slot: str | None = None


class VolunteerRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: RequestCategory | None = None
    location: str | None = None
    preferred_date: str | None = None
    preferred_time_slot: str | None = None


class VolunteerRequestResponse(BaseModel):
    id: str
    elder_id: str
    title: str
    description: str
    category: RequestCategory
    status: RequestStatus
    location: str | None = None
    preferred_date: str | None = None
    preferred_time_slot: str | None = None
    assigned_student_id: str | None = None
    created_at: datetime
    updated_at: datetime
