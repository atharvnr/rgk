from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.permissions import require_role
from app.models.school_association_request import (
    AssociationStatus,
    SchoolAssociationRequest,
)
from app.models.user import User, UserRole, VerificationStatus
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.admin import (
    AdminUserUpdate,
    AssignAdminBody,
    PlatformAnalyticsResponse,
    VerifyUserBody,
)
from app.schemas.app_config import AppConfigCreate, AppConfigResponse, AppConfigUpdate
from app.schemas.school import SchoolCreate, SchoolResponse, SchoolUpdate
from app.schemas.user import UserResponse
from app.schemas.verification import VerificationRequestResolve
from app.services import (
    admin_service,
    audit_service,
    config_service,
    school_service,
    user_service,
)
from app.services.verification_service import (
    list_verification_requests,
    resolve_verification_request,
)
from app.utils.response import model_to_response, paginated_response, user_to_response

router = APIRouter(prefix="/admin", tags=["admin"])


def _config_to_response(c) -> dict:
    return {
        "id": str(c.id),
        "key": c.key,
        "value": c.value,
        "description": c.description,
        "updated_by": c.updated_by,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    }


def _audit_to_response(a) -> dict:
    return {
        "id": str(a.id),
        "actor_id": a.actor_id,
        "actor_role": a.actor_role,
        "action": a.action,
        "target_type": a.target_type,
        "target_id": a.target_id,
        "details": a.details,
        "timestamp": a.timestamp,
    }


# --- Config CRUD ---


