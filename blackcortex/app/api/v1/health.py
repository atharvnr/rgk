from fastapi import APIRouter

from app.database import get_redis, motor_client

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/health/ready")
async def health_ready():
    checks = {"mongodb": False, "redis": False}

    # Check MongoDB
    try:
        if motor_client:
            await motor_client.admin.command("ping")
            checks["mongodb"] = True
    except Exception:
        pass

    # Check Redis
    try:
        redis = get_redis()
        await redis.ping()
        checks["redis"] = True
    except Exception:
        pass

    all_ready = all(checks.values())
    return {"status": "ready" if all_ready else "degraded", "checks": checks}
