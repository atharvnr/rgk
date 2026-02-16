import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.auth.jwt import get_current_user
from app.models.app_config import AppConfig
from app.models.audit_log import AuditLog
from app.models.proxy_link import ProxyLink
from app.models.rating import Rating
from app.models.school import School
from app.models.school_association_request import SchoolAssociationRequest
from app.models.user import User, UserRole, VerificationStatus
from app.models.volunteer_request import VolunteerRequest
from app.models.volunteer_session import VolunteerSession

ALL_MODELS = [
    User,
    School,
    VolunteerRequest,
    VolunteerSession,
    AppConfig,
    ProxyLink,
    Rating,
    AuditLog,
    SchoolAssociationRequest,
]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def setup_db():
    client = AsyncMongoMockClient()
    db = client["test_rgk"]
    await init_beanie(database=db, document_models=ALL_MODELS)
    yield
    for model in ALL_MODELS:
        await model.delete_all()


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

    app.state.limiter.enabled = False

    # Set internal API key for testing (B9: default is empty = locked)
    from app.config import settings

    settings.internal_api_key = "test-internal-key"

    return app


@pytest.fixture
async def client(mock_redis):
    app = _make_app(mock_redis)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_client(mock_redis):
    """Client with a pre-created authenticated volunteer user (verified)."""
    user = User(
        auth0_id="auth0|test123",
        email="test@example.com",
        name="Test User",
        role=UserRole.VOLUNTEER,
        verification_status=VerificationStatus.VERIFIED,
        school_id="school123",
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user


@pytest.fixture
async def root_client(mock_redis):
    """Client with a pre-created root user."""
    user = User(
        auth0_id="auth0|root1",
        email="root@rentgrandkids.org",
        name="Root User",
        role=UserRole.ROOT,
        verification_status=VerificationStatus.NOT_REQUIRED,
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user


@pytest.fixture
async def needy_client(mock_redis):
    """Client with a pre-created needy user (verified)."""
    user = User(
        auth0_id="auth0|needy1",
        email="needy@example.com",
        name="Needy User",
        role=UserRole.NEEDY,
        verification_status=VerificationStatus.VERIFIED,
        address="123 Elm St",
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user


@pytest.fixture
async def needy_proxy_client(mock_redis):
    """Client with a pre-created needy_proxy user (verified)."""
    user = User(
        auth0_id="auth0|proxy1",
        email="proxy@example.com",
        name="Proxy User",
        role=UserRole.NEEDY_PROXY,
        verification_status=VerificationStatus.VERIFIED,
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user


@pytest.fixture
async def school_user_client(mock_redis):
    """Client with a pre-created school_user."""
    user = User(
        auth0_id="auth0|schooluser1",
        email="schooluser@school.org",
        name="School User",
        role=UserRole.SCHOOL_USER,
        verification_status=VerificationStatus.NOT_REQUIRED,
        school_id="school_sess",
    )
    await user.insert()

    app = _make_app(mock_redis)
    app.dependency_overrides[get_current_user] = lambda: user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac, user
