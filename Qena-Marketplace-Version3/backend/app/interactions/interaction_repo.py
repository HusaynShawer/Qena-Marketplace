from uuid import UUID
from datetime import timedelta, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.interaction import InteractionType, ProductInteraction


class InteractionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log(
        self,
        user_id: UUID,
        product_id: UUID,
        interaction_type: InteractionType,
    ) -> ProductInteraction:
        interaction = ProductInteraction(
            user_id=user_id,
            product_id=product_id,
            interaction_type=interaction_type,
        )
        self.session.add(interaction)
        await self.session.flush()
        return interaction

    async def get_user_interactions_ids(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[UUID]:
        query = (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.user_id == user_id)
            .distinct()
            .order_by(desc(ProductInteraction.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_user_interactions_with_weights(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[tuple[UUID, float]]:
        """
        Returns (product_id, weight). Safe for both string and enum DB columns.
        """
        query = (
            select(
                ProductInteraction.product_id,
                ProductInteraction.interaction_type,
            )
            .where(ProductInteraction.user_id == user_id)
            .order_by(desc(ProductInteraction.created_at))
            .limit(limit)
        )
        result = await self.session.execute(query)
        rows = result.all()

        weight_map = {
            "view": 1.0,
            "click": 1.0,
            "cart_add": 2.0,
            "purchase": 3.0,
        }

        weights: dict[UUID, float] = {}
        for pid, itype in rows:
            # Normalize: handles Enum members, strings, and unknown values
            if isinstance(itype, str):
                key = itype.lower()
            else:
                # Enum member — use its value (e.g. InteractionType.CLICK.value)
                key = str(getattr(itype, "value", itype)).lower()
            weights[pid] = weights.get(pid, 0.0) + weight_map.get(key, 1.0)

        return list(weights.items())

    async def get_top_purchased_product_ids(
        self,
        limit: int = 50,
    ) -> list[UUID]:
        query = (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.interaction_type == InteractionType.PURCHASE)
            .group_by(ProductInteraction.product_id)
            .order_by(desc(func.count()))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_trending_products_ids(
        self,
        days: int = 7,
        limit: int = 30,
    ) -> list[UUID]:
        since = datetime.utcnow() - timedelta(days=days)
        query = (
            select(ProductInteraction.product_id)
            .where(ProductInteraction.created_at >= since)
            .group_by(ProductInteraction.product_id)
            .order_by(desc(func.count()))
            .limit(limit)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_user_purchased_product_ids(
        self,
        user_id: UUID,
    ) -> list[UUID]:
        query = (
            select(ProductInteraction.product_id)
            .where(
                ProductInteraction.user_id == user_id,
                ProductInteraction.interaction_type == InteractionType.PURCHASE,
            )
            .distinct()
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())