from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderResponse
from app.utils.auth import get_current_active_user

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Admin sees all orders, users see only their own
    if current_user.role == UserRole.admin:
        orders = db.query(Order).all()
    else:
        orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if order.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order

@router.post("", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get cart items
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and create order items
    total_amount = 0
    order_items = []
    
    for cart_item in cart_items:
        if not cart_item.product:
            continue
        
        # Check stock
        if cart_item.product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Not enough stock for {cart_item.product.name}"
            )
        
        item_total = cart_item.product.price * cart_item.quantity
        total_amount += item_total
        
        order_items.append({
            "product_id": cart_item.product_id,
            "quantity": cart_item.quantity,
            "price_at_time": cart_item.product.price
        })
        
        # Reduce stock
        cart_item.product.stock -= cart_item.quantity
    
    # Create order
    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        phone=order_data.phone
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create order items
    for item_data in order_items:
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)
    
    # Clear cart
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    
    db.commit()
    db.refresh(order)
    
    return order

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    status: OrderStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Only admin can update order status
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admin can update order status")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    db.commit()
    db.refresh(order)
    
    return order
