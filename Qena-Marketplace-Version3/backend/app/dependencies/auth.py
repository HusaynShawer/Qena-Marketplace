from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.user.user_service import UserService
from app.models.user import User
from uuid import UUID
from app.models.user import UserRole
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_service = UserService(db)
    user = await user_service.get_by_id(UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    
    return user

def require_role(role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.value != role:
            raise HTTPException(status_code=403, detail=f"Requires {role} role")
        return current_user
    return role_checker

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