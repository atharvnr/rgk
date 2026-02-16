from datetime import UTC, datetime

from beanie.operators import In

from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.school import SchoolCreate, SchoolHoursResponse, SchoolUpdate
from app.utils.db import get_document_by_id
from app.utils.exceptions import BadRequestError, NotFoundError


async def create_school(data: SchoolCreate, admin_user: User) -> School:
    school = School(**data.model_dump(), admin_ids=[str(admin_user.id)])
    await school.insert()
    return school


async def get_school_by_id(school_id: str) -> School:
    return await get_document_by_id(School, school_id, "School")


async def list_schools(skip: int = 0, limit: int = 20) -> tuple[list[School], int]:
    query = School.find(School.is_active == True)  # noqa: E712
    total = await query.count()
    schools = await query.skip(skip).limit(limit).to_list()
    return schools, total


async def update_school(school: School, data: SchoolUpdate) -> School:
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await school.set(update_data)
    return school


async def get_school_members(
    school_id: str,
    skip: int = 0,
    limit: int = 20,
    role: UserRole | None = None,
) -> tuple[list[User], int]:
    filters = [
        User.school_id == school_id,
        User.is_active == True,  # noqa: E712
    ]
    if role is not None:
        filters.append(User.role == role)
    else:
        # Get volunteers, school_users (and school_admin)
        filters.append(
            In(User.role, [UserRole.VOLUNTEER, UserRole.SCHOOL_USER, UserRole.SCHOOL_ADMIN])
        )

    query = User.find(*filters)
    total = await query.count()
    members = await query.skip(skip).limit(limit).to_list()
    return members, total


async def get_school_hours(school_id: str) -> SchoolHoursResponse:
    school = await get_school_by_id(school_id)
    sessions = await VolunteerSession.find(
        VolunteerSession.school_id == school_id,
        VolunteerSession.status == SessionStatus.APPROVED,
    ).to_list()

    total_hours = sum(s.hours_logged for s in sessions)

    return SchoolHoursResponse(
        school_id=str(school.id),
        school_name=school.name,
        total_hours=total_hours,
        approved_sessions=len(sessions),
    )


_SCHOOL_ADMIN_PROMOTABLE_ROLES = {
    UserRole.VOLUNTEER, UserRole.SCHOOL_USER,
}


async def assign_school_admin(school_id: str, user_id: str) -> School:
    school = await get_school_by_id(school_id)
    user = await User.get(user_id)
    if user is None:
        raise NotFoundError("User not found")

    # W4: Validate user's current role is compatible
    if user.role not in _SCHOOL_ADMIN_PROMOTABLE_ROLES:
        raise BadRequestError(
            f"Cannot promote user with role '{user.role}' to school admin"
        )

    # Check if school already has an admin
    existing_admin = await User.find_one(
        User.school_id == school_id,
        User.role == UserRole.SCHOOL_ADMIN,
        User.is_active == True,  # noqa: E712
    )
    if existing_admin:
        raise BadRequestError("School already has an admin")

    # Set user as school admin
    await user.set(
        {
            "role": UserRole.SCHOOL_ADMIN,
            "school_id": school_id,
            "verification_status": "not_required",
            "updated_at": datetime.now(UTC),
        }
    )

    # Add to school admin_ids
    if str(user.id) not in school.admin_ids:
        school.admin_ids.append(str(user.id))
        await school.set(
            {
                "admin_ids": school.admin_ids,
                "updated_at": datetime.now(UTC),
            }
        )

    return school


async def remove_user_from_school(school_id: str, user_id: str) -> None:
    user = await User.get(user_id)
    if user is None:
        raise NotFoundError("User not found")
    if user.school_id != school_id:
        raise BadRequestError("User is not a member of this school")

    # B12: Clear all school-related fields and reset role
    await user.set(
        {
            "school_id": None,
            "school_issued_id": None,
            "school_email": None,
            "role": UserRole.VOLUNTEER,
            "updated_at": datetime.now(UTC),
        }
    )

    # Remove from admin_ids if present
    school = await get_school_by_id(school_id)
    if str(user.id) in school.admin_ids:
        school.admin_ids.remove(str(user.id))
        await school.set(
            {
                "admin_ids": school.admin_ids,
                "updated_at": datetime.now(UTC),
            }
        )
