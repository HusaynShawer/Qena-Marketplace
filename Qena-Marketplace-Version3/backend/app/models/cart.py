from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from uuid import uuid4


class Cart(Base):
    __tablename__ = "carts"
    
    # Use UUID primary key
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # Foreign keys referencing UUID primary keys on users/products
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    
    user = relationship("User")
    product = relationship("Product", back_populates="cart_items")