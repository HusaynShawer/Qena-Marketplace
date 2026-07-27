from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4


class Review(Base):
    __tablename__ = "reviews"
    
    # UUID primary key for reviews
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # FKs reference UUID PKs on products and users
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    product = relationship("Product", back_populates="reviews")
    user = relationship("User")