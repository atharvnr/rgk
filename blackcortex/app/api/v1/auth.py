from fastapi import APIRouter, Request

from app.middleware.rate_limit import limiter
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, data: UserCreate):
    user = await user_service.create_user(data)
    return _to_response(user)


def _to_response(user) -> dict:
    return {
        "id": str(user.id),
        "auth0_id": user.auth0_id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "phone": user.phone,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "school_id": user.school_id,
        "address": user.address,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }
