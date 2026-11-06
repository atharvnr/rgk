import json
import logging

from app.database import get_redis
from app.models.school import School
from app.models.user import User, UserRole
from app.models.volunteer_session import SessionStatus, VolunteerSession

logger = logging.getLogger(__name__)

PUBLIC_STATS_CACHE_KEY = "public:stats"
PUBLIC_STATS_CACHE_TTL = 300  # 5 minutes


async def _compute_stats() -> dict:
    approved = await VolunteerSession.find(
        VolunteerSession.status == SessionStatus.APPROVED
    ).to_list()
    total_hours = sum(s.hours_logged for s in approved)
    volunteers = await User.find(User.role == UserRole.VOLUNTEER, User.is_active == True).count()  # noqa: E712
    schools = await School.find(School.is_active == True).count()  # noqa: E712
    return {
        "hours_served": round(total_hours, 1),
        "sessions_completed": len(approved),
        "volunteers": volunteers,
        "elders_helped": len({s.elder_id for s in approved}),
        "schools": schools,
    }


async def get_public_stats() -> dict:
    """Return public impact stats, cached in Redis. Redis failures fall back to uncached."""
    try:
        cached = await get_redis().get(PUBLIC_STATS_CACHE_KEY)
        if cached:
            stats: dict = json.loads(cached)
            return stats
    except Exception:
        logger.warning("Redis read failed for %s; serving uncached", PUBLIC_STATS_CACHE_KEY)

    stats = await _compute_stats()

    try:
        await get_redis().set(PUBLIC_STATS_CACHE_KEY, json.dumps(stats), ex=PUBLIC_STATS_CACHE_TTL)
    except Exception:
        logger.warning("Redis write failed for %s; serving uncached", PUBLIC_STATS_CACHE_KEY)

    return stats
