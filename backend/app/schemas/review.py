from pydantic import BaseModel
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: int  # 1-5
    comment: str | None = None

class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str
    rating: int
    comment: str | None
    created_at: datetime
    
    class Config:
        orm_mode = True