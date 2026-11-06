import re
from datetime import UTC, datetime

from beanie.operators import RegEx

from app.models.school import School
from app.models.user import User, UserRole, VerificationStatus
from app.schemas.admin import AdminUserUpdate
from app.schemas.school import SchoolCreate, SchoolUpdate
from app.services import school_service
from app.services.user_service import _verification_status_for_role, get_user_by_id
from app.utils.exceptions import BadRequestError

_SCHOOL_ROLES = {UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER, UserRole.VOLUNTEER}
_NO_SCHOOL_ROLES = {UserRole.NEEDY, UserRole.NEEDY_PROXY, UserRole.ROOT}
_NOT_REQUIRED_ROLES = {UserRole.ROOT, UserRole.SCHOOL_ADMIN, UserRole.SCHOOL_USER}


async def list_users(
    skip: int = 0,
    limit: int = 20,
    q: str | None = None,
    role: UserRole | None = None,
    verification_status: VerificationStatus | None = None,
    is_active: bool | None = None,
    school_id: str | None = None,
) -> tuple[list[User], int]:
    filters: list = []
    if q:
        pattern = re.escape(q.strip())
        filters.append(
            {
                "$or": [
                    {"name": {"$regex": pattern, "$options": "i"}},
                    {"email": {"$regex": pattern, "$options": "i"}},
                ]
            }
        )
    if role is not None:
        filters.append(User.role == role)
    if verification_status is not None:
        filters.append(User.verification_status == verification_status)
    if is_active is not None:
        filters.append(User.is_active == is_active)
    if school_id is not None:
        filters.append(User.school_id == school_id)

    query = User.find(*filters)
    total = await query.count()
    items = await query.sort("-created_at").skip(skip).limit(limit).to_list()
    return items, total


async def _remove_from_school_admins(user_id: str, except_school_id: str | None = None) -> None:
    schools = await School.find({"admin_ids": user_id}).to_list()
    for school in schools:
        if except_school_id is not None and str(school.id) == except_school_id:
            continue
        school.admin_ids = [a for a in school.admin_ids if a != user_id]
        await school.set({"admin_ids": school.admin_ids, "updated_at": datetime.now(UTC)})


async def update_user(actor: User, user_id: str, data: AdminUserUpdate) -> tuple[User, list[str]]:
    target = await get_user_by_id(user_id)
    changes = data.model_dump(exclude_unset=True)
    is_self = str(actor.id) == str(target.id)

    if is_self:
        if "role" in changes and changes["role"] != target.role:
            raise BadRequestError("You cannot change your own role")
        if changes.get("is_active") is False:
            raise BadRequestError("You cannot deactivate your own account")

    old_role = target.role
    new_role = changes.get("role") or old_role
    role_changed = new_role != old_role

    # Fields that may not be null on the model
    for key in ("name", "role", "verification_status", "is_active"):
        if key in changes and changes[key] is None:
            del changes[key]

    if "school_id" in changes and changes["school_id"] is not None and new_role in _SCHOOL_ROLES:
        await school_service.get_school_by_id(changes["school_id"])  # 404 if missing

    if new_role in _NO_SCHOOL_ROLES:
        changes["school_id"] = None
        changes["school_issued_id"] = None
        changes["school_email"] = None

    if role_changed and "verification_status" not in changes and new_role in _NOT_REQUIRED_ROLES:
        changes["verification_status"] = _verification_status_for_role(new_role)

    new_school_id = changes["school_id"] if "school_id" in changes else target.school_id

    changed_fields = [k for k, v in changes.items() if getattr(target, k) != v]
    changes["updated_at"] = datetime.now(UTC)
    await target.set(changes)

    uid = str(target.id)
    if new_role == UserRole.SCHOOL_ADMIN:
        if new_school_id is not None:
            school = await school_service.get_school_by_id(new_school_id)
            if uid not in school.admin_ids:
                school.admin_ids.append(uid)
                await school.set({"admin_ids": school.admin_ids, "updated_at": datetime.now(UTC)})
        await _remove_from_school_admins(uid, except_school_id=new_school_id)
    else:
        await _remove_from_school_admins(uid)

    return target, changed_fields


async def delete_user(actor: User, user_id: str) -> str:
    target = await get_user_by_id(user_id)
    if str(actor.id) == str(target.id):
        raise BadRequestError("You cannot delete your own account")
    email: str = str(target.email)
    await _remove_from_school_admins(str(target.id))
    await target.delete()
    return email


async def list_schools(
    skip: int = 0,
    limit: int = 20,
    include_inactive: bool = False,
    q: str | None = None,
) -> tuple[list[School], int]:
    filters: list = []
    if not include_inactive:
        filters.append(School.is_active == True)  # noqa: E712
    if q:
        filters.append(RegEx(School.name, re.escape(q.strip()), "i"))
    query = School.find(*filters)
    total = await query.count()
    items = await query.sort("-created_at").skip(skip).limit(limit).to_list()
    return items, total


async def create_school(data: SchoolCreate) -> School:
    school = School(**data.model_dump(), admin_ids=[])
    await school.insert()
    return school


async def update_school(school_id: str, data: SchoolUpdate) -> tuple[School, list[str]]:
    school = await school_service.get_school_by_id(school_id)
    changed = list(data.model_dump(exclude_unset=True).keys())
    updated = await school_service.update_school(school, data)
    return updated, changed


async def delete_school(school_id: str) -> School:
    school = await school_service.get_school_by_id(school_id)
    await school.set({"is_active": False, "updated_at": datetime.now(UTC)})
    return school
