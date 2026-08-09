from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from uuid import uuid4
import enum
from datetime import datetime, timedelta
import uuid
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SELLER = "seller"
    BUYER = "buyer"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.BUYER)
    
    # Email Verification
    is_verified = Column(Boolean, default=False)
    email_otp = Column(String(6), nullable=True)
    email_otp_expiry = Column(DateTime, nullable=True)
    
    # Password Reset
    reset_otp = Column(String(6), nullable=True)
    reset_otp_expiry = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller_profile = relationship("Seller", back_populates="user", uselist=False)
    # Wallet and withdrawal models are in separate files