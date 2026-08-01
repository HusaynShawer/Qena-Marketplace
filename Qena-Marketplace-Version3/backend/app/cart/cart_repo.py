from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart


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
    ) -> list[Cart]:
        stmt = (
            select(Cart)
            .options(selectinload(Cart.product))
            .where(Cart.user_id == user_id)
        )

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_cart_item(
        self,
        user_id: UUID,
        product_id: UUID,
    ) -> Cart | None:
        stmt = (
            select(Cart)
            .options(selectinload(Cart.product))
            .where(
                Cart.user_id == user_id,
                Cart.product_id == product_id,
            )
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(
        self,
        cart_id: UUID,
    ) -> Cart | None:
        stmt = (
            select(Cart)
            .options(selectinload(Cart.product))
            .where(Cart.id == cart_id)
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    # ✅ دالة جديدة — البحث بـ cart item id و user_id معاً
    async def get_cart_item_by_id(
        self,
        item_id: UUID,
        user_id: UUID,
    ) -> Cart | None:
        stmt = (
            select(Cart)
            .options(selectinload(Cart.product))
            .where(
                Cart.id == item_id,
                Cart.user_id == user_id,
            )
        )

        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def clear_cart(
        self,
        user_id: UUID,
    ) -> None:
        carts = await self.get_user_cart(user_id)

        for cart in carts:
            await self.session.delete(cart)

        await self.session.flush()

    async def delete(
        self,
        cart: Cart,
    ) -> None:
        await self.session.delete(cart)
        await self.session.flush()

    async def save(
        self,
        cart: Cart,
    ) -> Cart:
        await self.session.flush()
        return cart