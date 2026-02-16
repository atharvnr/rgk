import json

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import decode_token
from app.config import settings
from app.database import get_redis
from app.middleware.rate_limit import limiter
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service
from app.utils.response import user_to_response

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

_USERINFO_CACHE_TTL = 86400  # 1 day


async def _get_userinfo(auth0_id: str, token: str) -> dict:
    """Fetch Auth0 userinfo, cached in Redis for 1 day."""
    cache_key = f"userinfo:{auth0_id}"
    redis = get_redis()

    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{settings.auth0_domain}/userinfo",
            headers={"Authorization": f"Bearer {token}"},
        )
        resp.raise_for_status()
        userinfo = resp.json()

    await redis.set(cache_key, json.dumps(userinfo), ex=_USERINFO_CACHE_TTL)
    return userinfo


async def _extract_token_claims(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract auth0_id and email from JWT + Auth0 userinfo. Uses shared decode_token."""
    token = credentials.credentials
    payload = await decode_token(token)

    auth0_id = payload.get("sub")
    if not auth0_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub claim",
        )

    userinfo = await _get_userinfo(auth0_id, token)
    email = userinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not retrieve email from Auth0",
        )

    return {"auth0_id": auth0_id, "email": email}


@router.post("/register", response_model=UserResponse, status_code=201)
@limiter.limit("5/minute")
async def register(
    request: Request,
    data: UserCreate,
    claims: dict = Depends(_extract_token_claims),
):
    user = await user_service.create_user(data, claims["auth0_id"], claims["email"])
    return user_to_response(user)
