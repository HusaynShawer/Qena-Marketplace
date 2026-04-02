from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order, OrderItem
from app.models.cart import Cart
from app.models.product import Product
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

class OrderCreate(BaseModel):
    items: List[dict]

@router.post("/")
def create_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = 0
    for item in cart_items:
        product = item.product
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
        total += product.price * item.quantity
    
    # Create order (simplified - first seller only)
    if cart_items:
        first_product = cart_items[0].product
        order = Order(
            buyer_id=current_user.id,
            seller_id=first_product.seller_id,
            total_amount=total,
            status="pending"
        )
        db.add(order)
        db.flush()
        
        for item in cart_items:
            product = item.product
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                price=product.price
            )
            db.add(order_item)
            product.stock -= item.quantity
        
        # Clear cart
        db.query(Cart).filter(Cart.user_id == current_user.id).delete()
        db.commit()
        
        return {"message": "Order created", "order_id": order.id}
    
    return {"message": "No items"}

@router.get("/")
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.buyer_id == current_user.id).all()
    return orders