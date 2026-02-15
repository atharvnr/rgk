from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit_default],
    storage_uri=settings.redis_url,
)


def get_limiter() -> Limiter:
    return limiter


def rate_limit(limit: str):
    """Decorator for per-route rate limiting."""
    return limiter.limit(limit)


def get_request_identifier(request: Request) -> str:
    return get_remote_address(request)
