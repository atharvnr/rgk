import secrets

from fastapi import Depends, Header, HTTPException, status

from app.auth.jwt import get_current_user
from app.config import settings
from app.models.user import User, UserRole, VerificationStatus


def require_role(*roles: UserRole):
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role == UserRole.ROOT:
            return user
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized for this action",
            )
        return user

    return _check


def require_verified():
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.verification_status == VerificationStatus.NOT_REQUIRED:
            return user
        if user.verification_status != VerificationStatus.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Identity verification required.",
            )
        return user

    return _check


def require_internal_key():
    async def _check(authorization: str = Header(...)) -> None:
        if not settings.internal_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Internal API key not configured",
            )
        expected = f"Bearer {settings.internal_api_key}"
        if not secrets.compare_digest(authorization, expected):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid internal API key",
            )

    return _check
