from uuid import UUID
from app.models.product import Product
from app.ml_features.recommendation.strategies.base import BaseRecommendationStrategy
from app.ml_features.recommendation.strategies.most_selling import MostSellingStrategy
from app.ml_features.recommendation.strategies.trending import TrendingStrategy
from app.ml_features.recommendation.strategies.content_based import ContentBasedStrategy


class CandidateGenerator:
    def __init__(
        self,
        most_selling: MostSellingStrategy,
        trending: TrendingStrategy,
        content_based: ContentBasedStrategy,
    ):
        self.strategies: list[tuple[BaseRecommendationStrategy, float]] = [
            (content_based, 0.5),
            (trending, 0.3),
            (most_selling, 0.2),
        ]

    async def generate(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[Product]:
        seen_ids: set[UUID] = set()
        scored: dict[UUID, tuple[Product, float]] = {}

        for strategy, weight in self.strategies:
            try:
                candidates = await strategy.get_candidates(
                    user_id=user_id,
                    limit=limit,
                )
            except Exception:
                continue

            for rank, product in enumerate(candidates):
                if product.id in seen_ids:
                    existing_score = scored[product.id][1]
                    rank_score = weight * (1 / (rank + 1))
                    scored[product.id] = (product, existing_score + rank_score)
                else:
                    seen_ids.add(product.id)
                    rank_score = weight * (1 / (rank + 1))
                    scored[product.id] = (product, rank_score)

        sorted_products = sorted(
            scored.values(),
            key=lambda x: x[1],
            reverse=True,
        )

        return [product for product, _ in sorted_products[:limit]]