from app.models import Review, Product
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy import select
class ReviewRepository:
    def __init__(self,session:AsyncSession):
        self.session = session

    async def create(self,review:Review)->Review|None:
        self.session.add(review)
        await self.session.flush
        return review

    async def get_review(self,product_id)->list[Review]|None:
        stmt = select(Review).where(Review.product_id ==product_id)
        reviews = await self.session.execute(stmt)
        return reviews.scalars().all() 