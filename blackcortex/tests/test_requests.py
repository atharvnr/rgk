import pytest

from app.auth.jwt import get_current_user
from app.models.proxy_link import ProxyLink, ProxyLinkStatus
from app.models.user import User, UserRole, VerificationStatus
from tests.conftest import _make_app


@pytest.mark.asyncio
async def test_create_request_by_needy(needy_client):
    client, _ = needy_client
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
async def test_create_request_forbidden_for_volunteer(auth_client):
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


@pytest.mark.asyncio
async def test_list_requests_needy_sees_own(needy_client):
    client, needy = needy_client

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
        assert item["elder_id"] == str(needy.id)


@pytest.mark.asyncio
async def test_accept_request(auth_client, needy_client):
    # Create request as needy
    needy_c, _ = needy_client
    resp = await needy_c.post(
        "/api/v1/requests/",
        json={
            "title": "Walk together",
            "description": "Morning walk",
            "category": "companionship",
        },
    )
    assert resp.status_code == 201
    request_id = resp.json()["id"]

    # Accept as volunteer
    vol_c, volunteer = auth_client
    resp = await vol_c.post(f"/api/v1/requests/{request_id}/accept")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "assigned"
    assert data["assigned_student_id"] == str(volunteer.id)


@pytest.mark.asyncio
async def test_unassign_request(auth_client, needy_client):
    # Create and accept
    needy_c, _ = needy_client
    resp = await needy_c.post(
        "/api/v1/requests/",
        json={
            "title": "Unassign test",
            "description": "Test",
            "category": "errands",
        },
    )
    request_id = resp.json()["id"]

    vol_c, _ = auth_client
    await vol_c.post(f"/api/v1/requests/{request_id}/accept")

    # Unassign
    resp = await vol_c.put(f"/api/v1/requests/{request_id}/unassign")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "open"
    assert data["assigned_student_id"] is None


@pytest.mark.asyncio
async def test_max_active_request_limit(auth_client, needy_client):
    needy_c, _ = needy_client
    vol_c, _ = auth_client

    # Create and accept 3 requests
    for i in range(3):
        resp = await needy_c.post(
            "/api/v1/requests/",
            json={
                "title": f"Request {i}",
                "description": f"Desc {i}",
                "category": "errands",
            },
        )
        rid = resp.json()["id"]
        resp = await vol_c.post(f"/api/v1/requests/{rid}/accept")
        assert resp.status_code == 200

    # 4th should fail
    resp = await needy_c.post(
        "/api/v1/requests/",
        json={
            "title": "Request 4",
            "description": "Desc 4",
            "category": "errands",
        },
    )
    rid = resp.json()["id"]
    resp = await vol_c.post(f"/api/v1/requests/{rid}/accept")
    assert resp.status_code == 400
    assert "Cannot accept more than 3" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_proxy_creates_request(needy_proxy_client):
    """Needy proxy creates request on behalf of linked needy user."""
    client, proxy_user = needy_proxy_client

    # Create a needy user and active proxy link
    needy = User(
        auth0_id="auth0|needyforproxy",
        email="needyforproxy@example.com",
        name="Needy For Proxy",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
        address="789 Pine St",
    )
    await needy.insert()

    link = ProxyLink(
        proxy_user_id=str(proxy_user.id),
        needy_user_id=str(needy.id),
        status=ProxyLinkStatus.ACTIVE,
    )
    await link.insert()

    resp = await client.post(
        "/api/v1/requests/",
        json={
            "title": "Help for elderly",
            "description": "Proxy creating",
            "category": "companionship",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["elder_id"] == str(needy.id)


@pytest.mark.asyncio
async def test_proxy_without_link_gets_empty_requests(needy_proxy_client):
    """B5: NEEDY_PROXY with no active link gets empty list, not all requests."""
    client, _ = needy_proxy_client
    resp = await client.get("/api/v1/requests/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_cannot_update_completed_request(needy_client, auth_client):
    """W2: Completed requests cannot be updated."""
    needy_c, _ = needy_client
    resp = await needy_c.post(
        "/api/v1/requests/",
        json={
            "title": "Completed test",
            "description": "Desc",
            "category": "errands",
        },
    )
    request_id = resp.json()["id"]

    # Accept and complete
    vol_c, _ = auth_client
    await vol_c.post(f"/api/v1/requests/{request_id}/accept")
    await vol_c.put(
        f"/api/v1/requests/{request_id}/status",
        params={"status": "in_progress"},
    )
    await vol_c.put(
        f"/api/v1/requests/{request_id}/status",
        params={"status": "completed"},
    )

    # Try to update completed request
    resp = await needy_c.put(
        f"/api/v1/requests/{request_id}",
        json={"title": "Should fail"},
    )
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_needy_cannot_view_other_elders_request(needy_client):
    """W3: IDOR — needy can only view their own requests."""
    from tests.factories import create_test_request

    other_request = await create_test_request(elder_id="other_elder_id")
    client, _ = needy_client
    resp = await client.get(f"/api/v1/requests/{other_request.id}")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_volunteer_can_view_any_request(auth_client):
    """W3: Volunteers can view any request (needed to browse and accept)."""
    from tests.factories import create_test_request

    request = await create_test_request(elder_id="some_elder")
    client, _ = auth_client
    resp = await client.get(f"/api/v1/requests/{request.id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == str(request.id)


@pytest.mark.asyncio
async def test_unverified_cannot_create_request(mock_redis):
    """Unverified needy user cannot create requests."""
    user = User(
        auth0_id="auth0|unverified_needy",
        email="unverified@example.com",
        name="Unverified Needy",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.UNVERIFIED,
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/requests/",
            json={
                "title": "Should fail",
                "description": "Unverified",
                "category": "errands",
            },
        )
    assert resp.status_code == 403
    assert "verification" in resp.json()["detail"].lower()
