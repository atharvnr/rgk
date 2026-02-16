import logging
import time

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

security = HTTPBearer()

_jwks_cache: dict | None = None
_jwks_cache_at: float = 0
_JWKS_TTL = 3600  # 1 hour


async def _get_jwks(force_refresh: bool = False) -> dict:
    global _jwks_cache, _jwks_cache_at
    if _jwks_cache is None or force_refresh or (time.time() - _jwks_cache_at > _JWKS_TTL):
        url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_cache_at = time.time()
        logger.info("JWKS cache refreshed")
    return _jwks_cache


def _find_rsa_key(jwks: dict, kid: str) -> dict | None:
    for key in jwks.get("keys", []):
        if key["kid"] == kid:
            return {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
    return None


async def decode_token(token: str) -> dict:
    """Shared JWT decode logic. Returns the decoded payload dict."""
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
        )

    kid = unverified_header.get("kid", "")
    jwks = await _get_jwks()
    rsa_key = _find_rsa_key(jwks, kid)

    # W1: If kid not found, force-refresh JWKS in case of key rotation
    if rsa_key is None:
        jwks = await _get_jwks(force_refresh=True)
        rsa_key = _find_rsa_key(jwks, kid)

    if rsa_key is None:
        logger.warning("Signing key not found for kid=%s", kid)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find signing key",
        )

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=settings.auth0_algorithms,
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    payload = await decode_token(credentials.credentials)

    auth0_id = payload.get("sub")
    if not auth0_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing sub claim",
        )

    user = await User.find_one(User.auth0_id == auth0_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not registered",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account deactivated",
        )

    return user
