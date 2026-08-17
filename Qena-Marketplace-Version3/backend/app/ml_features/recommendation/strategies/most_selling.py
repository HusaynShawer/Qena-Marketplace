import logging
from uuid import UUID
from app.models.product import Product
from app.interactions.interaction_service import InteractionService
from app.product.product_repo import ProductRepository
from .base import BaseRecommendationStrategy

logger = logging.getLogger(__name__)


class MostSellingStrategy(BaseRecommendationStrategy):
    def __init__(
        self,
        interaction_service: InteractionService,
        product_repo: ProductRepository,
    ):
        self.interaction_service = interaction_service
        self.product_repo = product_repo

    async def get_candidates(self, user_id: UUID, limit: int = 20) -> list[Product]:
        try:
            product_ids = await self.interaction_service.get_top_purchased_product_ids(
                limit=limit * 3
            )
        except Exception as exc:
            logger.error(f"get_top_purchased_product_ids failed: {exc}")
            product_ids = []

        if product_ids:
            try:
                products = await self.product_repo.get_by_ids(product_ids)
                logger.info(f"MostSelling returned {len(products)}")
                return products
            except Exception as exc:
                logger.error(f"get_by_ids failed: {exc}")

        logger.warning("No purchase data, falling back")
        try:
            return await self.product_repo.get_recent_active(limit=limit)
        except AttributeError:
            # If get_recent_active doesn't exist yet, use get_all
            return await self.product_repo.get_all(limit=limit)
        except Exception as exc:
            logger.error(f"Fallback failed: {exc}")
            return []