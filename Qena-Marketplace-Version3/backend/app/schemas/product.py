from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: Optional[UUID] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: UUID
    seller_id: UUID
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True