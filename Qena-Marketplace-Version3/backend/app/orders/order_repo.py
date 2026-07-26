from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.Enums.order_enums import OrderStatusEnum


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ---------- Create ----------

    async def create(self, order: Order) -> Order:
        self.session.add(order)
        await self.session.flush()
        await self.session.refresh(order)
        return order

    # ---------- Read ----------

    async def get_by_id(self, order_id: int) -> Order | None:
        stmt = select(Order).where(Order.id == order_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int) -> list[Order]:
        stmt = select(Order).where(Order.buyer_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_seller(self, seller_id: int) -> list[Order]:
        stmt = select(Order).where(Order.seller_id == seller_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_status(self, status: OrderStatusEnum) -> list[Order]:
        stmt = select(Order).where(Order.status == status)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    # ---------- Update ----------

    async def save(self, order: Order) -> Order:
        """
        Commit any modifications already made to the Order object.
        """
        await self.session.commit()
        await self.session.refresh(order)
        return order

    # ---------- Delete ----------

    async def delete(self, order: Order) -> None:
        await self.session.delete(order)
        await self.session.commit()