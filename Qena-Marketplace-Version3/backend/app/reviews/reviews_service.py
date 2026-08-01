from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Review
from pydantic import BaseModel, Field
from app.product.product_repo import ProductRepository
from app.reviews.reviews_repo import ReviewRepository
from uuid import UUID
from app.Helper.helper_func import raise_not_found


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="التقييم من 1 لـ 5")
    comment: str | None = Field(None, max_length=1000)   # ← str | None


class ReviewService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session)
        self.review_repo = ReviewRepository(session)

    async def create(
        self,
        product_id: UUID,           # ← صلحت التايبو
        review_data: ReviewCreate,
        current_user: User
    ) -> Review:
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise_not_found("Product not found")

        review = Review(
            product_id=product_id,  # ← صلحت التايبو هنا كمان
            user_id=current_user.id,
            rating=review_data.rating,
            comment=review_data.comment
        )

        created = await self.review_repo.create(review=review)
        await self.session.commit()     # ← Commit هنا عشان يتحفظ في الداتابيز
        return created

    async def get_reviews(self, product_id: UUID) -> list[dict]:
        reviews = await self.review_repo.get_by_product(product_id=product_id)
        return [
            {
                "id": str(r.id),
                "rating": r.rating,
                "comment": r.comment,
                "user_name": r.user.name if r.user else "Anonymous",
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ]