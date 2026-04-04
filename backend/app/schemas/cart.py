from pydantic import BaseModel

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    quantity: int
    total: float
    
    class Config:
        orm_mode = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float