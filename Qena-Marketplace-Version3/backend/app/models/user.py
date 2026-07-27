from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from uuid import uuid4
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SELLER = "seller"
    BUYER = "buyer"

class User(Base):
    __tablename__ = "users"
    
    # Use PostgreSQL UUID type for the primary key. `as_uuid=True` makes
    # SQLAlchemy handle values as Python `uuid.UUID` objects. We generate
    # values using `uuid4` per the migration requirements.
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BUYER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Reset password fields ─────────────────────────────────
    reset_otp = Column(String, nullable=True)
    reset_otp_expiry = Column(DateTime(timezone=True), nullable=True)
    # ─────────────────────────────────────────────────────────

    seller_profile = relationship("Seller", back_populates="user", uselist=False)
    # Wallet and withdrawal models are in separate files