from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


# ------------------------------------------------------------------
# Enums
# ------------------------------------------------------------------

class TransactionType(str, Enum):
    CREDIT = "credit"
    DEBIT  = "debit"

class WithdrawalStatus(str, Enum):
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# ------------------------------------------------------------------
# Wallet
# ------------------------------------------------------------------

class WalletResponse(BaseModel):
    id: int
    seller_id: int
    balance: float
    total_earned: float
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# Wallet Transaction
# ------------------------------------------------------------------

class WalletTransactionResponse(BaseModel):
    id: int
    wallet_id: int
    type: TransactionType
    amount: float
    description: Optional[str] = None
    order_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# Withdrawal Request
# ------------------------------------------------------------------

class WithdrawalRequestCreate(BaseModel):
    amount: float
    method: str
    account_number: str

class WithdrawalRequestResponse(BaseModel):
    id: int
    seller_id: int
    amount: float
    method: str
    account_number: str
    status: WithdrawalStatus
    admin_note: Optional[str] = None
    transaction_ref: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True