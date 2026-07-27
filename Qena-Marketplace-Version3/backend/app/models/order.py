from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from uuid import uuid4
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"
    
    # UUID primary key for orders
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # buyer and seller reference UUID PKs
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("sellers.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Buyer delivery info (filled at checkout) ──────────────
    buyer_phone = Column(String, nullable=True)
    buyer_address = Column(Text, nullable=True)
    buyer_city = Column(String, nullable=True)
    buyer_notes = Column(Text, nullable=True)
    # ─────────────────────────────────────────────────────────

    buyer = relationship("User")
    seller = relationship("Seller")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    
    # UUID primary key for order items
    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4, unique=True, nullable=False)
    # FKs to UUID primary keys on orders/products
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")