import logging
from uuid import UUID
from app.models.product import Product
from app.interactions.interaction_service import InteractionService
from app.product.product_repo import ProductRepository
from .base import BaseRecommendationStrategy

logger = logging.getLogger(__name__)


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
        try:
            product_ids = await self.interaction_service.get_trending_products_ids(
                days=self.days,
                limit=limit * 3,
            )
        except Exception as exc:
            logger.error(f"get_trending_products_ids failed: {exc}")
            return []

        if not product_ids:
            logger.info("No trending products")
            return []

        try:
            purchased = await self.interaction_service.get_user_purchased_product_ids(
                user_id
            )
            exclude = set(purchased)
            filtered = [pid for pid in product_ids if pid not in exclude]
        except Exception:
            filtered = product_ids

        if not filtered:
            return []

        try:
            products = await self.product_repository.get_by_ids(filtered[:limit * 3])
            logger.info(f"Trending returned {len(products)}")
            return products
        except Exception as exc:
            logger.error(f"get_by_ids failed for trending: {exc}")
            return []