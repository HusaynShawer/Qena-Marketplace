from uuid import UUID
from app.models.product import Product
from app.services.interaction_service import InteractionService
from app.repositories.product_repository import ProductRepository
from .base import BaseRecommendationStrategy


class TrendingStrategy(BaseRecommendationStrategy):
    def __init__(
        self,
        interaction_service: InteractionService,
        product_repository: ProductRepository,
        days: int = 7,
    ):
        self.interaction_service = interaction_service
        self.product_repository = product_repository
        self.days = days

    async def get_candidates(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[Product]:
        product_ids = await self.interaction_service.get_trending_product_ids(
            days=self.days,
            limit=limit,
        )

        if not product_ids:
            return []

        return await self.product_repository.get_by_ids(product_ids)