import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole, VerificationStatus
from tests.conftest import _make_app


@pytest.fixture
async def school_admin_client(mock_redis):
    admin = User(
        auth0_id="auth0|admin1",
        email="admin@school.org",
        name="School Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id="school_abc",
    )
    await admin.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, admin


@pytest.mark.asyncio
async def test_create_school_by_admin(school_admin_client):
    client, _ = school_admin_client
    resp = await client.post(
        "/api/v1/schools/",
        json={
            "name": "Springfield High",
            "address": "123 Main St",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62701",
            "contact_email": "info@springfield.edu",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Springfield High"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_school_by_root(root_client):
    client, _ = root_client
    resp = await client.post(
        "/api/v1/schools/",
        json={
            "name": "Root School",
            "address": "456 Root St",
            "city": "Rootville",
            "state": "CA",
            "zip_code": "90210",
            "contact_email": "root@school.edu",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Root School"


@pytest.mark.asyncio
async def test_list_schools(auth_client):
    from tests.factories import create_test_school

    await create_test_school(name="School A")
    await create_test_school(name="School B")

    client, _ = auth_client
    resp = await client.get("/api/v1/schools/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_get_school(auth_client):
    from tests.factories import create_test_school

    school = await create_test_school()
    client, _ = auth_client
    resp = await client.get(f"/api/v1/schools/{school.id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == school.name


@pytest.mark.asyncio
async def test_create_school_forbidden_for_volunteer(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/v1/schools/",
        json={
            "name": "Test",
            "address": "123 St",
            "city": "City",
            "state": "ST",
            "zip_code": "00000",
            "contact_email": "x@example.com",
        },
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_school_dashboard(mock_redis):
    """School admin can see dashboard with stats."""
    from tests.factories import create_test_school

    school = await create_test_school(name="Dashboard School")
    admin = User(
        auth0_id="auth0|dash_admin",
        email="dashadmin@school.org",
        name="Dashboard Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=str(school.id),
    )
    await admin.insert()
    school.admin_ids.append(str(admin.id))
    await school.save()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(f"/api/v1/schools/{school.id}/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_hours" in data
    assert "total_members" in data
    assert "pending_session_approvals" in data


@pytest.mark.asyncio
async def test_remove_user_from_school(mock_redis):
    """W3: Removing user clears school_id, school_issued_id, school_email."""
    from tests.factories import create_test_school, create_test_user

    school = await create_test_school(name="Removal School")
    admin = User(
        auth0_id="auth0|rem_admin",
        email="remadmin@school.org",
        name="Removal Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=str(school.id),
    )
    await admin.insert()
    school.admin_ids.append(str(admin.id))
    await school.save()

    volunteer = await create_test_user(
        auth0_id="auth0|remvol",
        email="remvol@school.edu",
        role=UserRole.VOLUNTEER,
        school_id=str(school.id),
        school_issued_id="STU-999",
        school_email="remvol@school.edu",
    )

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete(
            f"/api/v1/schools/{school.id}/users/{volunteer.id}"
        )
    assert resp.status_code == 204

    # Verify fields cleared
    updated = await User.get(volunteer.id)
    assert updated.school_id is None
    assert updated.school_issued_id is None
    assert updated.school_email is None


@pytest.mark.asyncio
async def test_update_school(mock_redis):
    """School admin can update their school."""
    from tests.factories import create_test_school

    school = await create_test_school(name="Before Update")
    admin = User(
        auth0_id="auth0|upd_admin",
        email="updadmin@school.org",
        name="Update Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=str(school.id),
    )
    await admin.insert()
    school.admin_ids.append(str(admin.id))
    await school.save()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put(
            f"/api/v1/schools/{school.id}",
            json={"name": "After Update", "city": "New City"},
        )
    assert resp.status_code == 200
    assert resp.json()["name"] == "After Update"


@pytest.mark.asyncio
async def test_non_admin_cannot_update_school(mock_redis):
    """School user (non-admin) cannot update school."""
    from tests.factories import create_test_school

    school = await create_test_school(name="NoUpdate School")
    user = User(
        auth0_id="auth0|noupd",
        email="noupd@school.org",
        name="Non Admin",
        role=UserRole.SCHOOL_USER,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=str(school.id),
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put(
            f"/api/v1/schools/{school.id}",
            json={"name": "Should Fail"},
        )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_school_students(mock_redis):
    """School member can view school volunteers."""
    from tests.factories import create_test_school, create_test_user

    school = await create_test_school(name="Students School")
    admin = User(
        auth0_id="auth0|stu_admin",
        email="stuadmin@school.org",
        name="Students Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=str(school.id),
    )
    await admin.insert()
    school.admin_ids.append(str(admin.id))
    await school.save()

    # Create some volunteers in this school
    await create_test_user(
        auth0_id="auth0|sv1", email="sv1@school.edu",
        role=UserRole.VOLUNTEER, school_id=str(school.id),
    )
    await create_test_user(
        auth0_id="auth0|sv2", email="sv2@school.edu",
        role=UserRole.VOLUNTEER, school_id=str(school.id),
    )

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(f"/api/v1/schools/{school.id}/students")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_role_reset_on_school_removal(mock_redis):
    """B12: School admin role is reset to VOLUNTEER when removed from school."""
    from tests.factories import create_test_school, create_test_user

    school = await create_test_school(name="Role Reset School")
    root = User(
        auth0_id="auth0|role_root",
        email="rolereset@root.org",
        name="Role Root",
        role=UserRole.ROOT,
        verification_status=VerificationStatus.NOT_REQUIRED,
    )
    await root.insert()
    school.admin_ids.append(str(root.id))
    await school.save()

    # Create a school_admin user
    school_admin = await create_test_user(
        auth0_id="auth0|resetadmin",
        email="resetadmin@school.edu",
        role=UserRole.SCHOOL_ADMIN,
        school_id=str(school.id),
        school_issued_id="ADM-001",
        school_email="resetadmin@school.edu",
    )

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: root

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete(
            f"/api/v1/schools/{school.id}/users/{school_admin.id}"
        )
    assert resp.status_code == 204

    updated = await User.get(school_admin.id)
    assert updated.role == UserRole.VOLUNTEER
    assert updated.school_id is None
    assert updated.school_issued_id is None
    assert updated.school_email is None


@pytest.mark.asyncio
async def test_cross_school_dashboard_forbidden(mock_redis):
    """School admin cannot access dashboard of another school."""
    from tests.factories import create_test_school

    school = await create_test_school(name="Other Dashboard School")
    admin = User(
        auth0_id="auth0|crossdash",
        email="crossdash@school.org",
        name="Cross Admin",
        role=UserRole.SCHOOL_ADMIN,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id="different_school_id",
    )
    await admin.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: admin

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get(f"/api/v1/schools/{school.id}/dashboard")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cross_school_association_rejected(root_client):
    """B6: Reviewing association request from wrong school is rejected."""
    from tests.factories import create_test_association_request, create_test_school

    school_a = await create_test_school(name="School A")
    school_b = await create_test_school(name="School B")

    # Create request for school_a
    req = await create_test_association_request(
        user_id="user_cross",
        school_id=str(school_a.id),
        role="volunteer",
    )

    # Try to review via school_b URL
    client, _ = root_client
    resp = await client.put(
        f"/api/v1/schools/{school_b.id}/association-requests/{req.id}",
        json={"approved": True},
    )
    assert resp.status_code == 400
    assert "does not belong" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_association_request_flow(root_client):
    """Root approves a school_admin association request."""
    from tests.factories import create_test_school, create_test_user

    school = await create_test_school(name="Assoc School")
    volunteer = await create_test_user(
        auth0_id="auth0|assocvol",
        email="assocvol@school.edu",
        role=UserRole.VOLUNTEER,
        school_id=None,
    )

    from tests.factories import create_test_association_request

    req = await create_test_association_request(
        user_id=str(volunteer.id),
        school_id=str(school.id),
        role="volunteer",
    )

    client, root_user = root_client
    resp = await client.put(
        f"/api/v1/schools/{school.id}/association-requests/{req.id}",
        json={"approved": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"

    # Verify user's school_id was updated
    updated_user = await User.get(volunteer.id)
    assert updated_user.school_id == str(school.id)
