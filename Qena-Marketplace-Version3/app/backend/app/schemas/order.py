from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.order import OrderStatus
from app.schemas.product import ProductResponse

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: int
    price_at_time: float
    product: Optional[ProductResponse] = None
    
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_address: Optional[str] = None
    phone: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: float
    shipping_address: Optional[str] = None
    phone: Optional[str] = None
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
