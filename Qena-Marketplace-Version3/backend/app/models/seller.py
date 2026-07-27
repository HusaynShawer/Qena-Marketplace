from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4


class Seller(Base):
    __tablename__ = "sellers"

    # UUID primary key for sellers
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # FK to users.id which is now UUID; keep FK string the same but ensure types match
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    shop_name = Column(String, nullable=False)
    shop_description = Column(Text, nullable=True)
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    phone = Column(String, nullable=False)
    # ── Suspension ────────────────────────────────────────────────────────────
    is_suspended = Column(Boolean, default=False, nullable=False)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(String, nullable=True)   # admin note shown to seller

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller")