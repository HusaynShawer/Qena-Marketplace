import logging
from uuid import UUID

from fastapi import Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.Helper.helper_func import raise_not_found
from app.models import User, Review
from app.product.product_repo import ProductRepository
from app.reviews.reviews_repo import ReviewRepository

logger = logging.getLogger(__name__)


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str | None = Field(None, max_length=1000)


class ReviewService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session)
        self.review_repo = ReviewRepository(session)

    async def create(
        self,
        product_id: UUID,
        review_data: ReviewCreate,
        current_user: User,
    ) -> Review:
        logger.info("User %s creating review for product %s", current_user.id, product_id)

        product = await self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning("Review creation failed: product %s not found", product_id)
            raise_not_found("Product not found")

        review = Review(
            product_id=product_id,
            user_id=current_user.id,
            rating=review_data.rating,
            comment=review_data.comment,
        )

        created = await self.review_repo.create(review=review)
        await self.session.commit()
        logger.info("Review %s created for product %s by user %s", created.id, product_id, current_user.id)
        return created

    async def get_reviews(self, product_id: UUID) -> list[dict]:
        logger.debug("Fetching reviews for product %s", product_id)
        reviews = await self.review_repo.get_by_product(product_id=product_id)
        result = [
            {
                "id": str(r.id),
                "rating": r.rating,
                "comment": r.comment,
                "user_name": r.user.name if r.user else "Anonymous",
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ]
        logger.debug("Returning %d reviews for product %s", len(result), product_id)
        return result