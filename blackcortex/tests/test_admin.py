import pytest

from app.models.user import UserRole, VerificationStatus
from tests.factories import create_test_school, create_test_user


@pytest.mark.asyncio
async def test_config_crud(root_client):
    client, _ = root_client

    # Create
    resp = await client.post(
        "/api/v1/admin/config",
        json={
            "key": "feature_flags",
            "value": {"dark_mode": True},
            "description": "Feature toggles",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["key"] == "feature_flags"
    assert data["value"] == {"dark_mode": True}

    # List
    resp = await client.get("/api/v1/admin/config")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # Get
    resp = await client.get("/api/v1/admin/config/feature_flags")
    assert resp.status_code == 200
    assert resp.json()["key"] == "feature_flags"

    # Update
    resp = await client.put(
        "/api/v1/admin/config/feature_flags",
        json={"value": {"dark_mode": False}},
    )
    assert resp.status_code == 200
    assert resp.json()["value"] == {"dark_mode": False}

    # Delete
    resp = await client.delete("/api/v1/admin/config/feature_flags")
    assert resp.status_code == 204

    # Verify deleted
    resp = await client.get("/api/v1/admin/config/feature_flags")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_config_duplicate_key(root_client):
    client, _ = root_client
    await client.post(
        "/api/v1/admin/config",
        json={"key": "dup_key", "value": {"a": 1}},
    )
    resp = await client.post(
        "/api/v1/admin/config",
        json={"key": "dup_key", "value": {"b": 2}},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_analytics(root_client):
    client, _ = root_client
    resp = await client.get("/api/v1/admin/analytics")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data
    assert "total_schools" in data
    assert "total_hours" in data


@pytest.mark.asyncio
async def test_audit_log(root_client):
    client, _ = root_client

    # Create config to generate audit log
    await client.post(
        "/api/v1/admin/config",
        json={"key": "audit_test", "value": {"x": 1}},
    )

    resp = await client.get("/api/v1/admin/audit-log")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert len(data["items"]) >= 1


@pytest.mark.asyncio
async def test_verify_user(root_client):
    client, _ = root_client
    user = await create_test_user(
        auth0_id="auth0|toverify",
        email="toverify@example.com",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.UNVERIFIED,
    )

    resp = await client.put(
        f"/api/v1/admin/users/{user.id}/verify",
        json={"verification_status": "verified"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_status"] == "verified"


@pytest.mark.asyncio
async def test_assign_school_admin(root_client):
    client, root_user = root_client
    school = await create_test_school(
        name="Admin School", admin_ids=[str(root_user.id)]
    )
    user = await create_test_user(
        auth0_id="auth0|newadmin",
        email="newadmin@school.edu",
        role=UserRole.SCHOOL_USER,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id=None,
    )

    # Remove existing admin first (the school was created with root as admin,
    # but the check is for users with school_admin role + same school_id)
    resp = await client.put(
        f"/api/v1/admin/schools/{school.id}/assign-admin",
        json={"user_id": str(user.id)},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert str(user.id) in data["admin_ids"]


@pytest.mark.asyncio
async def test_verify_user_invalid_status(root_client):
    """B11: Cannot set verification_status to arbitrary values."""
    client, _ = root_client
    user = await create_test_user(
        auth0_id="auth0|badverify",
        email="badverify@example.com",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.UNVERIFIED,
    )

    # Try setting to 'not_required' (should be rejected by Literal constraint)
    resp = await client.put(
        f"/api/v1/admin/users/{user.id}/verify",
        json={"verification_status": "not_required"},
    )
    assert resp.status_code == 422

    # Try setting to 'pending_verification' (also invalid)
    resp = await client.put(
        f"/api/v1/admin/users/{user.id}/verify",
        json={"verification_status": "pending_verification"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_assign_school_admin_invalid_role(root_client):
    """W4: Cannot promote root/needy to school_admin."""
    client, _ = root_client
    school = await create_test_school(name="Promo School")
    needy = await create_test_user(
        auth0_id="auth0|needypromo",
        email="needypromo@example.com",
        role=UserRole.NEEDY,
        school_id=None,
    )

    resp = await client.put(
        f"/api/v1/admin/schools/{school.id}/assign-admin",
        json={"user_id": str(needy.id)},
    )
    assert resp.status_code == 400
    assert "cannot promote" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_non_root_cannot_access_admin(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/v1/admin/config")
    assert resp.status_code == 403
