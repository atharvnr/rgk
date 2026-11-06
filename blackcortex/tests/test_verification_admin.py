import pytest

from app.services.verification_service import create_verification_request


@pytest.mark.asyncio
async def test_admin_list_and_resolve_verification_requests(root_client):
    client, root = root_client
    req = await create_verification_request("user1", "u1@example.com", "User One", None, "help")

    resp = await client.get("/api/v1/admin/verification-requests")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["id"] == str(req.id)
    assert items[0]["status"] == "pending"

    resp = await client.put(
        f"/api/v1/admin/verification-requests/{req.id}/resolve", json={"notes": "ok"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "resolved"
    assert resp.json()["resolved_by"] == str(root.id)

    resp = await client.put(
        "/api/v1/admin/verification-requests/000000000000000000000000/resolve", json={}
    )
    assert resp.status_code == 404
