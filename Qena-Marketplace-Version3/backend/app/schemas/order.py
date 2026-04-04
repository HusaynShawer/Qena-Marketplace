from pydantic import BaseModel
from datetime import datetime
from typing import List
from app.models.order import OrderStatus

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(OrderItemBase):
    id: int
    price: float
    
    class Config:
        orm_mode = True

class OrderCreate(BaseModel):
    items: List[OrderItemBase]

class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse]
    
    class Config:
        orm_mode = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus