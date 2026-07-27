from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.user.user_service import UserService
from app.dependencies.auth import get_current_user, require_role
from uuid import UUID

user_router = APIRouter(prefix="/users", tags=["Users"])


# ------------------------------------------------------------------
# Authenticated user — own profile
# ------------------------------------------------------------------

@user_router.get("/me", summary="Get my profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's profile."""
    service = UserService(db)
    return await service.get_profile(current_user)


# TODO: update profile
# @router.patch("/me", summary="Update my profile")
# async def update_profile(...):
#     pass


# ------------------------------------------------------------------
# Admin
# ------------------------------------------------------------------

@user_router.get("", summary="List all users")
async def get_all_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return all registered users. Admin only."""
    service = UserService(db)
    return await service.get_all(current_user)


@user_router.get("/{user_id}", summary="Get user by ID")
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """Return a single user by ID. Admin only. Raises 404 if not found."""
    service = UserService(db)
    return await service.get_user(user_id)


@user_router.delete("/{user_id}", summary="Delete a user", status_code=204)
async def delete_user(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a user account by ID. Admin only.
    Raises 404 if the user does not exist.
    """
    service = UserService(db)
    await service.delete(current_user, seller_id=user_id)