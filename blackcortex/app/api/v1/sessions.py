from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth.jwt import get_current_user
from app.auth.permissions import require_role
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus
from app.schemas.volunteer_session import VolunteerSessionCreate, VolunteerSessionResponse
from app.services import session_service

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
        "approved_by": s.approved_by,
        "approved_at": s.approved_at,
        "created_at": s.created_at,
        "updated_at": s.updated_at,
    }


class ApproveBody(BaseModel):
    approved: bool


@router.post("/", response_model=VolunteerSessionResponse, status_code=201)
async def create_session(
    data: VolunteerSessionCreate,
    user: User = Depends(require_role(UserRole.STUDENT)),
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
    # Students see their own; school admins see their school's
    student_id = str(user.id) if user.role == UserRole.STUDENT else None
    school_id = user.school_id if user.role == UserRole.SCHOOL_ADMIN else None

    items, total = await session_service.list_sessions(skip, limit, student_id, school_id, status)
    return {
        "items": [_to_response(s) for s in items],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{session_id}", response_model=VolunteerSessionResponse)
async def get_session(session_id: str, _: User = Depends(get_current_user)):
    session = await session_service.get_session_by_id(session_id)
    return _to_response(session)


@router.put("/{session_id}/approve", response_model=VolunteerSessionResponse)
async def approve_session(
    session_id: str,
    body: ApproveBody,
    user: User = Depends(require_role(UserRole.SCHOOL_ADMIN)),
):
    session = await session_service.get_session_by_id(session_id)
    updated = await session_service.approve_session(session, body.approved, user)
    return _to_response(updated)
