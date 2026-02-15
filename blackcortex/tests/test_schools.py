import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole
from tests.conftest import _make_app


@pytest.fixture
async def school_admin_client(mock_redis):
    admin = User(
        auth0_id="auth0|admin1",
        email="admin@school.org",
        name="School Admin",
        role=UserRole.SCHOOL_ADMIN,
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
async def test_create_school(school_admin_client):
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
async def test_create_school_forbidden_for_student(auth_client):
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
