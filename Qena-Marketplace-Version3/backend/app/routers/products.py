from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
import base64
from app.database import get_db
from app.models.product import Product
from app.models.seller import Seller
from app.models.review import Review
from app.models.user import User
from app.models.category import Category
from app.dependencies.auth import get_current_user

router = APIRouter()

def serialize_product(p, include_seller=False):
    data = {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": p.price,
        "stock": p.stock,
        "image_url": p.image_url,
        "is_active": p.is_active,
        "seller_id": p.seller_id,
        "category_id": p.category_id,
        "category": p.category.name if p.category else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
    if include_seller and p.seller:
        data["seller"] = {
            "id": p.seller.id,
            "shop_name": p.seller.shop_name,
            "shop_description": p.seller.shop_description,
        }
    return data

@router.get("/seller/my-products")
def get_my_products(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    products = db.query(Product).filter(Product.seller_id == seller.id).all()
    return [serialize_product(p) for p in products]

@router.get("/")
def list_products(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_product(p) for p in products]

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product, include_seller=True)

@router.get("/{product_id}/reviews")
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "user_name": r.user.name if r.user else "Anonymous",
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reviews
    ]

@router.post("/")
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(...),
    category_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value.lower() != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can add products")
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller or not seller.approved:
        raise HTTPException(status_code=403, detail="Seller not approved")

    image_url = None
    if image:
        contents = await image.read()
        b64 = base64.b64encode(contents).decode('utf-8')
        image_url = f"data:{image.content_type};base64,{b64}"

    db_product = Product(
        name=name, description=description, price=price,
        stock=stock, category_id=category_id,
        image_url=image_url, seller_id=seller.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return serialize_product(db_product)

@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(...),
    category_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    db_product = db.query(Product).filter(Product.id == product_id, Product.seller_id == seller.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_product.name = name
    db_product.description = description
    db_product.price = price
    db_product.stock = stock
    db_product.category_id = category_id

    if image:
        contents = await image.read()
        b64 = base64.b64encode(contents).decode('utf-8')
        db_product.image_url = f"data:{image.content_type};base64,{b64}"

    db.commit()
    return serialize_product(db_product)

@router.delete("/{product_id}")
def delete_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    db_product = db.query(Product).filter(Product.id == product_id, Product.seller_id == seller.id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db_product.is_active = False
    db.commit()
    return {"message": "Product deleted"}
