import pytest

from app.models.audit_log import AuditLog
from app.models.school import School
from app.models.user import User, UserRole, VerificationStatus
from tests.factories import create_test_school, create_test_user

B = "/api/v1/admin/users"


@pytest.mark.asyncio
async def test_list_q_and_role_filter(root_client):
    client, _ = root_client
    await create_test_user("auth0|a", "alice@example.com", "Alice Smith")
    await create_test_user("auth0|b", "bob@example.com", "Bob", role=UserRole.NEEDY)
    resp = await client.get(B, params={"q": "ALICE"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1 and data["items"][0]["email"] == "alice@example.com"
    resp = await client.get(B, params={"q": "a.c"})  # regex chars are escaped
    assert resp.json()["total"] == 0
    resp = await client.get(B, params={"role": "needy"})
    assert [u["email"] for u in resp.json()["items"]] == ["bob@example.com"]
    resp = await client.get(B, params={"limit": 0})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_404_and_ok(root_client):
    client, _ = root_client
    resp = await client.get(f"{B}/000000000000000000000000")
    assert resp.status_code == 404
    u = await create_test_user()
    resp = await client.get(f"{B}/{u.id}")
    assert resp.status_code == 200 and resp.json()["email"] == u.email


@pytest.mark.asyncio
async def test_update_to_school_admin_adds_admin_ids(root_client):
    client, _ = root_client
    old = await create_test_school("Old")
    new = await create_test_school("New")
    u = await create_test_user(role=UserRole.VOLUNTEER, school_id=str(old.id))
    await old.set({"admin_ids": [str(u.id)]})
    resp = await client.put(f"{B}/{u.id}", json={"role": "school_admin", "school_id": str(new.id)})
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == "school_admin"
    assert body["verification_status"] == "not_required"
    assert str((await School.get(new.id)).admin_ids) == str([str(u.id)])
    assert (await School.get(old.id)).admin_ids == []
    log = await AuditLog.find_one(AuditLog.action == "user.admin_update")
    assert log is not None and "role" in log.details["fields"]


@pytest.mark.asyncio
async def test_update_missing_school_404(root_client):
    client, _ = root_client
    u = await create_test_user()
    resp = await client.put(f"{B}/{u.id}", json={"school_id": "000000000000000000000000"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_away_from_school_clears_fields(root_client):
    client, _ = root_client
    s = await create_test_school(admin_ids=[])
    u = await create_test_user(
        role=UserRole.SCHOOL_ADMIN,
        school_id=str(s.id),
        school_issued_id="X1",
        school_email="a@school.edu",
    )
    await s.set({"admin_ids": [str(u.id)]})
    resp = await client.put(f"{B}/{u.id}", json={"role": "needy"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == "needy"
    assert body["school_id"] is None and body["school_issued_id"] is None
    assert body["school_email"] is None
    assert body["verification_status"] == "verified"  # not recomputed moving out
    assert (await School.get(s.id)).admin_ids == []


@pytest.mark.asyncio
async def test_self_demote_and_deactivate_rejected(root_client):
    client, root = root_client
    resp = await client.put(f"{B}/{root.id}", json={"role": "volunteer"})
    assert resp.status_code == 400
    resp = await client.put(f"{B}/{root.id}", json={"is_active": False})
    assert resp.status_code == 400
    resp = await client.put(f"{B}/{root.id}", json={"name": "New Name"})
    assert resp.status_code == 200 and resp.json()["name"] == "New Name"


@pytest.mark.asyncio
async def test_delete_self_rejected(root_client):
    client, root = root_client
    resp = await client.delete(f"{B}/{root.id}")
    assert resp.status_code == 400
    assert await User.get(root.id) is not None


@pytest.mark.asyncio
async def test_delete_removes_admin_ids(root_client):
    client, _ = root_client
    u = await create_test_user(role=UserRole.SCHOOL_ADMIN)
    s = await create_test_school(admin_ids=[str(u.id)])
    resp = await client.delete(f"{B}/{u.id}")
    assert resp.status_code == 204
    assert await User.get(u.id) is None
    assert (await School.get(s.id)).admin_ids == []
    log = await AuditLog.find_one(AuditLog.action == "user.delete")
    assert log is not None and log.details["email"] == u.email


@pytest.mark.asyncio
async def test_non_root_forbidden(auth_client):
    client, user = auth_client
    assert (await client.get(B)).status_code == 403
    assert (await client.get(f"{B}/{user.id}")).status_code == 403
    assert (await client.put(f"{B}/{user.id}", json={"name": "x"})).status_code == 403
    assert (await client.delete(f"{B}/{user.id}")).status_code == 403
    assert user.verification_status == VerificationStatus.VERIFIED
