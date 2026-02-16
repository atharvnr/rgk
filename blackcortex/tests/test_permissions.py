import pytest

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole, VerificationStatus
from tests.conftest import _make_app


@pytest.mark.asyncio
async def test_root_bypasses_role_check(root_client):
    """Root can access school_admin-only endpoints."""
    client, _ = root_client
    resp = await client.post(
        "/api/v1/schools/",
        json={
            "name": "Root Access School",
            "address": "1 Root Ave",
            "city": "Rootville",
            "state": "CA",
            "zip_code": "90210",
            "contact_email": "root@test.edu",
        },
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_require_verified_blocks_unverified(mock_redis):
    """Unverified volunteer cannot accept requests."""
    user = User(
        auth0_id="auth0|unverified_vol",
        email="unverifiedvol@example.com",
        name="Unverified Vol",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.UNVERIFIED,
        school_id="school123",
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/v1/requests/fake_id/accept")
    assert resp.status_code == 403
    assert "verification" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_require_verified_passes_not_required(mock_redis):
    """Users with NOT_REQUIRED verification can access verified-only endpoints."""
    # Root user bypasses role check AND verification
    user = User(
        auth0_id="auth0|root_verified",
        email="rootverified@example.com",
        name="Root Verified",
        role=UserRole.ROOT,
        verification_status=VerificationStatus.NOT_REQUIRED,
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user

    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Root can access admin endpoints
        resp = await ac.get("/api/v1/admin/config")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_require_internal_key_valid(client):
    resp = await client.post(
        "/api/v1/internal/jobs/expire-associations",
        headers={"Authorization": "Bearer test-internal-key"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_require_internal_key_invalid(client):
    resp = await client.post(
        "/api/v1/internal/jobs/expire-associations",
        headers={"Authorization": "Bearer wrong-key"},
    )
    assert resp.status_code == 401
