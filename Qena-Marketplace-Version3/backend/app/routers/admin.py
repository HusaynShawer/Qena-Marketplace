from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.seller import Seller
from app.models.product import Product
from app.models.order import Order
from app.models.wallet import Wallet, WalletTransaction
from app.dependencies.auth import get_current_user
from datetime import datetime, timezone

router = APIRouter()


# ── Auth helper ───────────────────────────────────────────────────────────────

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────

class SuspendRequest(BaseModel):
    reason: Optional[str] = None


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    total_sellers = db.query(Seller).filter(Seller.approved == True).count()
    pending_sellers = db.query(Seller).filter(Seller.approved == False).count()
    suspended_sellers = db.query(Seller).filter(Seller.is_suspended == True).count()
    total_orders = db.query(Order).count()

    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    platform_balance = float(total_revenue)

    total_wallet = db.query(func.sum(Wallet.balance)).scalar() or 0
    total_earned = db.query(func.sum(Wallet.total_earned)).scalar() or 0

    return {
        "total_users": total_users,
        "total_sellers": total_sellers,
        "pending_sellers": pending_sellers,
        "suspended_sellers": suspended_sellers,
        "total_orders": total_orders,
        "financial": {
            "total_revenue": round(float(total_revenue), 2),
            "platform_balance": round(platform_balance, 2),
            "total_wallet_balance": round(float(total_wallet), 2),
            "total_earned_by_sellers": round(float(total_earned), 2),
            "paid_withdrawals": 0,
            "pending_withdrawals": 0,
        },
    }


# ── Sellers ───────────────────────────────────────────────────────────────────

@router.get("/sellers/pending")
def get_pending_sellers(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sellers = db.query(Seller).filter(
        Seller.approved == False,
        Seller.is_suspended == False,
    ).all()
    return [_seller_dict(s) for s in sellers]


@router.get("/sellers/all")
def get_all_sellers(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """All sellers (approved + pending + suspended) for the admin panel."""
    sellers = db.query(Seller).order_by(Seller.id.desc()).all()
    return [_seller_dict(s) for s in sellers]


@router.put("/sellers/{seller_id}/approve")
def approve_seller(
    seller_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    seller = _get_seller_or_404(seller_id, db)
    if seller.is_suspended:
        raise HTTPException(status_code=400, detail="Cannot approve a suspended seller. Unsuspend first.")
    seller.approved = True
    seller.approved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Seller approved"}


@router.put("/sellers/{seller_id}/suspend")
def suspend_seller(
    seller_id: int,
    body: SuspendRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Suspend a seller:
    - Sets is_suspended = True
    - Hides all their products from the storefront automatically
      (products router already filters by seller.is_suspended)
    - Seller can still log in and see their dashboard, but cannot sell
    """
    seller = _get_seller_or_404(seller_id, db)
    if seller.is_suspended:
        raise HTTPException(status_code=400, detail="Seller is already suspended")

    seller.is_suspended = True
    seller.suspended_at = datetime.now(timezone.utc)
    seller.suspension_reason = body.reason
    db.commit()
    return {"message": "Seller suspended", "seller_id": seller_id}


@router.put("/sellers/{seller_id}/unsuspend")
def unsuspend_seller(
    seller_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Re-activate a suspended seller.
    Their existing products immediately become visible again
    (no data is deleted during suspension).
    """
    seller = _get_seller_or_404(seller_id, db)
    if not seller.is_suspended:
        raise HTTPException(status_code=400, detail="Seller is not suspended")

    seller.is_suspended = False
    seller.suspended_at = None
    seller.suspension_reason = None
    db.commit()
    return {"message": "Seller unsuspended", "seller_id": seller_id}


# ── Financial ─────────────────────────────────────────────────────────────────

@router.get("/financial/sellers")
def get_sellers_financial(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    sellers = db.query(Seller).filter(Seller.approved == True).all()
    result = []
    for s in sellers:
        wallet = db.query(Wallet).filter(Wallet.seller_id == s.id).first()
        orders_count = db.query(Order).filter(Order.seller_id == s.id).count()
        result.append({
            "seller_id": s.id,
            "shop_name": s.shop_name,
            "seller_name": s.user.name if s.user else "Unknown",
            "orders_count": orders_count,
            "total_earned": round(float(wallet.total_earned), 2) if wallet else 0,
            "balance": round(float(wallet.balance), 2) if wallet else 0,
            "total_withdrawn": 0,
            "pending_withdrawal": 0,
            "is_suspended": s.is_suspended,
        })
    return result


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_seller_or_404(seller_id: int, db: Session) -> Seller:
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return seller


def _seller_dict(s: Seller) -> dict:
    return {
        "id": s.id,
        "shop_name": s.shop_name,
        "shop_description": s.shop_description,
        "approved": s.approved,
        "is_suspended": s.is_suspended,
        "suspension_reason": s.suspension_reason,
        "suspended_at": s.suspended_at.isoformat() if s.suspended_at else None,
        "user": {
            "id": s.user.id,
            "name": s.user.name,
            "email": s.user.email,
        } if s.user else None,
    }