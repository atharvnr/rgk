import pytest

from app.models.audit_log import AuditLog
from app.models.school import School
from tests.factories import create_test_school

B = "/api/v1/admin/schools"
PAYLOAD = {
    "name": "Lincoln High",
    "address": "1 Main St",
    "city": "Springfield",
    "state": "IL",
    "zip_code": "62701",
    "contact_email": "office@lincoln.org",
}


@pytest.mark.asyncio
async def test_create_school(root_client):
    client, _ = root_client
    resp = await client.post(B, json=PAYLOAD)
    assert resp.status_code == 201
    body = resp.json()
    assert body["admin_ids"] == [] and body["is_active"] is True
    assert await AuditLog.find_one(AuditLog.action == "school.create") is not None


@pytest.mark.asyncio
async def test_update_school_incl_is_active(root_client):
    client, _ = root_client
    s = await create_test_school("Before")
    resp = await client.put(f"{B}/{s.id}", json={"name": "After", "is_active": False})
    assert resp.status_code == 200
    assert resp.json()["name"] == "After" and resp.json()["is_active"] is False
    assert await AuditLog.find_one(AuditLog.action == "school.update") is not None
    assert (
        await client.put(f"{B}/000000000000000000000000", json={"name": "x"})
    ).status_code == 404


@pytest.mark.asyncio
async def test_soft_delete_and_list_visibility(root_client):
    client, _ = root_client
    keep = await create_test_school("Keep Me")
    gone = await create_test_school("Gone")
    resp = await client.delete(f"{B}/{gone.id}")
    assert resp.status_code == 204
    assert (await School.get(gone.id)).is_active is False
    assert await AuditLog.find_one(AuditLog.action == "school.delete") is not None

    resp = await client.get(B)
    assert [i["id"] for i in resp.json()["items"]] == [str(keep.id)]
    resp = await client.get(B, params={"include_inactive": True})
    assert resp.json()["total"] == 2
    resp = await client.get(B, params={"include_inactive": True, "q": "gon"})
    assert [i["name"] for i in resp.json()["items"]] == ["Gone"]


@pytest.mark.asyncio
async def test_non_root_forbidden(auth_client):
    client, _ = auth_client
    assert (await client.get(B)).status_code == 403
    assert (await client.post(B, json=PAYLOAD)).status_code == 403
    assert (await client.put(f"{B}/abc", json={"name": "x"})).status_code == 403
    assert (await client.delete(f"{B}/abc")).status_code == 403


@pytest.mark.asyncio
async def test_school_admin_cannot_set_is_active_on_public_route(mock_redis):
    from httpx import ASGITransport, AsyncClient

    from app.auth.jwt import get_current_user
    from app.models.user import UserRole
    from tests.conftest import _make_app
    from tests.factories import create_test_user

    s = await create_test_school()
    u = await create_test_user(role=UserRole.SCHOOL_ADMIN, school_id=str(s.id))
    await s.set({"admin_ids": [str(u.id)]})
    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: u
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r = await ac.put(f"/api/v1/schools/{s.id}", json={"is_active": False})
        assert r.status_code == 403
        r = await ac.put(f"/api/v1/schools/{s.id}", json={"name": "Renamed"})
        assert r.status_code == 200
