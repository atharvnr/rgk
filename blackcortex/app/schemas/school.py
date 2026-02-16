from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SchoolCreate(BaseModel):
    name: str = Field(max_length=200)
    address: str = Field(max_length=300)
    city: str = Field(max_length=100)
    state: str = Field(max_length=50)
    zip_code: str = Field(max_length=10)
    contact_email: EmailStr
    contact_phone: str | None = Field(None, max_length=20)


class SchoolUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    address: str | None = Field(None, max_length=300)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=50)
    zip_code: str | None = Field(None, max_length=10)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(None, max_length=20)


class SchoolResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    contact_email: EmailStr
    contact_phone: str | None = None
    admin_ids: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SchoolHoursResponse(BaseModel):
    school_id: str
    school_name: str
    total_hours: float
    approved_sessions: int
