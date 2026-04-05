from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart
from app.models.product import Product
from app.models.user import User
from app.dependencies.auth import get_current_user

router = APIRouter()

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
        if not product:
            raise HTTPException(status_code=400, detail="Product not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
        total += product.price * item.quantity

    first_product = cart_items[0].product
    order = Order(
        buyer_id=current_user.id,
        seller_id=first_product.seller_id,
        total_amount=total,
        status=OrderStatus.PENDING
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

    db.query(Cart).filter(Cart.user_id == current_user.id).delete()
    db.commit()

    return {"message": "Order created", "order_id": order.id}

@router.get("/")
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.buyer_id == current_user.id).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "total_amount": o.total_amount,
            "status": o.status.value if o.status else "pending",
            "created_at": o.created_at.isoformat() if o.created_at else None,
            "items": [
                {
                    "product_id": i.product_id,
                    "product_name": i.product.name if i.product else "Unknown",
                    "quantity": i.quantity,
                    "price": i.price,
                }
                for i in o.items
            ] if o.items else []
        }
        for o in orders
    ]

from pydantic import BaseModel

class StatusUpdate(BaseModel):
    status: str

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.seller import Seller
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    order = db.query(Order).filter(Order.id == order_id, Order.seller_id == seller.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = update.status
    db.commit()
    return {"message": "Status updated"}
