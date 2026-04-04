from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemResponse, CartResponse
from app.utils.auth import get_current_active_user

router = APIRouter()

@router.get("", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    # Calculate total
    total = sum(
        item.product.price * item.quantity 
        for item in cart_items 
        if item.product
    )
    
    return {"items": cart_items, "total": total}

@router.post("", response_model=CartItemResponse)
def add_to_cart(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if product exists
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product.stock < item_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == item_data.product_id
    ).first()
    
    if existing_item:
        existing_item.quantity += item_data.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    # Create new cart item
    cart_item = CartItem(
        user_id=current_user.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    
    return cart_item

@router.put("/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if quantity <= 0:
        db.delete(cart_item)
        db.commit()
        raise HTTPException(status_code=200, detail="Item removed from cart")
    
    # Check stock
    if cart_item.product and cart_item.product.stock < quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    
    return cart_item

@router.delete("/{item_id}")
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    
    return {"message": "Item removed from cart"}

@router.delete("")
def clear_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    
    return {"message": "Cart cleared"}
