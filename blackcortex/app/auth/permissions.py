from fastapi import Depends, HTTPException, status

from app.auth.jwt import get_current_user
from app.models.user import User, UserRole


def require_role(*roles: UserRole):
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role {user.role} not authorized. Required: {', '.join(roles)}",
            )
        return user

    return _check
