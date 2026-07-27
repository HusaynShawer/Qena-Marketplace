from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart import Cart
from uuid import UUID


class CartRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        cart: Cart,
    ) -> Cart:
        self.session.add(cart)
        await self.session.flush()
        await self.session.refresh(cart)
        return cart

    async def get_user_cart(
        self,
        user_id: UUID,
    ) -> Cart | None:
        stmt = select(Cart).where(Cart.user_id == user_id)

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()


    async def get_cart_item(self,user_id: UUID,product_id: UUID):
        stmt = select(Cart).where(Cart.user_id == user_id,
                                  Cart.product_id ==product_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


    async def get_by_id(
        self,
        cart_id: UUID,
    ) -> Cart | None:
        stmt = select(Cart).where(Cart.id == cart_id)

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()

    async def clear_cart(
        self,
        user_id: UUID,
    ):
        """
        NOTE:
        This implementation deletes the Cart record itself.
        If your project has a CartItem model (recommended),
        this function should delete CartItems instead.
        """

        cart = await self.get_user_cart(user_id)

        if not cart:
            return

        await self.session.delete(cart)
        await self.session.flush()

    async def delete(self,cart:Cart)->None:
        await self.session.delete(cart)
        await self.session.flush()


    async def save(
        self,
        cart: Cart,
    ) -> Cart:
        await self.session.flush()
        await self.session.refresh(cart)
        return cart