from fastapi import APIRouter

from app.schemas.public import PublicStatsResponse
from app.services import public_service

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/stats", response_model=PublicStatsResponse)
async def public_stats():
    return await public_service.get_public_stats()
