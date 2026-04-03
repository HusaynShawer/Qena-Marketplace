from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.seller import Seller
from app.models.product import Product
from app.models.order import Order
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

@router.get("/me")
def get_my_seller_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    product_count = db.query(Product).filter(Product.seller_id == seller.id, Product.is_active == True).count()
    order_count = db.query(Order).filter(Order.seller_id == seller.id).count()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.seller_id == seller.id,
        Order.status.in_(["confirmed", "shipped", "delivered"])
    ).scalar() or 0

    return {
        "id": seller.id,
        "shop_name": seller.shop_name,
        "shop_description": seller.shop_description,
        "approved": seller.approved,
        "stats": {
            "products": product_count,
            "orders": order_count,
            "revenue": round(float(total_revenue), 2),
        }
    }

@router.get("/me/orders")
def get_seller_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")

    orders = db.query(Order).filter(Order.seller_id == seller.id).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "buyer_name": o.buyer.name if o.buyer else "Unknown",
            "total_amount": o.total_amount,
            "status": o.status.value if o.status else "pending",
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in orders
    ]