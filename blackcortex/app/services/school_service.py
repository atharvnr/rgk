from datetime import UTC, datetime

from beanie import PydanticObjectId

from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus, VolunteerSession
from app.schemas.school import SchoolCreate, SchoolHoursResponse, SchoolUpdate
from app.utils.exceptions import NotFoundError


async def create_school(data: SchoolCreate, admin_user: User) -> School:
    school = School(**data.model_dump(), admin_ids=[str(admin_user.id)])
    await school.insert()
    return school


async def get_school_by_id(school_id: str) -> School:
    try:
        school = await School.get(PydanticObjectId(school_id))
    except Exception:
        raise NotFoundError("School not found")
    if school is None:
        raise NotFoundError("School not found")
    return school


async def list_schools(skip: int = 0, limit: int = 20) -> tuple[list[School], int]:
    total = await School.find(School.is_active == True).count()  # noqa: E712
    schools = (
        await School.find(School.is_active == True)  # noqa: E712
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return schools, total


async def update_school(school: School, data: SchoolUpdate) -> School:
    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        update_data["updated_at"] = datetime.now(UTC)
        await school.set(update_data)
    return school


async def get_school_students(
    school_id: str, skip: int = 0, limit: int = 20
) -> tuple[list[User], int]:
    total = await User.find(
        User.school_id == school_id,
        User.role == UserRole.STUDENT,
        User.is_active == True,  # noqa: E712
    ).count()
    students = (
        await User.find(
            User.school_id == school_id,
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return students, total


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
