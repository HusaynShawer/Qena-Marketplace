from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.product import Product
from app.models.seller import Seller
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: Optional[int] = None

class ProductResponse(ProductCreate):
    id: int
    seller_id: int
    image_url: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True

@router.get("/", response_model=list[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.is_active == True)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can add products")
    
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller or not seller.approved:
        raise HTTPException(status_code=403, detail="Seller not approved")
    
    db_product = Product(
        **product.model_dump(),
        seller_id=seller.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product