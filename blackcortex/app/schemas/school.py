from datetime import datetime

from pydantic import BaseModel, EmailStr


class SchoolCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    contact_email: EmailStr
    contact_phone: str | None = None


class SchoolUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None


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
