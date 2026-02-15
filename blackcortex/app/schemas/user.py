from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserCreate(BaseModel):
    auth0_id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: str | None = None
    bio: str | None = None
    school_id: str | None = None
    address: str | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    school_id: str | None = None
    address: str | None = None


class UserResponse(BaseModel):
    id: str
    auth0_id: str
    email: EmailStr
    name: str
    role: UserRole
    phone: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    school_id: str | None = None
    address: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
