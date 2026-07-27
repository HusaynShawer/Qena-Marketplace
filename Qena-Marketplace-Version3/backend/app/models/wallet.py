from sqlalchemy import Column, Float, String, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4
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
    # UUID primary key for wallet
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, unique=True, nullable=False)
    # seller_id references sellers.id which is UUID
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), unique=True)
    balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    seller = relationship("Seller", backref="wallet")
    transactions = relationship("WalletTransaction", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, unique=True, nullable=False)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"))
    type = Column(Enum(TransactionType))
    amount = Column(Float)
    description = Column(String)
    # order_id refers to orders.id which is now UUID
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    wallet = relationship("Wallet", back_populates="transactions")

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, unique=True, nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"))
    amount = Column(Float)
    method = Column(String)
    account_number = Column(String)
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    admin_note = Column(String, nullable=True)
    transaction_ref = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    seller = relationship("Seller", backref="withdrawals")
