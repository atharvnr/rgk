from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.internal import router as internal_router
from app.api.v1.proxy import router as proxy_router
from app.api.v1.requests import router as requests_router
from app.api.v1.schools import router as schools_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.users import router as users_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(schools_router)
api_router.include_router(requests_router)
api_router.include_router(sessions_router)
api_router.include_router(admin_router)
api_router.include_router(proxy_router)
api_router.include_router(internal_router)
