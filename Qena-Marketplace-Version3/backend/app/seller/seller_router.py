from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.seller.seller_service import SellerService, SellerApply, SellerUpdate
from app.dependencies.auth import get_current_user, require_role
from uuid import UUID

seller_router = APIRouter(prefix="/sellers", tags=["Sellers"])


# ------------------------------------------------------------------
# Public
# ------------------------------------------------------------------

@seller_router.get("", summary="List all sellers")
async def get_all_sellers(
    session: AsyncSession = Depends(get_db),
):
    """Return all registered sellers."""
    service = SellerService(session)
    return await service.get_all_seller()


@seller_router.get("/{seller_id}", summary="Get seller by ID")
async def get_seller(
    seller_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """Return a single seller by ID. Raises 404 if not found."""
    service = SellerService(session)
    return await service.get_seller(seller_id)


# ------------------------------------------------------------------
# Authenticated user — apply / manage own seller account
# ------------------------------------------------------------------

@seller_router.post("/apply", summary="Apply to become a seller", status_code=201)
async def apply_as_seller(
    body: SellerApply,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Submit a seller application for the authenticated user.
    Raises 400 if the user already has a seller account.
    Account is created with approved=False, pending admin review.
    """
    service = SellerService(session)
    return await service.create(current_user, body)


@seller_router.patch("/me", summary="Update my seller profile")
async def update_seller(
    body: SellerUpdate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Update the authenticated seller's shop info (name, description, phone).
    Raises 400 if shop_name is shorter than 3 characters.
    """
    service = SellerService(session)
    return await service.update(current_user, body)


# ------------------------------------------------------------------
# Admin
# ------------------------------------------------------------------

@seller_router.delete("/{seller_id}", summary="Delete a seller", status_code=204)
async def delete_seller(
    seller_id: UUID,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    """
    Delete a seller account by ID. Admin only.
    Raises 404 if the seller does not exist.
    """
    service = SellerService(session)
    await service.delete(seller_id)