import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.auth.jwt import get_current_user
from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_request import VolunteerRequest
from app.models.volunteer_session import VolunteerSession


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    client = AsyncMongoMockClient()
    db = client["test_rgk"]
    await init_beanie(
        database=db,
        document_models=[User, School, VolunteerRequest, VolunteerSession],
    )
    yield
    await User.delete_all()
    await School.delete_all()
    await VolunteerRequest.delete_all()
    await VolunteerSession.delete_all()


@pytest.fixture
def mock_redis():
    mock = AsyncMock()
    mock.ping = AsyncMock(return_value=True)
    return mock


def _make_app(mock_redis):
    """Create a test app with db/redis/rate-limit mocked out."""
    with (
        patch("app.database.init_db", new_callable=AsyncMock),
        patch("app.database.close_db", new_callable=AsyncMock),
        patch("app.database.redis_client", mock_redis),
        patch("app.database.get_redis", return_value=mock_redis),
    ):
        from app.main import create_app

        app = create_app()

    # Disable rate limiting for tests (must be set after app creation,
    # outside context manager so it persists during request handling)
    app.state.limiter.enabled = False
    return app


@pytest.fixture
async def client(mock_redis):
    app = _make_app(mock_redis)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(mock_redis):
    """Client with a pre-created authenticated student user."""
    user = User(
        auth0_id="auth0|test123",
        email="test@example.com",
        name="Test User",
        role=UserRole.STUDENT,
        school_id="school123",
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user
