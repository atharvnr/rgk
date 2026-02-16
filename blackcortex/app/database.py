from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from redis.asyncio import Redis

from app.config import settings

motor_client: AsyncIOMotorClient | None = None
redis_client: Redis | None = None


async def init_db() -> None:
    global motor_client, redis_client

    motor_client = AsyncIOMotorClient(settings.mongodb_uri)
    db = motor_client[settings.database_name]

    from app.models.app_config import AppConfig
    from app.models.audit_log import AuditLog
    from app.models.proxy_link import ProxyLink
    from app.models.rating import Rating
    from app.models.school import School
    from app.models.school_association_request import SchoolAssociationRequest
    from app.models.user import User
    from app.models.volunteer_request import VolunteerRequest
    from app.models.volunteer_session import VolunteerSession

    await init_beanie(
        database=db,
        document_models=[
            User,
            School,
            VolunteerRequest,
            VolunteerSession,
            AppConfig,
            ProxyLink,
            Rating,
            AuditLog,
            SchoolAssociationRequest,
        ],
    )

    redis_client = Redis.from_url(settings.redis_url, decode_responses=True)


async def close_db() -> None:
    global motor_client, redis_client
    if motor_client:
        motor_client.close()
    if redis_client:
        await redis_client.aclose()


def get_redis() -> Redis:
    assert redis_client is not None, "Redis not initialized"
    return redis_client
