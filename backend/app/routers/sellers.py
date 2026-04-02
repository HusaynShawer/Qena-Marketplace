from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.seller import Seller
from app.dependencies.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class SellerApply(BaseModel):
    shop_name: str
    shop_description: str = None

@router.post("/apply")
def apply_for_seller(
    data: SellerApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    
    seller = Seller(
        user_id=current_user.id,
        shop_name=data.shop_name,
        shop_description=data.shop_description,
        approved=False
    )
    db.add(seller)
    db.commit()
    return {"message": "Application submitted, waiting for approval"}