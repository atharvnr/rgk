from fastapi import APIRouter, Depends, Query

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.schemas.school import SchoolCreate, SchoolHoursResponse, SchoolResponse, SchoolUpdate
from app.services import school_service
from app.utils.exceptions import ForbiddenError

router = APIRouter(prefix="/schools", tags=["schools"])


def _to_response(school) -> dict:
    return {
        "id": str(school.id),
        "name": school.name,
        "address": school.address,
        "city": school.city,
        "state": school.state,
        "zip_code": school.zip_code,
        "contact_email": school.contact_email,
        "contact_phone": school.contact_phone,
        "admin_ids": school.admin_ids,
        "is_active": school.is_active,
        "created_at": school.created_at,
        "updated_at": school.updated_at,
    }


def _user_to_response(user) -> dict:
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


@router.post("/", response_model=SchoolResponse, status_code=201)
async def create_school(
    data: SchoolCreate,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.create_school(data, user)
    return _to_response(school)


@router.get("/")
async def list_schools(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    _: User = Depends(get_current_user),
):
    schools, total = await school_service.list_schools(skip, limit)
    return {
        "items": [_to_response(s) for s in schools],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{school_id}", response_model=SchoolResponse)
async def get_school(school_id: str, _: User = Depends(get_current_user)):
    school = await school_service.get_school_by_id(school_id)
    return _to_response(school)


@router.put("/{school_id}", response_model=SchoolResponse)
async def update_school(
    school_id: str,
    data: SchoolUpdate,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.get_school_by_id(school_id)
    if str(user.id) not in school.admin_ids:
        raise ForbiddenError("You are not an admin of this school")
    updated = await school_service.update_school(school, data)
    return _to_response(updated)


@router.get("/{school_id}/students")
async def get_school_students(
    school_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.get_school_by_id(school_id)
    if str(user.id) not in school.admin_ids:
        raise ForbiddenError("You are not an admin of this school")
    students, total = await school_service.get_school_students(school_id, skip, limit)
    return {
        "items": [_user_to_response(s) for s in students],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{school_id}/hours", response_model=SchoolHoursResponse)
async def get_school_hours(
    school_id: str,
    _: User = Depends(get_current_user),
):
    return await school_service.get_school_hours(school_id)
