from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Review, Product
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
from app.product.product_repo import ProductRepository
from app.reviews.reviews_repo import ReviewRepository
from uuid import UUID
from app.Helper.helper_func import raise_not_found,raise_bad_request


class ReviewCreate(BaseModel):
    rating: int
    comment: str = None

class ReviewService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session)
        self.review_repo  = ReviewRepository(session)

    async def create(self,produc_id:UUID,
                     review_data:ReviewCreate,
                     current_user:User
    ):
        product = await self.product_repo.get_by_id(produc_id)
        if not product:
            raise_not_found("Product Not found to make review")

        review = Review(
            produc_id = produc_id,
            user_id = current_user.id,
            rating = review_data.rating,
            comment = review_data.comment
        )

        return await self.review_repo.create(review=review)

    async def get_review(self,product_id):
        reviews = await self.review_repo.get_review(product_id=product_id)
        return [
                {
                    "id": r.id,
                    "rating": r.rating,
                    "comment": r.comment,
                    "user_name": r.user.name if r.user else "Anonymous",
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reviews
            ]