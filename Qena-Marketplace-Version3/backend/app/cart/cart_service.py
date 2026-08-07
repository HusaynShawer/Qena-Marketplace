import logging
from fastapi import HTTPException
from app.models.cart import Cart
from app.cart.cart_repo import CartRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.items import CartItemCreate, CartItemUpdate
from app.product.product_repo import ProductRepository
from uuid import UUID
from app.core.unitofwork import UnitOfWork

logger = logging.getLogger(__name__)


class CartService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.cart_repo = CartRepository(session=session)
        self.product_repo = ProductRepository(session=session)
        self.uow = UnitOfWork(session)

    async def get_cart(self, current_user: User) -> dict:
        logger.info("Fetching cart for user %s", current_user.id)
        cart_items = await self.cart_repo.get_user_cart(current_user.id)

        items = []
        for cart_item in cart_items:
            product = await self.product_repo.get_by_id(cart_item.product_id)
            items.append({
                "id": cart_item.id,
                "quantity": cart_item.quantity,
                "product": {
                    "id": str(product.id),
                    "name": product.name,
                    "price": product.price,
                    "image_url": product.image_url,
                    "stock": product.stock,
                }
            })

        total = sum(i["product"]["price"] * i["quantity"] for i in items)
        logger.debug("Cart for user %s has %d items, total: %.2f", current_user.id, len(items), total)
        return {"items": items, "total": round(total, 2)}

    async def add_to_cart(self, item: CartItemCreate, current_user: User) -> dict:
        logger.info("User %s adding product %s qty %d to cart", current_user.id, item.product_id, item.quantity)
        product = await self.product_repo.get_by_id(item.product_id)
        if not product:
            logger.warning("Add to cart failed: product %s not found", item.product_id)
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < item.quantity:
            logger.warning("Add to cart failed: insufficient stock for product %s (stock: %d, requested: %d)",
                           item.product_id, product.stock, item.quantity)
            raise HTTPException(status_code=400, detail="Insufficient stock")

        cart_item = await self.cart_repo.get_cart_item(current_user.id, item.product_id)

        if cart_item:
            cart_item.quantity += item.quantity
            await self.cart_repo.save(cart_item)
            logger.debug("Updated existing cart item %s (new qty: %d)", cart_item.id, cart_item.quantity)
        else:
            cart_item = Cart(
                user_id=current_user.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            await self.cart_repo.create(cart_item)
            logger.debug("Created new cart item %s", cart_item.id)

        product.stock -= item.quantity

        try:
            await self.uow.commit()
            logger.info("Cart updated for user %s after adding product %s", current_user.id, item.product_id)
        except Exception:
            logger.exception("Commit failed while adding to cart for user %s", current_user.id)
            await self.uow.rollback()
            raise HTTPException(status_code=500, detail="Failed to add to cart")

        return {"message": "Added to cart"}

    async def delete_item(self, item_id: UUID, current_user: User) -> dict:
        logger.info("User %s deleting cart item %s", current_user.id, item_id)
        cart = await self.cart_repo.get_cart_item_by_id(item_id, current_user.id)
        if not cart:
            logger.warning("Delete cart item failed: item %s not found for user %s", item_id, current_user.id)
            raise HTTPException(status_code=404, detail="Cart item not found")

        product = await self.product_repo.get_by_id(cart.product_id)
        if product:
            product.stock += cart.quantity
            logger.debug("Restored stock for product %s (+%d)", product.id, cart.quantity)

        await self.cart_repo.delete(cart=cart)

        try:
            await self.uow.commit()
            logger.info("Cart item %s deleted for user %s", item_id, current_user.id)
        except Exception:
            logger.exception("Commit failed while deleting cart item %s for user %s", item_id, current_user.id)
            await self.uow.rollback()
            raise HTTPException(status_code=500, detail="Failed to delete item")

        return {"message": "Cart item was deleted"}

    async def update_quantity(self, item_id: UUID, quantity: int, current_user: User) -> Cart:
        logger.info("User %s updating cart item %s qty to %d", current_user.id, item_id, quantity)
        cart = await self.cart_repo.get_cart_item_by_id(item_id, current_user.id)
        if not cart:
            logger.warning("Update quantity failed: item %s not found for user %s", item_id, current_user.id)
            raise HTTPException(status_code=404, detail="Cart Not Found")

        if quantity <= 0:
            logger.warning("Update quantity failed: invalid quantity %d", quantity)
            raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

        product = await self.product_repo.get_by_id(cart.product_id)
        if not product:
            logger.warning("Update quantity failed: product %s not found", cart.product_id)
            raise HTTPException(status_code=404, detail="Product Not Found")

        if product.stock < quantity:
            logger.warning("Update quantity failed: insufficient stock for product %s (stock: %d, requested: %d)",
                           cart.product_id, product.stock, quantity)
            raise HTTPException(status_code=400, detail="Quantity Not enough")

        cart.quantity = quantity
        await self.cart_repo.save(cart)

        try:
            await self.uow.commit()
            logger.info("Cart item %s quantity updated to %d for user %s", item_id, quantity, current_user.id)
        except Exception:
            logger.exception("Commit failed while updating quantity for item %s", item_id)
            await self.uow.rollback()
            raise HTTPException(status_code=500, detail="Failed to update quantity")

        return cart

    async def clear_cart(self, current_user: User) -> dict:
        logger.info("User %s clearing cart", current_user.id)
        cart_items = await self.cart_repo.get_user_cart(current_user.id)
        if not cart_items:
            logger.warning("Clear cart failed: cart already empty for user %s", current_user.id)
            raise HTTPException(status_code=400, detail="Cart is already empty")

        for cart_item in cart_items:
            product = await self.product_repo.get_by_id(cart_item.product_id)
            if product:
                product.stock += cart_item.quantity

        await self.cart_repo.clear_cart(current_user.id)

        try:
            await self.uow.commit()
            logger.info("Cart cleared for user %s, %d items restored", current_user.id, len(cart_items))
        except Exception:
            logger.exception("Commit failed while clearing cart for user %s", current_user.id)
            await self.uow.rollback()
            raise HTTPException(status_code=500, detail="Failed to clear cart")

        return {"message": "Cart cleared successfully"}