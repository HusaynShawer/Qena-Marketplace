from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole
from app.user.user_service import UserService
from app.utils.jwt import decode_token
from uuid import UUID

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db),
) -> User:

    payload = decode_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )

    user_id = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )
    # JWT `sub` is stored as a string; convert to UUID for DB lookup
    try:
        user_uuid = UUID(user_id)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    user_service = UserService(session)

    return await user_service.get_user(user_uuid)

def require_role(role: UserRole):
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:

        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )

        return current_user

    return role_checker


async def require_seller_approved(
    current_user: User = Depends(get_current_user),
) -> User:

    if current_user.role != UserRole.SELLER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a seller",
        )

    seller = current_user.seller_profile

    if seller is None or not seller.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller account not approved",
        )

    return current_user