from app.models.user import User, UserRole
from app.models.school import School
from app.models.volunteer_request import RequestCategory, RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession


async def create_test_user(
    auth0_id: str = "auth0|user1",
    email: str = "user1@example.com",
    name: str = "Test User",
    role: UserRole = UserRole.STUDENT,
    school_id: str | None = "school123",
    **kwargs,
) -> User:
    user = User(
        auth0_id=auth0_id,
        email=email,
        name=name,
        role=role,
        school_id=school_id,
        **kwargs,
    )
    await user.insert()
    return user


async def create_test_school(
    name: str = "Test High School",
    admin_ids: list[str] | None = None,
    **kwargs,
) -> School:
    school = School(
        name=name,
        address="123 Main St",
        city="Springfield",
        state="IL",
        zip_code="62701",
        contact_email="admin@school.org",
        admin_ids=admin_ids or [],
        **kwargs,
    )
    await school.insert()
    return school


async def create_test_request(
    elder_id: str = "elder123",
    title: str = "Help with groceries",
    status: RequestStatus = RequestStatus.OPEN,
    **kwargs,
) -> VolunteerRequest:
    vr = VolunteerRequest(
        elder_id=elder_id,
        title=title,
        description="Need help carrying groceries from store",
        category=RequestCategory.ERRANDS,
        status=status,
        **kwargs,
    )
    await vr.insert()
    return vr


async def create_test_session(
    request_id: str = "req123",
    student_id: str = "student123",
    elder_id: str = "elder123",
    school_id: str = "school123",
    status: SessionStatus = SessionStatus.PENDING_APPROVAL,
    **kwargs,
) -> VolunteerSession:
    session = VolunteerSession(
        request_id=request_id,
        student_id=student_id,
        elder_id=elder_id,
        school_id=school_id,
        hours_logged=2.0,
        date="2026-02-14",
        **kwargs,
    )
    await session.insert()
    return session
