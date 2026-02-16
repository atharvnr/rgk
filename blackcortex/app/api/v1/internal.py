from fastapi import APIRouter, Depends

from app.auth.permissions import require_internal_key
from app.services import jobs_service

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/jobs/expire-associations", dependencies=[Depends(require_internal_key())])
async def expire_associations():
    count = await jobs_service.expire_stale_associations()
    return {"expired": count}


@router.post("/jobs/expire-sessions", dependencies=[Depends(require_internal_key())])
async def expire_sessions():
    count = await jobs_service.expire_unconfirmed_sessions()
    return {"expired": count}


@router.post("/jobs/notify-stale-requests", dependencies=[Depends(require_internal_key())])
async def notify_stale_requests():
    count = await jobs_service.notify_stale_requests()
    return {"stale_count": count}
