from pydantic import BaseModel
from datetime import datetime
from typing import List
from uuid import UUID
from app.models.order import OrderStatus


class OrderItemBase(BaseModel):
    product_id: UUID
    quantity: int

class OrderItemResponse(OrderItemBase):
    id: UUID
    price: float
    
    class Config:
        orm_mode = True

class OrderCreate(BaseModel):
    items: List[OrderItemBase]

class OrderResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    seller_id: UUID
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse]
    
    class Config:
        orm_mode = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus