import pytest


@pytest.mark.asyncio
async def test_register_user(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "auth0_id": "auth0|newuser",
            "email": "new@example.com",
            "name": "New User",
            "role": "student",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["auth0_id"] == "auth0|newuser"
    assert data["email"] == "new@example.com"
    assert data["role"] == "student"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_auth0_id(client):
    # Register first user
    await client.post(
        "/api/v1/auth/register",
        json={
            "auth0_id": "auth0|dup",
            "email": "dup1@example.com",
            "name": "User 1",
            "role": "elder",
        },
    )
    # Attempt duplicate
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "auth0_id": "auth0|dup",
            "email": "dup2@example.com",
            "name": "User 2",
            "role": "elder",
        },
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_register_invalid_role(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "auth0_id": "auth0|bad",
            "email": "bad@example.com",
            "name": "Bad Role",
            "role": "admin",
        },
    )
    assert resp.status_code == 422
