from typing import Literal

from pydantic import BaseModel, Field

from app.models.user import UserRole, VerificationStatus


class PlatformAnalyticsResponse(BaseModel):
    total_users: int
    total_schools: int
    total_volunteers: int
    total_needy: int
    total_hours: float
    total_sessions: int
    pending_verifications: int
    pending_associations: int


class VerifyUserBody(BaseModel):
    verification_status: Literal[
        VerificationStatus.VERIFIED,
        VerificationStatus.VERIFICATION_FAILED,
    ]


class AssignAdminBody(BaseModel):
    user_id: str


class AdminUserUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    bio: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=300)
    role: UserRole | None = None
    school_id: str | None = None
    school_issued_id: str | None = Field(None, max_length=100)
    verification_status: VerificationStatus | None = None
    is_active: bool | None = None
