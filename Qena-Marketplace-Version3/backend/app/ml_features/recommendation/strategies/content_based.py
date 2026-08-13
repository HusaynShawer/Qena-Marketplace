from uuid import UUID
import numpy as np
from app.models.product import Product
from app.interactions.interaction_service import InteractionService
from app.product.product_repo import ProductRepository
from .base import BaseRecommendationStrategy


class ContentBasedStrategy(BaseRecommendationStrategy):
    def __init__(
        self,
        interaction_service: InteractionService,
        product_repository: ProductRepository,
        interaction_limit: int = 20,
    ):
        self.interaction_service = interaction_service
        self.product_repository = product_repository
        self.interaction_limit = interaction_limit

    async def get_candidates(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[Product]:
        interacted_ids = await self.interaction_service.get_user_interacted_product_ids(
            user_id=user_id,
            limit=self.interaction_limit,
        )

        if not interacted_ids:
            return []

        interacted_products = await self.product_repository.get_by_ids_with_embeddings(
            product_ids=interacted_ids,
        )

        embeddings = [
            p.embeddings for p in interacted_products 
            if p.embeddings is not None
        ]

        if not embeddings:
            return []

        user_vector = np.mean(embeddings, axis=0).tolist()

        return await self.product_repository.get_similar_by_embedding(
            query_vector=user_vector,
            exclude_ids=interacted_ids,
            limit=limit,
        )