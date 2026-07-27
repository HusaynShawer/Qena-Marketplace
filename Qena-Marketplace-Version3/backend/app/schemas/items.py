from pydantic import BaseModel
from uuid import UUID


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int
    product_id: UUID