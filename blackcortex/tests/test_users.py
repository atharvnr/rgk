import pytest


@pytest.mark.asyncio
async def test_get_me(auth_client):
    client, user = auth_client
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == user.email
    assert data["name"] == user.name


@pytest.mark.asyncio
async def test_update_me(auth_client):
    client, _ = auth_client
    resp = await client.put(
        "/api/v1/users/me",
        json={"name": "Updated Name", "phone": "555-1234"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Updated Name"
    assert data["phone"] == "555-1234"


@pytest.mark.asyncio
async def test_get_user_by_id(auth_client):
    client, user = auth_client
    resp = await client.get(f"/api/v1/users/{user.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == user.email


@pytest.mark.asyncio
async def test_get_user_not_found(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/v1/users/000000000000000000000000")
    assert resp.status_code == 404
