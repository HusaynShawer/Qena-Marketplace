from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.models.order import OrderItem
from app.Enums.order_enums import OrderStatusEnum
from uuid import UUID
from sqlalchemy.orm import selectinload


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

    async def get_by_id(self, order_id: UUID) -> Order | None:
        stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.id == order_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: UUID) -> list[Order]:
        stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.buyer_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_seller(self, seller_id: UUID) -> list[Order]:
        stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.seller_id == seller_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_status(self, status: OrderStatusEnum) -> list[Order]:
        stmt = select(Order).options(selectinload(Order.items).selectinload(OrderItem.product)).where(Order.status == status)
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

    async def create_order_item(self, order_item: OrderItem) -> OrderItem:
        self.session.add(order_item)
        await self.session.flush()
        return order_item