@router.post("/config", response_model=AppConfigResponse, status_code=201)
async def create_config(
    data: AppConfigCreate,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    config = await config_service.create_config(data, str(user.id))
    await audit_service.log_action(user, "config.create", "config", data.key)
    return _config_to_response(config)


@router.get("/config")
async def list_configs(
    user: User = Depends(require_role(UserRole.ROOT)),
):
    configs = await config_service.list_configs()
    return [_config_to_response(c) for c in configs]


@router.get("/config/{key}", response_model=AppConfigResponse)
async def get_config(
    key: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    config = await config_service.get_config_by_key(key)
    return _config_to_response(config)


@router.put("/config/{key}", response_model=AppConfigResponse)
async def update_config(
    key: str,
    data: AppConfigUpdate,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    config = await config_service.update_config(key, data, str(user.id))
    await audit_service.log_action(user, "config.update", "config", key)
    return _config_to_response(config)


@router.delete("/config/{key}", status_code=204)
async def delete_config(
    key: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    await config_service.delete_config(key)
    await audit_service.log_action(user, "config.delete", "config", key)


# --- Analytics ---


@router.get("/analytics", response_model=PlatformAnalyticsResponse)
async def get_analytics(
    user: User = Depends(require_role(UserRole.ROOT)),
):
    users, total_users = await user_service.list_users(limit=1)
    _, total_schools = await school_service.list_schools(limit=1)

    volunteers = await User.find(User.role == UserRole.VOLUNTEER).count()
    needy = await User.find(User.role == UserRole.NEEDY).count()

    # TODO: Use MongoDB aggregation pipeline in production for large datasets
    approved = await VolunteerSession.find(
        VolunteerSession.status == SessionStatus.APPROVED
    ).to_list()
    total_hours = sum(s.hours_logged for s in approved)

    total_sessions = await VolunteerSession.find().count()

    pending_verifications = await User.find(
        User.verification_status == VerificationStatus.PENDING_VERIFICATION
    ).count()

    pending_associations = await SchoolAssociationRequest.find(
        SchoolAssociationRequest.status == AssociationStatus.PENDING
    ).count()

    return {
        "total_users": total_users,
        "total_schools": total_schools,
        "total_volunteers": volunteers,
        "total_needy": needy,
        "total_hours": total_hours,
        "total_sessions": total_sessions,
        "pending_verifications": pending_verifications,
        "pending_associations": pending_associations,
    }


# --- Audit Log ---


@router.get("/audit-log")
async def get_audit_log(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    action: str | None = None,
    actor_id: str | None = None,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    items, total = await audit_service.list_audit_logs(skip, limit, action, actor_id)
    return paginated_response(items, total, skip, limit, _audit_to_response)


# --- User CRUD ---


@router.get("/users")
async def admin_list_users(
    q: str | None = None,
    role: UserRole | None = None,
    verification_status: VerificationStatus | None = None,
    is_active: bool | None = None,
    school_id: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role(UserRole.ROOT)),
):
    items, total = await admin_service.list_users(
        skip, limit, q, role, verification_status, is_active, school_id
    )
    return paginated_response(items, total, skip, limit, user_to_response)


@router.get("/users/{user_id}", response_model=UserResponse)
async def admin_get_user(
    user_id: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    return user_to_response(await user_service.get_user_by_id(user_id))


@router.put("/users/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: str,
    data: AdminUserUpdate,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    updated, changed = await admin_service.update_user(user, user_id, data)
    await audit_service.log_action(user, "user.admin_update", "user", user_id, {"fields": changed})
    return user_to_response(updated)


@router.delete("/users/{user_id}", status_code=204)
async def admin_delete_user(
    user_id: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    email = await admin_service.delete_user(user, user_id)
    await audit_service.log_action(user, "user.delete", "user", user_id, {"email": email})


# --- School CRUD ---


def _school_to_response(school) -> dict:
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


@router.get("/schools")
async def admin_list_schools(
    include_inactive: bool = False,
    q: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(require_role(UserRole.ROOT)),
):
    items, total = await admin_service.list_schools(skip, limit, include_inactive, q)
    return paginated_response(items, total, skip, limit, _school_to_response)


@router.post("/schools", response_model=SchoolResponse, status_code=201)
async def admin_create_school(
    data: SchoolCreate,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    school = await admin_service.create_school(data)
    await audit_service.log_action(
        user, "school.create", "school", str(school.id), {"name": school.name}
    )
    return _school_to_response(school)


@router.put("/schools/{school_id}", response_model=SchoolResponse)
async def admin_update_school(
    school_id: str,
    data: SchoolUpdate,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    school, changed = await admin_service.update_school(school_id, data)
    await audit_service.log_action(user, "school.update", "school", school_id, {"fields": changed})
    return _school_to_response(school)


@router.delete("/schools/{school_id}", status_code=204)
async def admin_delete_school(
    school_id: str,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    school = await admin_service.delete_school(school_id)
    await audit_service.log_action(
        user, "school.delete", "school", school_id, {"name": school.name}
    )


# --- User Verification ---


@router.put("/users/{user_id}/verify")
async def verify_user(
    user_id: str,
    body: VerifyUserBody,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    updated = await user_service.verify_user(user_id, body.verification_status)
    await audit_service.log_action(
        user,
        "user.verify",
        "user",
        user_id,
        {"new_status": body.verification_status},
    )
    return {
        "id": str(updated.id),
        "verification_status": updated.verification_status,
    }


@router.get("/verification-requests")
async def admin_list_verification_requests(user: User = Depends(require_role(UserRole.ROOT))):
    items, _ = await list_verification_requests()
    # return array of verification request responses
    return [model_to_response(i) for i in items]


@router.put("/verification-requests/{request_id}/resolve")
async def admin_resolve_verification_request(
    request_id: str,
    data: VerificationRequestResolve,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    req = await resolve_verification_request(request_id, str(user.id), data.notes)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return model_to_response(req)


# --- Assign School Admin ---


@router.put("/schools/{school_id}/assign-admin")
async def assign_school_admin(
    school_id: str,
    body: AssignAdminBody,
    user: User = Depends(require_role(UserRole.ROOT)),
):
    school = await school_service.assign_school_admin(school_id, body.user_id)
    await audit_service.log_action(
        user,
        "school.assign_admin",
        "school",
        school_id,
        {"admin_user_id": body.user_id},
    )
    return {
        "id": str(school.id),
        "name": school.name,
        "admin_ids": school.admin_ids,
    }
