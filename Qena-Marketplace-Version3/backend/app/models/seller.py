from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    shop_name = Column(String, nullable=False)
    shop_description = Column(Text, nullable=True)
    approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # ── Suspension ────────────────────────────────────────────────────────────
    is_suspended = Column(Boolean, default=False, nullable=False)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(String, nullable=True)   # admin note shown to seller

    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller")