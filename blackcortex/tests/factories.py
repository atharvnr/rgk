
from app.models.app_config import AppConfig
from app.models.audit_log import AuditLog
from app.models.proxy_link import ProxyLink, ProxyLinkStatus
from app.models.rating import Rating
from app.models.school import School
from app.models.school_association_request import SchoolAssociationRequest
from app.models.user import User, UserRole, VerificationStatus
from app.models.volunteer_request import RequestCategory, RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession


async def create_test_user(
    auth0_id: str = "auth0|user1",
    email: str = "user1@example.com",
    name: str = "Test User",
    role: UserRole = UserRole.VOLUNTEER,
    verification_status: VerificationStatus = VerificationStatus.VERIFIED,
    school_id: str | None = "school123",
    **kwargs,
) -> User:
    user = User(
        auth0_id=auth0_id,
        email=email,
        name=name,
        role=role,
        verification_status=verification_status,
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
    status: SessionStatus = SessionStatus.PENDING_ELDER_CONFIRMATION,
    **kwargs,
) -> VolunteerSession:
    session = VolunteerSession(
        request_id=request_id,
        student_id=student_id,
        elder_id=elder_id,
        school_id=school_id,
        hours_logged=2.0,
        date="2026-02-14",
        status=status,
        **kwargs,
    )
    await session.insert()
    return session


async def create_test_app_config(
    key: str = "test_config",
    value: dict | None = None,
    updated_by: str = "root123",
    **kwargs,
) -> AppConfig:
    config = AppConfig(
        key=key,
        value=value or {"enabled": True},
        updated_by=updated_by,
        **kwargs,
    )
    await config.insert()
    return config


async def create_test_proxy_link(
    proxy_user_id: str = "proxy123",
    needy_user_id: str = "needy123",
    status: ProxyLinkStatus = ProxyLinkStatus.PENDING,
    **kwargs,
) -> ProxyLink:
    link = ProxyLink(
        proxy_user_id=proxy_user_id,
        needy_user_id=needy_user_id,
        status=status,
        **kwargs,
    )
    await link.insert()
    return link


async def create_test_rating(
    session_id: str = "session123",
    request_id: str = "req123",
    volunteer_id: str = "volunteer123",
    rated_by: str = "needy123",
    rated_by_role: str = "needy",
    score: int = 5,
    **kwargs,
) -> Rating:
    rating = Rating(
        session_id=session_id,
        request_id=request_id,
        volunteer_id=volunteer_id,
        rated_by=rated_by,
        rated_by_role=rated_by_role,
        score=score,
        **kwargs,
    )
    await rating.insert()
    return rating


async def create_test_audit_log(
    actor_id: str = "root123",
    actor_role: str = "root",
    action: str = "user.verify",
    target_type: str = "user",
    target_id: str = "user123",
    **kwargs,
) -> AuditLog:
    log = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        **kwargs,
    )
    await log.insert()
    return log


async def create_test_association_request(
    user_id: str = "user123",
    school_id: str = "school123",
    role: str = "volunteer",
    **kwargs,
) -> SchoolAssociationRequest:
    req = SchoolAssociationRequest(
        user_id=user_id,
        school_id=school_id,
        role=role,
        school_issued_id="STU-001",
        school_email="user@school.edu",
        **kwargs,
    )
    await req.insert()
    return req
