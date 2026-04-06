from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.seller import Seller
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.models.wallet import Wallet, WithdrawalRequest, WithdrawalStatus, WalletTransaction
from app.dependencies.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user

@router.get("/stats")
def get_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_sellers = db.query(Seller).count()
    pending_sellers = db.query(Seller).filter(Seller.approved == False).count()
    total_orders = db.query(Order).count()

    # Financial stats
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    pending_withdrawals = db.query(func.sum(WithdrawalRequest.amount)).filter(
        WithdrawalRequest.status == WithdrawalStatus.PENDING
    ).scalar() or 0
    paid_withdrawals = db.query(func.sum(WithdrawalRequest.amount)).filter(
        WithdrawalRequest.status == WithdrawalStatus.APPROVED
    ).scalar() or 0
    total_wallet_balance = db.query(func.sum(Wallet.balance)).scalar() or 0
    total_earned = db.query(func.sum(Wallet.total_earned)).scalar() or 0

    # Platform profit (total revenue - total paid to sellers)
    platform_balance = total_revenue - paid_withdrawals

    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "pending_sellers": pending_sellers,
        "total_orders": total_orders,
        "financial": {
            "total_revenue": round(float(total_revenue), 2),
            "total_wallet_balance": round(float(total_wallet_balance), 2),
            "total_earned_by_sellers": round(float(total_earned), 2),
            "pending_withdrawals": round(float(pending_withdrawals), 2),
            "paid_withdrawals": round(float(paid_withdrawals), 2),
            "platform_balance": round(float(platform_balance), 2),
        }
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

@router.get("/financial/sellers")
def get_all_sellers_financial(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """كل بائع وعنده كام فلوس"""
    wallets = db.query(Wallet).all()
    result = []
    for w in wallets:
        if not w.seller:
            continue
        pending = db.query(func.sum(WithdrawalRequest.amount)).filter(
            WithdrawalRequest.seller_id == w.seller_id,
            WithdrawalRequest.status == WithdrawalStatus.PENDING
        ).scalar() or 0
        paid = db.query(func.sum(WithdrawalRequest.amount)).filter(
            WithdrawalRequest.seller_id == w.seller_id,
            WithdrawalRequest.status == WithdrawalStatus.APPROVED
        ).scalar() or 0
        orders_count = db.query(Order).filter(Order.seller_id == w.seller_id).count()
        result.append({
            "seller_id": w.seller_id,
            "shop_name": w.seller.shop_name,
            "seller_name": w.seller.user.name if w.seller.user else "Unknown",
            "balance": round(w.balance, 2),
            "total_earned": round(w.total_earned, 2),
            "pending_withdrawal": round(float(pending), 2),
            "total_withdrawn": round(float(paid), 2),
            "orders_count": orders_count,
        })
    result.sort(key=lambda x: x['total_earned'], reverse=True)
    return result
