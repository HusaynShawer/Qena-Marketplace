import logging
from uuid import UUID
import numpy as np
from app.models.product import Product
from app.interactions.interaction_service import InteractionService
from app.product.product_repo import ProductRepository
from .base import BaseRecommendationStrategy

logger = logging.getLogger(__name__)


class ContentBasedStrategy(BaseRecommendationStrategy):
    def __init__(
        self,
        interaction_service: InteractionService,
        product_repository: ProductRepository,
        interaction_limit: int = 50,
    ):
        self.interaction_service = interaction_service
        self.product_repository = product_repository
        self.interaction_limit = interaction_limit

    async def get_candidates(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[Product]:
        try:
            weighted = await self.interaction_service.get_user_interactions_with_weights(
                user_id=user_id,
                limit=self.interaction_limit,
            )
        except Exception as exc:
            logger.error(f"get_user_interactions_with_weights failed: {exc}")
            return []

        if not weighted:
            logger.info(f"No interaction history for user={user_id}")
            return []

        product_ids = [pid for pid, _ in weighted]
        weights_map = {pid: w for pid, w in weighted}

        try:
            products = await self.product_repository.get_by_ids_with_embeddings(
                product_ids=product_ids,
            )
        except Exception as exc:
            logger.error(f"get_by_ids_with_embeddings failed: {exc}")
            return []

        vectors, weight_values = [], []
        for p in products:
            if p.embeddings is not None and p.id in weights_map:
                vectors.append(np.array(p.embeddings))
                weight_values.append(weights_map[p.id])

        if not vectors:
            logger.warning(f"No embeddings for user={user_id}")
            return []

        user_vector = np.average(vectors, axis=0, weights=weight_values).tolist()

        try:
            similar = await self.product_repository.get_similar_by_embedding(
                query_vector=user_vector,
                exclude_ids=product_ids,
                limit=limit,
            )
            logger.info(f"ContentBased found {len(similar)} for user={user_id}")
            return similar
        except Exception as exc:
            logger.error(f"get_similar_by_embedding failed: {exc}")
            return []