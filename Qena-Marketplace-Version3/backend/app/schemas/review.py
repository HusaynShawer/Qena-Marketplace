from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class ReviewCreate(BaseModel):
    rating: int  # 1-5
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: UUID
    product_id: UUID
    user_id: UUID
    user_name: str
    rating: int
    comment: str | None
    created_at: datetime
    
    class Config:
        orm_mode = True