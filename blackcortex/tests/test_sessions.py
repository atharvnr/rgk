import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole, VerificationStatus
from app.models.volunteer_request import RequestCategory, RequestStatus, VolunteerRequest
from app.models.volunteer_session import SessionStatus, VolunteerSession
from tests.conftest import _make_app


@pytest.fixture
async def volunteer_with_request(mock_redis):
    """Create a volunteer + an assigned request so sessions can be created."""
    volunteer = User(
        auth0_id="auth0|vol_sess",
        email="vol_sess@example.com",
        name="Session Volunteer",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.VERIFIED,
        school_id="school_sess",
    )
    await volunteer.insert()

    vr = VolunteerRequest(
        elder_id="elder_sess_id",
        title="Help with tech",
        description="Set up tablet",
        category=RequestCategory.TECH_HELP,
        status=RequestStatus.ASSIGNED,
        assigned_student_id=str(volunteer.id),
    )
    await vr.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: volunteer

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, volunteer, vr


@pytest.fixture
async def school_admin_for_approval(mock_redis):
    admin = User(
        auth0_id="auth0|admin_approve",
        email="admin_approve@school.org",
        name="Approver Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
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
async def test_create_session(volunteer_with_request):
    client, volunteer, vr = volunteer_with_request
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
    assert data["student_id"] == str(volunteer.id)
    assert data["status"] == "pending_elder_confirmation"
    assert data["elder_confirmed"] is False


@pytest.mark.asyncio
async def test_list_sessions(volunteer_with_request):
    client, _, vr = volunteer_with_request
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
async def test_elder_confirm_and_approve_flow(
    volunteer_with_request, school_admin_for_approval, mock_redis
):
    """Full flow: volunteer logs → elder confirms → admin approves."""
    vol_client, volunteer, vr = volunteer_with_request

    # 1. Volunteer creates session
    resp = await vol_client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 3.0,
            "date": "2026-02-14",
        },
    )
    session_id = resp.json()["id"]
    assert resp.json()["status"] == "pending_elder_confirmation"

    # 2. Elder confirms
    elder = User(
        auth0_id="auth0|elder_confirm",
        email="elder_confirm@example.com",
        name="Elder Confirmer",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await elder.insert()

    # Update session elder_id to this elder
    session = await VolunteerSession.get(session_id)
    await session.set({"elder_id": str(elder.id)})

    elder_app = _make_app(mock_redis)
    elder_app.dependency_overrides[get_current_user] = lambda: elder

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=elder_app)
    async with AsyncClient(transport=transport, base_url="http://test") as elder_client:
        resp = await elder_client.put(f"/api/v1/sessions/{session_id}/elder-confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "pending_approval"
    assert resp.json()["elder_confirmed"] is True

    # 3. School admin approves
    admin_client, admin = school_admin_for_approval
    resp = await admin_client.put(
        f"/api/v1/sessions/{session_id}/approve",
        json={"approved": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert data["approved_by"] == str(admin.id)


@pytest.mark.asyncio
async def test_school_user_can_approve(volunteer_with_request, school_user_client, mock_redis):
    """School user can also approve sessions."""
    vol_client, _, vr = volunteer_with_request

    # Create session
    resp = await vol_client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 1.5,
            "date": "2026-02-14",
        },
    )
    session_id = resp.json()["id"]

    # Set to pending_approval (skip elder confirm for this test)
    session = await VolunteerSession.get(session_id)
    await session.set(
        {
            "status": SessionStatus.PENDING_APPROVAL,
            "elder_confirmed": True,
        }
    )

    su_client, su_user = school_user_client
    resp = await su_client.put(
        f"/api/v1/sessions/{session_id}/approve",
        json={"approved": True},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"


@pytest.mark.asyncio
async def test_reject_session_with_reason(volunteer_with_request, school_admin_for_approval):
    vol_client, _, vr = volunteer_with_request

    resp = await vol_client.post(
        "/api/v1/sessions/",
        json={
            "request_id": str(vr.id),
            "hours_logged": 1.0,
            "date": "2026-02-14",
        },
    )
    session_id = resp.json()["id"]

    # Set to pending_approval
    session = await VolunteerSession.get(session_id)
    await session.set(
        {
            "status": SessionStatus.PENDING_APPROVAL,
            "elder_confirmed": True,
        }
    )

    admin_client, _ = school_admin_for_approval
    resp = await admin_client.put(
        f"/api/v1/sessions/{session_id}/approve",
        json={"approved": False, "rejection_reason": "Hours seem too high"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Hours seem too high"


@pytest.mark.asyncio
async def test_needy_sees_only_own_sessions(needy_client):
    """B4: Needy user only sees sessions where they are the elder."""
    from tests.factories import create_test_session

    client, needy_user = needy_client

    # Create sessions: one for this elder, one for another
    await create_test_session(elder_id=str(needy_user.id), student_id="vol1")
    await create_test_session(elder_id="other_elder", student_id="vol2")

    resp = await client.get("/api/v1/sessions/")
    assert resp.status_code == 200
    data = resp.json()
    # Should only see the session for this elder
    assert data["total"] == 1
    assert data["items"][0]["elder_id"] == str(needy_user.id)


@pytest.mark.asyncio
async def test_proxy_without_link_gets_empty_sessions(needy_proxy_client):
    """B4: NEEDY_PROXY with no active link gets empty sessions list."""
    from tests.factories import create_test_session

    client, _ = needy_proxy_client
    await create_test_session()  # random session

    resp = await client.get("/api/v1/sessions/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_volunteer_cannot_view_other_session(volunteer_with_request):
    """W3: IDOR — volunteer can only view their own sessions."""
    from tests.factories import create_test_session

    other_session = await create_test_session(student_id="other_volunteer")
    client, _, _ = volunteer_with_request
    resp = await client.get(f"/api/v1/sessions/{other_session.id}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_needy_cannot_view_other_session(needy_client):
    """W3: IDOR — needy can only view sessions where they are the elder."""
    from tests.factories import create_test_session

    other_session = await create_test_session(elder_id="other_elder")
    client, _ = needy_client
    resp = await client.get(f"/api/v1/sessions/{other_session.id}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_school_user_cannot_view_other_school_session(school_user_client):
    """W3: IDOR — school user can only view sessions from their school."""
    from tests.factories import create_test_session

    other_session = await create_test_session(school_id="different_school")
    client, _ = school_user_client
    resp = await client.get(f"/api/v1/sessions/{other_session.id}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_rating_creation(needy_client, mock_redis):
    """Needy user can rate a session after elder confirmation."""
    from tests.factories import create_test_session

    client, needy_user = needy_client
    session = await create_test_session(
        elder_id=str(needy_user.id),
        status=SessionStatus.PENDING_APPROVAL,
        elder_confirmed=True,
    )

    resp = await client.post(
        f"/api/v1/sessions/{session.id}/rating",
        json={"score": 5, "comment": "Great volunteer!"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["score"] == 5
    assert data["comment"] == "Great volunteer!"
    assert data["volunteer_id"] == session.student_id
