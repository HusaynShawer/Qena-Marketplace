from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.seller import Seller
from app.models.wallet import Wallet, WalletTransaction, WithdrawalRequest, TransactionType, WithdrawalStatus
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class WithdrawalCreate(BaseModel):
    amount: float
    method: str  # vodafone_cash or instapay
    account_number: str

class WithdrawalAction(BaseModel):
    status: str  # approved or rejected
    admin_note: Optional[str] = None
    transaction_ref: Optional[str] = None

def get_or_create_wallet(seller_id: int, db: Session) -> Wallet:
    wallet = db.query(Wallet).filter(Wallet.seller_id == seller_id).first()
    if not wallet:
        wallet = Wallet(seller_id=seller_id, balance=0.0, total_earned=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

# ── البائع يشوف محفظته ──
@router.get("/me")
def get_my_wallet(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="مش بائع")
    wallet = get_or_create_wallet(seller.id, db)
    transactions = db.query(WalletTransaction).filter(
        WalletTransaction.wallet_id == wallet.id
    ).order_by(WalletTransaction.created_at.desc()).limit(20).all()
    return {
        "balance": wallet.balance,
        "total_earned": wallet.total_earned,
        "transactions": [
            {
                "id": t.id,
                "type": t.type.value,
                "amount": t.amount,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ]
    }

# ── البائع يطلب سحب ──
@router.post("/withdraw")
def request_withdrawal(
    data: WithdrawalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="مش بائع")
    wallet = get_or_create_wallet(seller.id, db)
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="المبلغ لازم يكون أكبر من صفر")
    if data.amount > wallet.balance:
        raise HTTPException(status_code=400, detail=f"رصيدك {wallet.balance} جنيه بس")
    if data.amount < 50:
        raise HTTPException(status_code=400, detail="الحد الأدنى للسحب 50 جنيه")

    # خصم المبلغ من الرصيد فوراً (محجوز)
    wallet.balance -= data.amount
    withdrawal = WithdrawalRequest(
        seller_id=seller.id,
        amount=data.amount,
        method=data.method,
        account_number=data.account_number,
        status=WithdrawalStatus.PENDING
    )
    db.add(withdrawal)

    # تسجيل المعاملة
    tx = WalletTransaction(
        wallet_id=wallet.id,
        type=TransactionType.DEBIT,
        amount=data.amount,
        description=f"طلب سحب على {data.method}"
    )
    db.add(tx)
    db.commit()
    return {"message": "تم إرسال طلب السحب، هيتراجعه الأدمن قريباً"}

# ── البائع يشوف طلبات السحب بتاعته ──
@router.get("/withdrawals")
def get_my_withdrawals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="مش بائع")
    withdrawals = db.query(WithdrawalRequest).filter(
        WithdrawalRequest.seller_id == seller.id
    ).order_by(WithdrawalRequest.created_at.desc()).all()
    return [
        {
            "id": w.id,
            "amount": w.amount,
            "method": w.method,
            "account_number": w.account_number,
            "status": w.status.value,
            "admin_note": w.admin_note,
            "transaction_ref": w.transaction_ref,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in withdrawals
    ]

# ── الأدمن يشوف كل طلبات السحب ──
@router.get("/admin/withdrawals")
def admin_get_withdrawals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role.value.lower() != "admin":
        raise HTTPException(status_code=403, detail="أدمن بس")
    withdrawals = db.query(WithdrawalRequest).order_by(
        WithdrawalRequest.created_at.desc()
    ).all()
    return [
        {
            "id": w.id,
            "amount": w.amount,
            "method": w.method,
            "account_number": w.account_number,
            "status": w.status.value,
            "admin_note": w.admin_note,
            "transaction_ref": w.transaction_ref,
            "seller_name": w.seller.user.name if w.seller and w.seller.user else "Unknown",
            "shop_name": w.seller.shop_name if w.seller else "Unknown",
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in withdrawals
    ]

# ── الأدمن يوافق أو يرفض طلب السحب ──
@router.put("/admin/withdrawals/{withdrawal_id}")
def admin_action_withdrawal(
    withdrawal_id: int,
    action: WithdrawalAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value.lower() != "admin":
        raise HTTPException(status_code=403, detail="أدمن بس")
    withdrawal = db.query(WithdrawalRequest).filter(WithdrawalRequest.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="الطلب مش موجود")

    withdrawal.status = WithdrawalStatus(action.status)
    withdrawal.admin_note = action.admin_note
    withdrawal.transaction_ref = action.transaction_ref

    # لو الأدمن رفض — رجع الفلوس للرصيد
    if action.status == "rejected":
        wallet = get_or_create_wallet(withdrawal.seller_id, db)
        wallet.balance += withdrawal.amount
        tx = WalletTransaction(
            wallet_id=wallet.id,
            type=TransactionType.CREDIT,
            amount=withdrawal.amount,
            description="رجوع مبلغ سحب مرفوض"
        )
        db.add(tx)

    db.commit()
    return {"message": "تم التحديث"}

# ── الأدمن يشوف كل المحافظ ──
@router.get("/admin/wallets")
def admin_get_wallets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role.value.lower() != "admin":
        raise HTTPException(status_code=403, detail="أدمن بس")
    wallets = db.query(Wallet).all()
    return [
        {
            "id": w.id,
            "seller_name": w.seller.user.name if w.seller and w.seller.user else "Unknown",
            "shop_name": w.seller.shop_name if w.seller else "Unknown",
            "balance": w.balance,
            "total_earned": w.total_earned,
        }
        for w in wallets
    ]
