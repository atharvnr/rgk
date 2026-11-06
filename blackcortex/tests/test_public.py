import json
from unittest.mock import AsyncMock, patch

import pytest

from app.models.school import School
from app.models.user import UserRole
from app.models.volunteer_session import SessionStatus
from tests.factories import create_test_school, create_test_session, create_test_user


@pytest.fixture
def no_cache(mock_redis):
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock()
    with patch("app.services.public_service.get_redis", return_value=mock_redis):
        yield mock_redis


@pytest.mark.asyncio
async def test_public_stats_empty(client, no_cache):
    resp = await client.get("/api/v1/public/stats")
    assert resp.status_code == 200
    assert resp.json() == {
        "hours_served": 0,
        "sessions_completed": 0,
        "volunteers": 0,
        "elders_helped": 0,
        "schools": 0,
    }


@pytest.mark.asyncio
async def test_public_stats_computed(client, no_cache):
    await create_test_school(name="Active School")
    inactive_school = await create_test_school(name="Closed School")
    inactive_school.is_active = False
    await inactive_school.save()
    assert await School.find_all().count() == 2

    await create_test_user(auth0_id="a|1", email="v1@example.com")
    await create_test_user(auth0_id="a|2", email="v2@example.com")
    await create_test_user(auth0_id="a|3", email="v3@example.com", is_active=False)
    await create_test_user(auth0_id="a|4", email="e1@example.com", role=UserRole.NEEDY)

    for elder, status, hours in [
        ("elder1", SessionStatus.APPROVED, 1.26),
        ("elder2", SessionStatus.APPROVED, 2.5),
        ("elder3", SessionStatus.PENDING_APPROVAL, 4.0),
    ]:
        session = await create_test_session(elder_id=elder, status=status)
        session.hours_logged = hours
        await session.save()

    resp = await client.get("/api/v1/public/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["hours_served"] == 3.8
    assert data["sessions_completed"] == 2
    assert data["volunteers"] == 2
    assert data["elders_helped"] == 2
    assert data["schools"] == 1
    no_cache.set.assert_awaited_once()
    assert no_cache.set.await_args.args[0] == "public:stats"
    assert no_cache.set.await_args.kwargs["ex"] == 300


@pytest.mark.asyncio
async def test_public_stats_served_from_cache(client, mock_redis):
    cached = {
        "hours_served": 99.5,
        "sessions_completed": 7,
        "volunteers": 3,
        "elders_helped": 2,
        "schools": 1,
    }
    mock_redis.get = AsyncMock(return_value=json.dumps(cached))
    mock_redis.set = AsyncMock()
    with patch("app.services.public_service.get_redis", return_value=mock_redis):
        resp = await client.get("/api/v1/public/stats")
    assert resp.status_code == 200
    assert resp.json() == cached
    mock_redis.set.assert_not_awaited()


@pytest.mark.asyncio
async def test_public_stats_redis_failure_serves_uncached(client, mock_redis):
    mock_redis.get = AsyncMock(side_effect=ConnectionError("down"))
    mock_redis.set = AsyncMock(side_effect=ConnectionError("down"))
    with patch("app.services.public_service.get_redis", return_value=mock_redis):
        resp = await client.get("/api/v1/public/stats")
    assert resp.status_code == 200
    assert resp.json()["sessions_completed"] == 0
