from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
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

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_IMAGE_SIZE_MB = 5
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_NAME_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000
MAX_PRICE = 1_000_000
MAX_STOCK = 100_000


# ── Serializer ────────────────────────────────────────────────────────────────

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


# ── Validation helper ─────────────────────────────────────────────────────────

def _validate_product_fields(name: str, price: float, stock: int,
                              description: Optional[str] = None):
    if not name or not name.strip():
        raise HTTPException(status_code=422, detail="Product name cannot be empty")
    if len(name) > MAX_NAME_LENGTH:
        raise HTTPException(status_code=422, detail=f"Name too long (max {MAX_NAME_LENGTH} chars)")
    if description and len(description) > MAX_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=422, detail=f"Description too long (max {MAX_DESCRIPTION_LENGTH} chars)")
    if price < 0:
        raise HTTPException(status_code=422, detail="Price cannot be negative")
    if price > MAX_PRICE:
        raise HTTPException(status_code=422, detail=f"Price too high (max {MAX_PRICE})")
    if stock < 0:
        raise HTTPException(status_code=422, detail="Stock cannot be negative")
    if stock > MAX_STOCK:
        raise HTTPException(status_code=422, detail=f"Stock too high (max {MAX_STOCK})")


async def _process_image(image: UploadFile) -> str:
    """Validate and convert uploaded image to base64 data URL."""
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid image type '{image.content_type}'. Allowed: jpeg, png, webp, gif"
        )
    contents = await image.read()
    if len(contents) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail=f"Image too large. Maximum size is {MAX_IMAGE_SIZE_MB}MB"
        )
    b64 = base64.b64encode(contents).decode("utf-8")
    return f"data:{image.content_type};base64,{b64}"


# ── Seller: my products ───────────────────────────────────────────────────────

@router.get("/seller/my-products")
def get_my_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="No seller profile found.")
    products = db.query(Product).filter(Product.seller_id == seller.id).all()
    return [serialize_product(p) for p in products]


# ── Public: list products (excludes suspended sellers) ───────────────────────

@router.get("/")
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if limit > 200:
        limit = 200  # cap to prevent abuse

    query = (
        db.query(Product)
        .join(Seller, Product.seller_id == Seller.id)
        .filter(
            Product.is_active == True,
            Seller.approved == True,
            Seller.is_suspended == False,   # ← hide suspended sellers' products
        )
    )
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    products = query.order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    return [serialize_product(p) for p in products]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .join(Seller, Product.seller_id == Seller.id)
        .filter(
            Product.id == product_id,
            Product.is_active == True,
            Seller.is_suspended == False,
        )
        .first()
    )
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


# ── Seller: create product ────────────────────────────────────────────────────

@router.post("/")
async def create_product(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    price: float = Form(...),
    stock: int = Form(...),
    category_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value.lower() != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can add products")

    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="No seller profile found. Go to /seller/setup to apply.")
    if not seller.approved:
        raise HTTPException(status_code=403, detail="Your seller account is pending admin approval.")
    if seller.is_suspended:
        raise HTTPException(status_code=403, detail="Your account is suspended. Please contact support.")

    _validate_product_fields(name, price, stock, description)

    # Validate category exists
    if category_id is not None:
        cat = db.query(Category).filter(Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=422, detail=f"Category ID {category_id} does not exist")

    image_url = None
    if image and image.filename:
        image_url = await _process_image(image)

    db_product = Product(
        name=name.strip(),
        description=description.strip() if description else None,
        price=price,
        stock=stock,
        category_id=category_id,
        image_url=image_url,
        seller_id=seller.id,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return serialize_product(db_product)


# ── Seller: update product ────────────────────────────────────────────────────

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
    db: Session = Depends(get_db),
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    if seller.is_suspended:
        raise HTTPException(status_code=403, detail="Your account is suspended.")

    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id,
    ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    _validate_product_fields(name, price, stock, description)

    if category_id is not None:
        cat = db.query(Category).filter(Category.id == category_id).first()
        if not cat:
            raise HTTPException(status_code=422, detail=f"Category ID {category_id} does not exist")

    db_product.name = name.strip()
    db_product.description = description.strip() if description else None
    db_product.price = price
    db_product.stock = stock
    db_product.category_id = category_id

    if image and image.filename:
        db_product.image_url = await _process_image(image)

    db.commit()
    db.refresh(db_product)
    return serialize_product(db_product)


# ── Seller: delete (soft) product ─────────────────────────────────────────────

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")

    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.seller_id == seller.id,
    ).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_product.is_active = False
    db.commit()
    return {"message": "Product deleted"}