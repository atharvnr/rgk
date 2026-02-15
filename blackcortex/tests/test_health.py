import pytest


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_ready(client, mock_redis):
    from unittest.mock import patch, AsyncMock

    mock_motor = AsyncMock()
    mock_motor.admin.command = AsyncMock(return_value={"ok": 1})

    with patch("app.api.v1.health.motor_client", mock_motor):
        with patch("app.api.v1.health.get_redis", return_value=mock_redis):
            resp = await client.get("/api/v1/health/ready")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["checks"]["mongodb"] is True
    assert data["checks"]["redis"] is True
