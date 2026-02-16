from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.school_association_request import AssociationStatus


class AssociationRequestCreate(BaseModel):
    school_issued_id: str = Field(max_length=50)
    school_email: EmailStr


class AssociationReviewBody(BaseModel):
    approved: bool
    rejection_reason: str | None = Field(None, max_length=500)


class AssociationRequestResponse(BaseModel):
    id: str
    user_id: str
    school_id: str
    role: str
    school_issued_id: str
    school_email: str
    status: AssociationStatus
    rejection_reason: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
