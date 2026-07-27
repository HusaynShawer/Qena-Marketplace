from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.orders.order_service import OrderService
from app.schemas.checkout import CheckoutRequest
from app.schemas.order import OrderStatusUpdate
from app.dependencies.auth import get_current_user, require_role
from uuid import UUID

order_router = APIRouter(prefix="/orders", tags=["Orders"])


# ------------------------------------------------------------------
# Buyer endpoints
# ------------------------------------------------------------------

@order_router.post("/checkout", summary="Create orders from cart")
async def create_order(
    checkout: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Convert the current user's cart into one or more orders (split by seller).
    Deducts stock, credits each seller wallet, and clears the cart on success.
    Rolls back entirely on any failure.
    """
    service = OrderService(session)
    return await service.create_order(checkout, current_user)


@order_router.get("", summary="List buyer orders")
async def get_orders(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Return all orders placed by the authenticated buyer."""
    service = OrderService(session)
    return await service.get_orders(current_user)


@order_router.get("/{order_id}", summary="Get order detail")
async def get_order_detail(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Return full details of a single order including its line items.
    Returns 403 if the order does not belong to the caller.
    """
    service = OrderService(session)
    return await service.get_order_detail(order_id, current_user)


# ------------------------------------------------------------------
# Seller endpoints
# ------------------------------------------------------------------

seller_router = APIRouter(prefix="/seller/orders", tags=["Seller Orders"])


@seller_router.get("", summary="List seller orders")
async def get_seller_orders(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """Return all orders assigned to the authenticated seller's store."""
    service = OrderService(session)
    return await service.get_seller_orders(current_user)


@seller_router.get("/{order_id}/buyer-info", summary="Get buyer contact info")
async def get_buyer_info(
    order_id: UUID,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Retrieve buyer contact details (phone, address, city, notes) for an order.
    Sellers can only view their own orders; admins can view any order.
    """
    service = OrderService(session)
    return await service.get_buyer_info(order_id, current_user)


@seller_router.patch("/{order_id}/status", summary="Update order status")
async def update_order_status(
    order_id: UUID,
    body: OrderStatusUpdate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Advance an order through its allowed status transitions.
    Restores product stock automatically when status is set to 'cancelled'.
    Returns 400 if the requested transition is not permitted.
    """
    service = OrderService(session)
    return await service.update_order_status(order_id, body.status, current_user)


# ------------------------------------------------------------------
# Internal / utility endpoints
# ------------------------------------------------------------------

@order_router.delete("/{order_id}/cancel", summary="Hard-cancel an order")
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Hard-delete an order and restore stock for every line item.
    No response body is returned on success.
    """
    service = OrderService(session)
    order = await service.order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    await service.cancel(order)
    return {"message": "Order cancelled"}


@order_router.post("/{order_id}/credit-wallet", summary="Manually credit seller wallet")
async def credit_seller_wallet(
    order_id: UUID,
    seller_id: UUID,
    amount: float,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    """
    Manually trigger a wallet credit for a seller against a specific order.
    Admin only. Wraps WalletService.credit internally.
    """
    service = OrderService(session)
    await service.credit_seller_wallet(seller_id, amount, order_id)
    return {"message": "Wallet credited"}