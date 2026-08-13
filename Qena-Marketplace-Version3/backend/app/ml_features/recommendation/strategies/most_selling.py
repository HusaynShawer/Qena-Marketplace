from uuid import UUID
from app.models import Product
from app.interactions.interaction_service import InteractionService
from app.product.product_repo import ProductRepository
from .base import BaseRecommendationStrategy

class MostSellingStrategy(BaseRecommendationStrategy):
    def __init__(self,
                 interaction_service:InteractionService,
                 product_repo:ProductRepository):
        super().__init__()
        self.interaction_service = interaction_service
        self.product_repo = product_repo

    async def get_candidates(self, user_id, limit = 20):
        product_ids = await self.interaction_service.get_top_purchased_product_ids(limit=limit)
        if not product_ids:
            return []
        return await self.product_repo.get_by_ids(product_ids)