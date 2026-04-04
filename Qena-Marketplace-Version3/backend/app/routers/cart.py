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

class CartItemUpdate(BaseModel):
    quantity: int

def serialize_cart(items):
    result = []
    for i in items:
        if i.product:
            result.append({
                "id": i.id,
                "product_id": i.product_id,
                "quantity": i.quantity,
                "product": {
                    "id": i.product.id,
                    "name": i.product.name,
                    "price": i.product.price,
                    "image_url": i.product.image_url,
                    "stock": i.product.stock,
                }
            })
    return result

@router.get("/")
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    serialized = serialize_cart(items)
    total = sum(i["product"]["price"] * i["quantity"] for i in serialized)
    return {"items": serialized, "total": round(total, 2)}

@router.post("/")
def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")

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

@router.put("/{item_id}")
def update_cart_item(
    item_id: int,
    update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(Cart).filter(Cart.id == item_id, Cart.user_id == current_user.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if update.quantity <= 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = update.quantity
    db.commit()
    return {"message": "Cart updated"}

@router.delete("/{item_id}")
def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart_item = db.query(Cart).filter(Cart.id == item_id, Cart.user_id == current_user.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed"}

@router.delete("/")
def clear_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Cart).filter(Cart.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}