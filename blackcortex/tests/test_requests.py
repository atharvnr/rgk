import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole
from tests.conftest import _make_app


@pytest.fixture
async def elder_client(mock_redis):
    elder = User(
        auth0_id="auth0|elder1",
        email="elder@example.com",
        name="Elder User",
        role=UserRole.ELDER,
        address="456 Oak St",
    )
    await elder.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: elder

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, elder


@pytest.mark.asyncio
async def test_create_request(elder_client):
    client, _ = elder_client
    resp = await client.post(
        "/api/v1/requests/",
        json={
            "title": "Need help with groceries",
            "description": "Weekly grocery run",
            "category": "errands",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Need help with groceries"
    assert data["status"] == "open"


@pytest.mark.asyncio
async def test_list_requests_elder_sees_own(elder_client):
    client, elder = elder_client

    await client.post(
        "/api/v1/requests/",
        json={
            "title": "Request 1",
            "description": "Desc 1",
            "category": "companionship",
        },
    )

    resp = await client.get("/api/v1/requests/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["elder_id"] == str(elder.id)


@pytest.mark.asyncio
async def test_accept_request(auth_client, elder_client):
    # Create request as elder
    elder_c, _ = elder_client
    resp = await elder_c.post(
        "/api/v1/requests/",
        json={
            "title": "Walk together",
            "description": "Morning walk",
            "category": "companionship",
        },
    )
    assert resp.status_code == 201
    request_id = resp.json()["id"]

    # Accept as student
    student_c, student = auth_client
    resp = await student_c.post(f"/api/v1/requests/{request_id}/accept")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "assigned"
    assert data["assigned_student_id"] == str(student.id)


@pytest.mark.asyncio
async def test_create_request_forbidden_for_student(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/v1/requests/",
        json={
            "title": "Test",
            "description": "Desc",
            "category": "errands",
        },
    )
    assert resp.status_code == 403
