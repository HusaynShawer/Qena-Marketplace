from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.review import Review
from app.models.product import Product
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ReviewCreate(BaseModel):
    rating: int
    comment: str = None

@router.post("/{product_id}")
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(review)
    db.commit()
    return {"message": "Review added"}