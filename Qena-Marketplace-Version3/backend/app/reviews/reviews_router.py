from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.reviews.reviews_service import ReviewCreate, ReviewService
from app.dependencies.auth import get_current_user, get_db
from app.models import User

review_router = APIRouter(prefix="/products", tags=["reviews"])

@review_router.get("/{product_id}/reviews")
async def get_product_reviews(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    review_service = ReviewService(db)
    reviews = await review_service.get_review(product_id=product_id)
    return reviews

@review_router.post("/{product_id}/reviews")
async def create_review(
    product_id: UUID,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    review_service = ReviewService(db)
    await review_service.create(product_id=product_id,
                                review_data=review_data,
                                current_user=current_user)
    return {"message": "Review added"}