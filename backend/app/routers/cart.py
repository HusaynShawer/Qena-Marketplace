from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cart import Cart
from app.models.product import Product
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

@router.get("/")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    return {"items": items, "total": sum(i.product.price * i.quantity for i in items if i.product)}

@router.post("/")
def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart_item = db.query(Cart).filter(
        Cart.user_id == current_user.id,
        Cart.product_id == item.product_id
    ).first()
    
    if cart_item:
        cart_item.quantity += item.quantity
    else:
        cart_item = Cart(user_id=current_user.id, product_id=item.product_id, quantity=item.quantity)
        db.add(cart_item)
    
    db.commit()
    return {"message": "Added to cart"}