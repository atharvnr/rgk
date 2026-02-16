import pytest

from app.models.user import User, UserRole, VerificationStatus


@pytest.mark.asyncio
async def test_proxy_link_lifecycle(needy_proxy_client, root_client):
    """Full lifecycle: create → confirm → revoke."""
    proxy_client, proxy_user = needy_proxy_client
    root_c, root_user = root_client

    # Create needy user
    needy = User(
        auth0_id="auth0|needylink",
        email="needylink@example.com",
        name="Needy Link",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await needy.insert()

    # 1. Proxy creates link request
    resp = await proxy_client.post(
        "/api/v1/proxy/link",
        json={"needy_user_id": str(needy.id)},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["proxy_user_id"] == str(proxy_user.id)
    assert data["needy_user_id"] == str(needy.id)
    link_id = data["id"]

    # 2. List proxy links
    resp = await proxy_client.get("/api/v1/proxy/links")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # 3. Root confirms
    resp = await root_c.put(f"/api/v1/proxy/link/{link_id}/confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"

    # 4. Root revokes
    resp = await root_c.put(f"/api/v1/proxy/link/{link_id}/revoke")
    assert resp.status_code == 200
    assert resp.json()["status"] == "revoked"


@pytest.mark.asyncio
async def test_proxy_link_reject(needy_proxy_client, root_client):
    proxy_client, proxy_user = needy_proxy_client
    root_c, _ = root_client

    needy = User(
        auth0_id="auth0|needyreject",
        email="needyreject@example.com",
        name="Needy Reject",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await needy.insert()

    resp = await proxy_client.post(
        "/api/v1/proxy/link",
        json={"needy_user_id": str(needy.id)},
    )
    link_id = resp.json()["id"]

    resp = await root_c.put(
        f"/api/v1/proxy/link/{link_id}/reject",
        json={"rejection_reason": "Insufficient proof of relation"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "rejected"
    assert data["rejection_reason"] == "Insufficient proof of relation"


@pytest.mark.asyncio
async def test_proxy_link_1_to_1_enforcement(needy_proxy_client):
    """Proxy can only have one active/pending link."""
    proxy_client, proxy_user = needy_proxy_client

    needy1 = User(
        auth0_id="auth0|needy1_1to1",
        email="needy1_1to1@example.com",
        name="Needy 1",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await needy1.insert()

    needy2 = User(
        auth0_id="auth0|needy2_1to1",
        email="needy2_1to1@example.com",
        name="Needy 2",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await needy2.insert()

    # First link succeeds
    resp = await proxy_client.post(
        "/api/v1/proxy/link",
        json={"needy_user_id": str(needy1.id)},
    )
    assert resp.status_code == 201

    # Second link fails (proxy already has pending)
    resp = await proxy_client.post(
        "/api/v1/proxy/link",
        json={"needy_user_id": str(needy2.id)},
    )
    assert resp.status_code == 400
    assert "already have" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_proxy_link_target_not_needy(needy_proxy_client, auth_client):
    """Cannot link to a non-needy user."""
    proxy_client, _ = needy_proxy_client
    _, volunteer = auth_client

    resp = await proxy_client.post(
        "/api/v1/proxy/link",
        json={"needy_user_id": str(volunteer.id)},
    )
    assert resp.status_code == 400
    assert "not a needy" in resp.json()["detail"].lower()
