from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4
from enum import Enum

class InteractionType(str,Enum):
    VIEW = "view"
    CART = "cart"
    PURCHASE = "purchase"
    WISHLIST = "wishlist"

class ProductInteraction(Base):
    __tablename__ = "productinteractions"

    id = Column(UUID(as_uuid=True),ForeignKey("user.id"),ondelete="CASCADE",nullable=False,index=True)
    product_id = Column(UUID(as_uuid=True),ForeignKey("user.id"),ondelete="CASCADE",nullable=False,index=True)
    interaction_type = Column(Enum(InteractionType),nullable=False,index=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(),nullable=False,index=True)

    user = relationship("User",back_populates="product_interactions")
    product = relationship("Product",back_populates="product_interactions")