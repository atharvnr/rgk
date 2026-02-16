from typing import Literal

from pydantic import BaseModel

from app.models.user import VerificationStatus


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
