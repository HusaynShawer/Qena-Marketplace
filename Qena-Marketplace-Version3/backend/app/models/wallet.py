from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class TransactionType(enum.Enum):
    CREDIT = "credit"      # فلوس داخلة
    DEBIT = "debit"        # فلوس خارجة

class WithdrawalStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), unique=True)
    balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    seller = relationship("Seller", backref="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(Integer, primary_key=True)
    wallet_id = Column(Integer, ForeignKey("wallets.id"))
    type = Column(Enum(TransactionType))
    amount = Column(Float)
    description = Column(String)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    wallet = relationship("Wallet", back_populates="transactions")

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"
    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"))
    amount = Column(Float)
    method = Column(String)        # فودافون كاش / انستاباي
    account_number = Column(String) # رقم المحفظة
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    admin_note = Column(String, nullable=True)
    transaction_ref = Column(String, nullable=True)  # رقم العملية
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    seller = relationship("Seller", backref="withdrawals")
