from fastapi import APIRouter, Depends, Query

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus
from app.schemas.rating import RatingCreate, RatingResponse
from app.schemas.volunteer_session import (
    SessionApproveBody,
    VolunteerSessionCreate,
    VolunteerSessionResponse,
)
from app.services import rating_service, session_service
from app.utils.exceptions import ForbiddenError
from app.utils.response import paginated_response, rating_to_response

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _to_response(s) -> dict:
    return {
        "id": str(s.id),
        "request_id": s.request_id,
        "student_id": s.student_id,
        "elder_id": s.elder_id,
        "school_id": s.school_id,
        "hours_logged": s.hours_logged,
        "date": s.date,
        "notes": s.notes,
        "status": s.status,
        "elder_confirmed": s.elder_confirmed,
        "elder_confirmed_at": s.elder_confirmed_at,
        "elder_confirmed_by": s.elder_confirmed_by,
        "approved_by": s.approved_by,
        "approved_at": s.approved_at,
        "rejection_reason": s.rejection_reason,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


@router.post("/", response_model=VolunteerSessionResponse, status_code=201)
async def create_session(
    data: VolunteerSessionCreate,
    user: User = Depends(require_role(UserRole.VOLUNTEER)),
):
    session = await session_service.create_session(data, user)
    return _to_response(session)


@router.get("/")
async def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: SessionStatus | None = None,
    user: User = Depends(get_current_user),
):
    student_id = None
    school_id = None
    elder_id = None

    if user.role == UserRole.VOLUNTEER:
        student_id = str(user.id)
    elif user.role in (UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER):
        school_id = user.school_id
    elif user.role == UserRole.NEEDY:
        # B4: Scope to elder's own sessions
        elder_id = str(user.id)
    elif user.role == UserRole.NEEDY_PROXY:
        # B4: Scope to linked elder's sessions
        from app.services.proxy_service import get_needy_id_for_proxy

        elder_id = await get_needy_id_for_proxy(str(user.id))
        if elder_id is None:
            return paginated_response([], 0, skip, limit)
    # ROOT sees all — no filter

    items, total = await session_service.list_sessions(
        skip=skip,
        limit=limit,
        student_id=student_id,
        school_id=school_id,
        elder_id=elder_id,
        status=status,
    )
    return paginated_response(items, total, skip, limit, _to_response)


@router.get("/{session_id}", response_model=VolunteerSessionResponse)
async def get_session(session_id: str, user: User = Depends(get_current_user)):
    session = await session_service.get_session_by_id(session_id)
    # W3: IDOR — scope by role
    if user.role == UserRole.VOLUNTEER and session.student_id != str(user.id):
        raise ForbiddenError("You can only view your own sessions")
    elif user.role in (UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER):
        if session.school_id != user.school_id:
            raise ForbiddenError("Session does not belong to your school")
    elif user.role == UserRole.NEEDY and session.elder_id != str(user.id):
        raise ForbiddenError("You can only view your own sessions")
    elif user.role == UserRole.NEEDY_PROXY:
        from app.services.proxy_service import get_needy_id_for_proxy

        elder_id = await get_needy_id_for_proxy(str(user.id))
        if elder_id is None or session.elder_id != elder_id:
            raise ForbiddenError("You can only view sessions for your linked elder")
    return _to_response(session)


@router.put("/{session_id}/elder-confirm", response_model=VolunteerSessionResponse)
async def elder_confirm_session(
    session_id: str,
    user: User = Depends(require_role(UserRole.NEEDY, UserRole.NEEDY_PROXY)),
):
    session = await session_service.get_session_by_id(session_id)
    updated = await session_service.elder_confirm_session(session, user)
    return _to_response(updated)


@router.put("/{session_id}/approve", response_model=VolunteerSessionResponse)
async def approve_session(
    session_id: str,
    body: SessionApproveBody,
    user: User = Depends(
        require_role(UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER)
    ),
):
    session = await session_service.get_session_by_id(session_id)
    updated = await session_service.approve_session(
        session, body.approved, user, body.rejection_reason
    )
    return _to_response(updated)


@router.post("/{session_id}/rating", response_model=RatingResponse, status_code=201)
async def create_rating(
    session_id: str,
    data: RatingCreate,
    user: User = Depends(require_role(UserRole.NEEDY, UserRole.NEEDY_PROXY)),
):
    session = await session_service.get_session_by_id(session_id)
    rating = await rating_service.create_rating(session, data, user)
    return rating_to_response(rating)
