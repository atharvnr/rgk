from fastapi import APIRouter, Depends

from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


def _to_response(user: User) -> dict:
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


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return _to_response(user)


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, user: User = Depends(get_current_user)):
    updated = await user_service.update_user(user, data)
    return _to_response(updated)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, _: User = Depends(get_current_user)):
    user = await user_service.get_user_by_id(user_id)
    return _to_response(user)
