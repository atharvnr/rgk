import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole
from app.models.volunteer_request import RequestCategory, RequestStatus, VolunteerRequest
from tests.conftest import _make_app


@pytest.fixture
async def student_with_request(mock_redis):
    """Create a student + an assigned request so sessions can be created."""
    student = User(
        auth0_id="auth0|stud_sess",
        email="stud_sess@example.com",
        name="Session Student",
        role=UserRole.STUDENT,
        school_id="school_sess",
    )
    await student.insert()

    vr = VolunteerRequest(
        elder_id="elder_sess_id",
        title="Help with tech",
        description="Set up tablet",
        category=RequestCategory.TECH_HELP,
        status=RequestStatus.ASSIGNED,
        assigned_student_id=str(student.id),
    )
    await vr.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: student

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, student, vr


@pytest.fixture
async def school_admin_for_approval(mock_redis):
    admin = User(
        auth0_id="auth0|admin_approve",
        email="admin_approve@school.org",
        name="Approver Admin",
        role=UserRole.SCHOOL_ADMIN,
        school_id="school_sess",
    )
    await admin.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, admin


@pytest.mark.asyncio
async def test_create_session(student_with_request):
    client, student, vr = student_with_request
    resp = await client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 2.5,
            "date": "2026-02-14",
            "notes": "Helped set up email on tablet",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["hours_logged"] == 2.5
    assert data["student_id"] == str(student.id)
    assert data["status"] == "pending_approval"


@pytest.mark.asyncio
async def test_list_sessions(student_with_request):
    client, _, vr = student_with_request
    await client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 1.0,
            "date": "2026-02-14",
        },
    )

    resp = await client.get("/api/v1/sessions/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_approve_session(student_with_request, school_admin_for_approval):
    student_client, _, vr = student_with_request

    resp = await student_client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 3.0,
            "date": "2026-02-14",
        },
    )
    session_id = resp.json()["id"]

    admin_client, admin = school_admin_for_approval

    resp = await admin_client.put(
        f"/api/v1/sessions/{session_id}/approve",
        json={"approved": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert data["approved_by"] == str(admin.id)
