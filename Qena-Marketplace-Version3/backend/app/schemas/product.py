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

from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    price: float
    stock: int
    category_id: Optional[UUID]
    seller_id: UUID
    image_url: Optional[str]
    is_active: bool
    created_at: datetime
    # الحقول الجديدة:
    review_count: int = 0
    avg_rating: float = 0.0

    class Config:
        from_attributes = True