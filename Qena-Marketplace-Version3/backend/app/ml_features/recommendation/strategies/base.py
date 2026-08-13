from abc import ABC, abstractclassmethod
from uuid import UUID
from app.models import Product

class BaseRecommendationStrategy(ABC):
    @abstractclassmethod
    async def get_candidates(
        self,
        user_id:UUID,
        limit:int = 20,
    )->list[Product]:
        pass