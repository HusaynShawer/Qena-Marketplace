from fastapi import APIRouter, Depends, status
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
    return await review_service.get_reviews(product_id=product_id)


@review_router.post(
    "/{product_id}/reviews",
    status_code=status.HTTP_201_CREATED
)
async def create_review(
    product_id: UUID,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    review_service = ReviewService(db)
    review = await review_service.create(
        product_id=product_id,
        review_data=review_data,
        current_user=current_user
    )
    return {
        "message": "Review added",
        "review": {
            "id": str(review.id),
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at.isoformat() if review.created_at else None,
        }
    }