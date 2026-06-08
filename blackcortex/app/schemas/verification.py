from pydantic import BaseModel
from datetime import datetime


class VerificationRequestCreate(BaseModel):
    message: str | None = None


class VerificationRequestResponse(BaseModel):
    id: str
    user_id: str
    user_email: str
    user_name: str | None = None
    phone: str | None = None
    message: str | None = None
    status: str
    admin_notes: str | None = None
    created_at: datetime
    resolved_by: str | None = None
    resolved_at: datetime | None = None


class VerificationRequestResolve(BaseModel):
    notes: str | None = None
