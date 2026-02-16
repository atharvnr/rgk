from datetime import datetime

from pydantic import BaseModel, Field

from app.models.volunteer_request import RequestCategory, RequestStatus


class VolunteerRequestCreate(BaseModel):
    title: str = Field(max_length=200)
    description: str = Field(max_length=2000)
    category: RequestCategory
    location: str | None = Field(None, max_length=300)
    preferred_date: str | None = Field(None, max_length=50)
    preferred_time_slot: str | None = Field(None, max_length=50)


class VolunteerRequestUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=2000)
    category: RequestCategory | None = None
    location: str | None = Field(None, max_length=300)
    preferred_date: str | None = Field(None, max_length=50)
    preferred_time_slot: str | None = Field(None, max_length=50)


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
