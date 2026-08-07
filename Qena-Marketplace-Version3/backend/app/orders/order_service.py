import logging
from collections import defaultdict

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User

from app.cart.cart_repo import CartRepository
from app.orders.order_repo import OrderRepository
from app.product.product_repo import ProductRepository
from app.wallet.wallet_service import WalletService
from app.schemas.checkout import CheckoutRequest
from app.seller.seller_repo import SellerRepository
from app.Helper.helper_func import _buyer_info_dict
from app.Helper.helper import SELLER_ALLOWED_TRANSITIONS, VALID_STATUSES
from uuid import UUID

logger = logging.getLogger(__name__)


class OrderService:

    def __init__(self, session: AsyncSession):
        self.session = session

        # Repositories
        self.order_repo = OrderRepository(session)
        self.cart_repo = CartRepository(session)
        self.product_repo = ProductRepository(session)
        self.seller_repo = SellerRepository(session)
        # Services
        self.wallet_service = WalletService(session)

    # ------------------------------------------------------------------
    # Private Helpers
    # ------------------------------------------------------------------

    def _order_dict(self, order: Order) -> dict:
        return {
            "id": order.id,
            "total_amount": order.total_amount,
            "status": order.status.value if order.status else "pending",
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),
            "buyer_phone": order.buyer_phone,
            "buyer_address": order.buyer_address,
            "buyer_city": order.buyer_city,
            "buyer_notes": order.buyer_notes,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": (
                        item.product.name
                        if item.product
                        else "Unknown"
                    ),
                    "quantity": item.quantity,
                    "price": item.price,
                }
                for item in order.items
            ] if order.items else [],
        }

    # ------------------------------------------------------------------
    # Create Order
    # ------------------------------------------------------------------

    async def create_order(
        self,
        checkout: CheckoutRequest,
        current_user: User,
    ):
        logger.info("User %s is creating an order", current_user.id)

        try:
            cart_items = await self.cart_repo.get_user_cart(
                user_id=current_user.id
            )

            if not cart_items:
                logger.warning("Order creation failed: cart empty for user %s", current_user.id)
                raise HTTPException(
                    status_code=400,
                    detail="Cart is empty",
                )

            # Validate stock
            for item in cart_items:
                product = item.product

                if not product:
                    logger.warning("Order creation failed: product in cart missing for user %s", current_user.id)
                    raise HTTPException(
                        status_code=404,
                        detail="Product not found",
                    )

                if product.stock < item.quantity:
                    logger.warning(
                        "Order creation failed: insufficient stock for product %s (need %d, have %d)",
                        product.id, item.quantity, product.stock
                    )
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough stock for {product.name}",
                    )

            # Split cart by seller
            items_by_seller = defaultdict(list)
            for item in cart_items:
                items_by_seller[item.product.seller_id].append(item)

            created_orders = []

            for seller_id, items in items_by_seller.items():
                total = sum(
                    item.product.price * item.quantity
                    for item in items
                )

                order = Order(
                    buyer_id=current_user.id,
                    seller_id=seller_id,
                    total_amount=total,
                    status=OrderStatus.PENDING,
                    buyer_phone=checkout.buyer_phone,
                    buyer_address=checkout.buyer_address,
                    buyer_city=checkout.buyer_city,
                    buyer_notes=checkout.buyer_notes,
                )

                order = await self.order_repo.create(order)
                created_orders.append(order)
                logger.debug("Created order %s for seller %s, total: %.2f", order.id, seller_id, total)

                # Create order items
                for item in items:
                    order_item = OrderItem(
                        order_id=order.id,
                        product_id=item.product.id,
                        quantity=item.quantity,
                        price=item.product.price,
                    )
                    await self.order_repo.create_order_item(order_item)
                    logger.debug("Added order item: product %s, qty %d", item.product.id, item.quantity)

                    # Update stock
                    item.product.stock -= item.quantity
                    await self.product_repo.update(item.product)
                    logger.debug("Decremented stock for product %s", item.product.id)

                # Credit seller wallet
                await self.wallet_service.credit_wallet(
                    seller_id=seller_id,
                    amount=total,
                    order_id=order.id,
                )
                logger.info("Credited seller %s wallet with %.2f for order %s", seller_id, total, order.id)

            # Clear cart
            await self.cart_repo.clear_cart(current_user.id)
            logger.info("Cleared cart for user %s", current_user.id)

            # Commit everything once
            await self.session.commit()
            logger.info("Order(s) created successfully for user %s: %d orders", current_user.id, len(created_orders))

            return {
                "message": "Orders created successfully",
                "orders": [
                    {
                        "order_id": order.id,
                        "seller_id": order.seller_id,
                        "total": order.total_amount,
                        "status": order.status.value,
                    }
                    for order in created_orders
                ],
            }

        except Exception:
            logger.exception("Order creation failed for user %s", current_user.id)
            await self.session.rollback()
            raise

    # ------------------------------------------------------------------
    # Buyer Orders
    # ------------------------------------------------------------------

    async def get_orders(self, current_user: User):
        logger.info("Fetching orders for user %s", current_user.id)
        orders = await self.order_repo.get_by_user(user_id=current_user.id)
        logger.debug("User %s has %d orders", current_user.id, len(orders))
        return [self._order_dict(order) for order in orders]

    # ------------------------------------------------------------------
    # Order Details
    # ------------------------------------------------------------------

    async def get_order_detail(self, order_id: UUID, current_user: User):
        logger.info("User %s fetching order %s", current_user.id, order_id)
        order = await self.order_repo.get_by_id(order_id)

        if not order:
            logger.warning("Order %s not found", order_id)
            raise HTTPException(status_code=404, detail="Order not found")

        if order.buyer_id != current_user.id:
            logger.warning("User %s unauthorized access to order %s", current_user.id, order_id)
            raise HTTPException(status_code=403, detail="Not authorized")

        return self._order_dict(order)

    # ------------------------------------------------------------------
    # Seller Orders
    # ------------------------------------------------------------------

    async def get_seller_orders(self, current_user: User):
        logger.info("Fetching orders for seller (user %s)", current_user.id)
        seller = await self.seller_repo.get_by_user_id(current_user.id)

        if not seller:
            logger.warning("Seller not found for user %s", current_user.id)
            raise HTTPException(status_code=400, detail="Seller is not found")

        orders = await self.order_repo.get_by_seller(seller.id)
        logger.debug("Seller %s has %d orders", seller.id, len(orders))
        return [self._order_dict(order) for order in orders]

    # ------------------------------------------------------------------
    # Buyer Info (seller or admin)
    # ------------------------------------------------------------------

    async def get_buyer_info(self, order_id: UUID, current_user: User) -> dict:
        logger.info("User %s requesting buyer info for order %s", current_user.id, order_id)
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            logger.warning("Order %s not found for buyer info", order_id)
            raise HTTPException(status_code=400, detail="Order is not found")

        if current_user.role.value == "admin":
            logger.info("Admin %s accessing buyer info for order %s", current_user.id, order_id)
            return _buyer_info_dict(order)

        # Seller
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller or seller.id != order.seller_id:
            logger.warning("Unauthorized buyer info access: user %s, order %s", current_user.id, order_id)
            raise HTTPException(status_code=403, detail="Not authorized")

        return _buyer_info_dict(order)

    # ------------------------------------------------------------------
    # Update Order Status (seller)
    # ------------------------------------------------------------------

    async def update_order_status(
        self,
        order_id: UUID,
        status: str,
        current_user: User,
    ):
        logger.info("User %s attempting to update order %s to status '%s'", current_user.id, order_id, status)

        # Validate status
        if status not in VALID_STATUSES:
            logger.warning("Invalid status '%s' provided for order %s", status, order_id)
            raise HTTPException(status_code=400, detail=f"Invalid status. Valid values: {VALID_STATUSES}")

        # Get seller
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("User %s is not a seller", current_user.id)
            raise HTTPException(status_code=403, detail="Not a seller")

        # Get order
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            logger.warning("Order %s not found for status update", order_id)
            raise HTTPException(status_code=404, detail="Order not found")

        # Check ownership
        if order.seller_id != seller.id:
            logger.warning("User %s (seller %s) does not own order %s", current_user.id, seller.id, order_id)
            raise HTTPException(status_code=403, detail="Not authorized")

        current_status = order.status.value
        allowed = SELLER_ALLOWED_TRANSITIONS.get(current_status, [])
        if status not in allowed:
            logger.warning("Invalid status transition for order %s: %s -> %s", order_id, current_status, status)
            raise HTTPException(
                status_code=400,
                detail=f"Cannot change status from '{current_status}' to '{status}'. Allowed: {allowed}",
            )

        # Restore stock if cancelled
        if status == OrderStatus.CANCELLED.value:
            for item in order.items:
                item.product.stock += item.quantity
                await self.product_repo.update(item.product)
            logger.info("Restored stock for cancelled order %s", order_id)

        order.status = OrderStatus(status)
        await self.order_repo.save(order)
        await self.session.commit()
        logger.info("Order %s status updated to '%s' by seller %s", order_id, status, current_user.id)

        return {
            "message": "Status updated successfully",
            "status": order.status.value,
        }

    # ------------------------------------------------------------------
    # Cancel (internal)
    # ------------------------------------------------------------------

    async def cancel(self, order: Order) -> None:
        logger.info("Cancelling order %s", order.id)
        items = [o.item for o in order.items] if order.items else []
        if items:
            for item in items:
                if item.product:
                    item.product.stock += item.quantity
                    await self.product_repo.update(item.product)
            await self.session.delete(order)
            await self.session.commit()
            logger.info("Order %s cancelled and stock restored", order.id)
        else:
            logger.debug("Order %s had no items to restore", order.id)

    # ------------------------------------------------------------------
    # Credit Seller Wallet
    # ------------------------------------------------------------------

    async def credit_seller_wallet(self, seller_id: UUID, amount: float, order_id: UUID) -> None:
        logger.info("Crediting wallet for seller %s, amount %.2f, order %s", seller_id, amount, order_id)
        await self.wallet_service.credit_wallet(
            seller_id=seller_id,
            amount=amount,
            order_id=order_id,
        )