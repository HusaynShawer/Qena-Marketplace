from uuid import UUID
from app.models.interaction import InteractionType,ProductInteraction
from app.interactions.interaction_repo import InteractionRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.unitofwork import UnitOfWork

class InteractionService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.interaction_repo = InteractionRepository(session=session)
        self.uow = UnitOfWork(session=session)

    async def log(
            self,user_id:UUID,
            product_id:UUID,
            interaction_type:InteractionType,
    )->None:
        try:
            await self.interaction_repo.log(user_id,product_id,interaction_type)
            self.uow.commit()
        except Exception:
            await self.uow.rollback()

    async def get_user_interactions_ids(
                self,user_id:UUID,
                limit:int = 50,
        )->list[UUID]:
        return await self.interaction_repo.get_user_interactions_ids(user_id=user_id,limit=limit)

    async def get_top_purchased_product_ids(
                self,
                limit:int = 50,
        )->list[UUID]:
        return await self.interaction_repo.get_top_purchased_product_ids(limit=limit)

    async def get_trending_products_ids(
                self,
                days:int = 7,
                limit:int = 30,
        )->list[UUID]:
        return await self.interaction_repo.get_trending_products_ids(days,limit)