from app.models import Review
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

class ReviewRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, review: Review) -> Review:
        self.session.add(review)
        await self.session.flush()      # ← أضفت ()
        await self.session.refresh(review)
        return review

    async def get_by_product(self, product_id: UUID) -> list[Review]:
        # ← selectinload عشان نجيب اليوزر مع التقييم في query واحدة
        stmt = (
            select(Review)
            .where(Review.product_id == product_id)
            .options(selectinload(Review.user))
            .order_by(Review.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()   # ← .all() بترجع list فاضية مش None