from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole, VerificationStatus

_SELF_ASSIGNABLE_ROLES = {UserRole.VOLUNTEER, UserRole.NEEDY, UserRole.NEEDY_PROXY}


class UserCreate(BaseModel):
    name: str = Field(max_length=100)
    role: UserRole
    phone: str | None = Field(None, max_length=20)
    bio: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=300)

    @field_validator("role")
    @classmethod
    def restrict_self_assignable_roles(cls, v: UserRole) -> UserRole:
        if v not in _SELF_ASSIGNABLE_ROLES:
            allowed = ", ".join(sorted(r.value for r in _SELF_ASSIGNABLE_ROLES))
            raise ValueError(f"Cannot self-assign role '{v}'. Allowed: {allowed}")
        return v


class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=500)
    bio: str | None = Field(None, max_length=500)
    address: str | None = Field(None, max_length=300)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    verification_status: VerificationStatus
    school_id: str | None = None
    school_issued_id: str | None = None
    school_email: str | None = None
    address: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
