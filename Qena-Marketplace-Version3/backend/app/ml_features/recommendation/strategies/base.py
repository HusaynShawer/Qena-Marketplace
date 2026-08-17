from abc import ABC, abstractmethod
from uuid import UUID
from app.models.product import Product


class BaseRecommendationStrategy(ABC):
    @abstractmethod
    async def get_candidates(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[Product]:
        pass