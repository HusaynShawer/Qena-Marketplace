from uuid import UUID
from datetime import timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.interaction import InteractionType,ProductInteraction

class InteractionRepository:
    def __init__(self,session:AsyncSession):
        self.session = session

    async def log(self,user_id:UUID,product_id:UUID,
                  interaction_type = InteractionType)->ProductInteraction:
        interaction = ProductInteraction(
            user_id=user_id,
            product_id=product_id,
            interaction_type=interaction_type

        )
        self.session.add(interaction)
        await self.session.flush()
        return interaction

    async def get_user_interactions_ids(
            self,user_id:UUID,
            limit:int = 50,
    )->list[UUID]:
        query =   (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.user_id == user_id)
            .order_by(desc(ProductInteraction.created_at))
            .limit(limit)
            )
        result = await self.session.execute(query)
        return result.scalars().all()

    
    async def get_top_purchased_product_ids(
            self,
            limit:int = 50,
    )->list[UUID]:
        query =   (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.interaction_type == InteractionType.PURCHASE)
            .group_by(ProductInteraction.product_id)
            .order_by(desc(func.count()))
            .limit(limit)
            )
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_trending_products_ids(
            self,
            days:int = 7,
            limit:int = 30,
    )->list[UUID]:
        since = datetime.utcnow() - timedelta(days=days)
        query =   (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.created_at >= since)
            .group_by(ProductInteraction.product_id)
            .order_by(desc(func.count()))
            .limit(limit)
            )
        result = await self.session.execute(query)
        return result.scalars().all()