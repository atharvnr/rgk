from fastapi import APIRouter, Depends

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole
from app.schemas.rating import RatingResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services import rating_service, user_service
from app.utils.exceptions import ForbiddenError
from app.utils.response import rating_to_response, user_to_response

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user_to_response(user)


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, user: User = Depends(get_current_user)):
    updated = await user_service.update_user(user, data)
    return user_to_response(updated)


@router.get("/me/ratings", response_model=list[RatingResponse])
async def get_my_ratings(user: User = Depends(get_current_user)):
    ratings = await rating_service.get_ratings_for_volunteer(str(user.id))
    return [rating_to_response(r) for r in ratings]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, user: User = Depends(get_current_user)):
    # B2: Only self or root can view individual user profiles
    if user.role != UserRole.ROOT and str(user.id) != user_id:
        raise ForbiddenError("Access denied")
    target = await user_service.get_user_by_id(user_id)
    return user_to_response(target)
