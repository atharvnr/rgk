import pytest


@pytest.mark.asyncio
async def test_get_me(auth_client):
    client, user = auth_client
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == user.email
    assert data["name"] == user.name
    assert data["verification_status"] == "verified"
    assert data["role"] == "volunteer"


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
    assert "verification_status" in data
    assert "school_issued_id" in data
    assert "school_email" in data


@pytest.mark.asyncio
async def test_get_other_user_forbidden(auth_client):
    """B2 IDOR: Volunteer cannot access other users' profiles."""
    client, _ = auth_client
    resp = await client.get("/api/v1/users/000000000000000000000000")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_user_not_found(root_client):
    """Root accessing nonexistent user returns 404."""
    client, _ = root_client
    resp = await client.get("/api/v1/users/000000000000000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_my_ratings(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/v1/users/me/ratings")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
