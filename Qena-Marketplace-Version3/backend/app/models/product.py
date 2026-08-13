from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4


class Product(Base):
    __tablename__ = "products"
    
    # UUID primary key for products
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # seller_id and category_id reference UUID PKs on their tables
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    #vectorDB
    embeddings = Column(Vector(1536), nullable=True)
    
    seller = relationship("Seller", back_populates="products")
    category = relationship("Category")
    cart_items = relationship("Cart", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")

    product_interactions = relationship("ProductInteraction",back_populates="product")