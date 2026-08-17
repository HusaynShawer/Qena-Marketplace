from enum import Enum as PyEnum
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InteractionType(str, PyEnum):
    VIEW = "view"
    CART = "cart"
    PURCHASE = "purchase"
    WISHLIST = "wishlist"


class ProductInteraction(Base):
    __tablename__ = "product_interactions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    interaction_type = Column(
        SAEnum(InteractionType),
        nullable=False,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    user = relationship("User", back_populates="product_interactions")
    product = relationship("Product", back_populates="product_interactions")