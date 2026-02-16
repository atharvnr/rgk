from unittest.mock import patch

import pytest

from app.api.v1.auth import _extract_token_claims
from tests.conftest import _make_app


@pytest.fixture
async def register_client(mock_redis):
    """Client that overrides _extract_token_claims instead of get_current_user."""
    app = _make_app(mock_redis)
    app.dependency_overrides[_extract_token_claims] = lambda: {
        "auth0_id": "auth0|newuser",
        "email": "new@example.com",
    }
    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_register_user(register_client):
    resp = await register_client.post(
        "/api/v1/auth/register",
        json={
            "name": "New User",
            "role": "volunteer",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "auth0_id" not in data  # B3: auth0_id excluded from response
    assert data["email"] == "new@example.com"
    assert data["role"] == "volunteer"
    assert data["verification_status"] == "unverified"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_auth0_id(register_client):
    # Register first user
    await register_client.post(
        "/api/v1/auth/register",
        json={"name": "User 1", "role": "needy"},
    )
    # Attempt duplicate
    resp = await register_client.post(
        "/api/v1/auth/register",
        json={"name": "User 2", "role": "needy"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_invalid_role(register_client):
    resp = await register_client.post(
        "/api/v1/auth/register",
        json={"name": "Bad Role", "role": "admin"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_root_auto_assign(mock_redis):
    """When email is in RGK_ROOT_USERS, role is auto-assigned to root."""
    app = _make_app(mock_redis)
    app.dependency_overrides[_extract_token_claims] = lambda: {
        "auth0_id": "auth0|rootseed",
        "email": "rootuser@example.com",
    }
    from httpx import ASGITransport, AsyncClient

    transport = ASGITransport(app=app)

    with patch("app.services.user_service.settings") as mock_settings:
        mock_settings.rgk_root_users = ["rootuser@example.com"]
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post(
                "/api/v1/auth/register",
                json={"name": "Root Seed", "role": "volunteer"},
            )

    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "root"
    assert data["verification_status"] == "not_required"


@pytest.mark.asyncio
async def test_register_privileged_role_rejected(register_client):
    """Self-assigning privileged roles (school_admin, school_user, root) is rejected."""
    for role in ("school_admin", "school_user", "root"):
        resp = await register_client.post(
            "/api/v1/auth/register",
            json={"name": "Bad Actor", "role": role},
        )
        assert resp.status_code == 422, f"Expected 422 for role '{role}', got {resp.status_code}"
