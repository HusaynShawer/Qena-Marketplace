from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.seller import Seller
from app.models.order import Order
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

@router.get("/stats")
def get_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_sellers = db.query(Seller).count()
    pending_sellers = db.query(Seller).filter(Seller.approved == False).count()
    total_orders = db.query(Order).count()
    
    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "pending_sellers": pending_sellers,
        "total_orders": total_orders
    }

@router.get("/sellers/pending")
def pending_sellers(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    sellers = db.query(Seller).filter(Seller.approved == False).all()
    return [
        {
            "id": s.id,
            "shop_name": s.shop_name,
            "shop_description": s.shop_description,
            "user": {"id": s.user.id, "name": s.user.name, "email": s.user.email} if s.user else None
        }
        for s in sellers
    ]

@router.put("/sellers/{seller_id}/approve")
def approve_seller(seller_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.approved = True
    db.commit()
    return {"message": "Seller approved"}