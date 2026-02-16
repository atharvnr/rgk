from fastapi import APIRouter, Depends, Query

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role
from app.models.school_association_request import AssociationStatus
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.school import SchoolCreate, SchoolHoursResponse, SchoolResponse, SchoolUpdate
from app.schemas.school_association_request import (
    AssociationRequestCreate,
    AssociationRequestResponse,
    AssociationReviewBody,
)
from app.services import association_service, rating_service, school_service
from app.utils.exceptions import ForbiddenError
from app.utils.response import paginated_response, rating_to_response, user_to_response

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


def _assoc_to_response(req) -> dict:
    return {
        "id": str(req.id),
        "user_id": req.user_id,
        "school_id": req.school_id,
        "role": req.role,
        "school_issued_id": req.school_issued_id,
        "school_email": req.school_email,
        "status": req.status,
        "rejection_reason": req.rejection_reason,
        "reviewed_by": req.reviewed_by,
        "reviewed_at": req.reviewed_at,
        "expires_at": req.expires_at,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
    }


def _require_school_admin_access(user: User, school) -> None:
    if user.role != UserRole.ROOT and str(user.id) not in school.admin_ids:
        raise ForbiddenError("You are not an admin of this school")


def _require_school_member_access(user: User, school_id: str) -> None:
    if user.role != UserRole.ROOT and user.school_id != school_id:
        raise ForbiddenError("You are not a member of this school")


@router.post("/", response_model=SchoolResponse, status_code=201)
async def create_school(
    data: SchoolCreate,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN, UserRole.ROOT)),
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
    return paginated_response(schools, total, skip, limit, _to_response)


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
    _require_school_admin_access(user, school)
    updated = await school_service.update_school(school, data)
    return _to_response(updated)


@router.get("/{school_id}/students")
async def get_school_students(
    school_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER)),
):
    _require_school_member_access(user, school_id)
    members, total = await school_service.get_school_members(
        school_id, skip, limit, role=UserRole.VOLUNTEER
    )
    return paginated_response(members, total, skip, limit, user_to_response)


@router.get("/{school_id}/hours", response_model=SchoolHoursResponse)
async def get_school_hours(
    school_id: str,
    _: User = Depends(get_current_user),
):
    return await school_service.get_school_hours(school_id)


# --- Association Requests ---


@router.post(
    "/{school_id}/association-requests",
    response_model=AssociationRequestResponse,
    status_code=201,
)
async def create_association_request(
    school_id: str,
    data: AssociationRequestCreate,
    user: User = Depends(
        require_role(UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER, UserRole.VOLUNTEER)
    ),
):
    # Validate school exists
    await school_service.get_school_by_id(school_id)
    req = await association_service.create_association_request(school_id, data, user)
    return _assoc_to_response(req)


@router.get("/{school_id}/association-requests")
async def list_association_requests(
    school_id: str,
    status: AssociationStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.get_school_by_id(school_id)
    _require_school_admin_access(user, school)
    items, total = await association_service.list_association_requests(
        school_id, status, skip, limit
    )
    return paginated_response(items, total, skip, limit, _assoc_to_response)


@router.put(
    "/{school_id}/association-requests/{req_id}",
    response_model=AssociationRequestResponse,
)
async def review_association_request(
    school_id: str,
    req_id: str,
    body: AssociationReviewBody,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.get_school_by_id(school_id)
    _require_school_admin_access(user, school)
    # B6: Pass expected_school_id for cross-school validation
    req = await association_service.review_association_request(
        req_id, body.approved, user, body.rejection_reason,
        expected_school_id=school_id,
    )
    return _assoc_to_response(req)


# --- Dashboard ---


@router.get("/{school_id}/dashboard")
async def get_school_dashboard(
    school_id: str,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER)),
):
    _require_school_member_access(user, school_id)

    school = await school_service.get_school_by_id(school_id)
    hours_data = await school_service.get_school_hours(school_id)
    members, total_members = await school_service.get_school_members(school_id)

    pending_sessions = await VolunteerSession.find(
        VolunteerSession.school_id == school_id,
        VolunteerSession.status == SessionStatus.PENDING_APPROVAL,
    ).count()

    _, pending_assoc_count = await association_service.list_association_requests(
        school_id, AssociationStatus.PENDING, limit=1
    )

    return {
        "school_name": school.name,
        "total_hours": hours_data.total_hours,
        "approved_sessions": hours_data.approved_sessions,
        "total_members": total_members,
        "pending_session_approvals": pending_sessions,
        "pending_association_requests": pending_assoc_count,
    }


# --- Ratings ---


@router.get("/{school_id}/ratings")
async def get_school_ratings(
    school_id: str,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER)),
):
    _require_school_member_access(user, school_id)

    ratings = await rating_service.get_ratings_for_school(school_id)
    return [rating_to_response(r) for r in ratings]


# --- Remove user ---


@router.delete("/{school_id}/users/{user_id}", status_code=204)
async def remove_user_from_school(
    school_id: str,
    user_id: str,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    school = await school_service.get_school_by_id(school_id)
    _require_school_admin_access(user, school)
    await school_service.remove_user_from_school(school_id, user_id)
