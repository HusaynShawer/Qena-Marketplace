from pydantic import BaseModel
class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class CartItemUpdate(BaseModel):
    quantity: int
    product_id: str