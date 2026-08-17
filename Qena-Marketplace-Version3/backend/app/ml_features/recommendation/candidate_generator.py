import logging
from uuid import UUID
from collections import defaultdict
from app.models.product import Product
from app.product.product_repo import ProductRepository
from app.ml_features.recommendation.strategies.base import BaseRecommendationStrategy
from app.ml_features.recommendation.strategies.most_selling import MostSellingStrategy
from app.ml_features.recommendation.strategies.trending import TrendingStrategy
from app.ml_features.recommendation.strategies.content_based import ContentBasedStrategy

logger = logging.getLogger(__name__)


class CandidateGenerator:
    def __init__(
        self,
        most_selling: MostSellingStrategy,
        trending: TrendingStrategy,
        content_based: ContentBasedStrategy,
        product_repository: ProductRepository,
    ):
        self.strategies: list[tuple[BaseRecommendationStrategy, float]] = [
            (content_based, 0.50),
            (trending, 0.30),
            (most_selling, 0.20),
        ]
        self.product_repository = product_repository

    async def generate(
        self,
        user_id: UUID,
        limit: int = 50,
    ) -> list[Product]:
        seen_ids: set[UUID] = set()
        scored: dict[UUID, tuple[Product, float]] = {}
        category_counts: dict[str, int] = defaultdict(int)
        strategy_limit = limit * 5

        for strategy, weight in self.strategies:
            strategy_name = type(strategy).__name__
            try:
                candidates = await strategy.get_candidates(
                    user_id=user_id,
                    limit=strategy_limit,
                )
                logger.info(
                    f"{strategy_name} returned {len(candidates)} for user={user_id}"
                )
            except Exception as exc:
                logger.error(f"{strategy_name} failed: {exc}", exc_info=True)
                continue

            for rank, product in enumerate(candidates):
                if product.id in seen_ids:
                    continue

                rank_score = weight * (1.0 / (rank + 1))
                cat = getattr(product, "category_id", None) or "unknown"
                if category_counts[cat] >= 4:
                    rank_score *= 0.7

                seen_ids.add(product.id)
                scored[product.id] = (product, rank_score)
                category_counts[cat] += 1

        # Fallback
        if len(scored) < limit:
            missing = limit - len(scored)
            logger.warning(f"Pool={len(scored)}, fetching {missing} fallback")
            try:
                extras = await self.product_repository.get_recent_active(
                    limit=missing * 3
                )
            except AttributeError:
                # If repo doesn't have get_recent_active yet, use get_all
                extras = await self.product_repository.get_all(limit=missing * 3)
            except Exception as exc:
                logger.error(f"Fallback failed: {exc}")
                extras = []

            for product in extras:
                if product.id not in seen_ids:
                    seen_ids.add(product.id)
                    scored[product.id] = (product, 0.001)
                    if len(scored) >= limit:
                        break

        sorted_products = sorted(
            scored.values(),
            key=lambda x: x[1],
            reverse=True,
        )
        result = [p for p, _ in sorted_products[:limit]]
        logger.info(f"Returned {len(result)} products for user={user_id}")
        return result