from pydantic import BaseModel
from typing import List
from uuid import UUID


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_price: float
    quantity: int
    total: float
    
    class Config:
        orm_mode = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float