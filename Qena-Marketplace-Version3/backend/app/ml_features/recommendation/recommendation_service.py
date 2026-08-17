import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.product.product_repo import ProductRepository
from app.interactions.interaction_repo import InteractionRepository
from app.interactions.interaction_service import InteractionService
from app.models.interaction import InteractionType
from app.ml_features.recommendation.candidate_generator import CandidateGenerator
from app.ml_features.recommendation.strategies.most_selling import MostSellingStrategy
from app.ml_features.recommendation.strategies.trending import TrendingStrategy
from app.ml_features.recommendation.strategies.content_based import ContentBasedStrategy
from uuid import UUID

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        product_repo = ProductRepository(session=session)
        interaction_repo = InteractionRepository(session=session)
        interaction_service = InteractionService(session=session)

        most_selling = MostSellingStrategy(
            interaction_service=interaction_service,
            product_repo=product_repo,
        )
        trending = TrendingStrategy(
            interaction_service=interaction_service,
            product_repository=product_repo,
        )
        content_based = ContentBasedStrategy(
            interaction_service=interaction_service,
            product_repository=product_repo,
        )

        self.cand_gen = CandidateGenerator(
            most_selling=most_selling,
            trending=trending,
            content_based=content_based,
            product_repository=product_repo,
        )
        self.interaction_service = interaction_service
        self.product_repo = product_repo

    async def get_recommendations(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[Product]:
        try:
            candidates = await self.cand_gen.generate(
                user_id=user_id,
                limit=limit,
            )
        except Exception as exc:
            logger.error(f"CandidateGenerator failed: {exc}", exc_info=True)
            candidates = []

        if candidates:
            logger.info(f"Returning {len(candidates)} recommendations")
            return candidates

        logger.warning(f"No candidates, using fallback for user={user_id}")
        try:
            return await self.product_repo.get_recent_active(limit=limit)
        except AttributeError:
            return await self.product_repo.get_all(limit=limit)
        except Exception as exc:
            logger.error(f"Ultimate fallback failed: {exc}", exc_info=True)
            return []

    async def log_interaction(
        self,
        user_id: UUID,
        product_id: UUID,
        interaction_type: InteractionType,
    ) -> None:
        await self.interaction_service.log(
            user_id=user_id,
            product_id=product_id,
            interaction_type=interaction_type,
        )