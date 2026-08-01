from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.product.product_service import ProductService
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.dependencies.auth import get_current_user, require_role
from uuid import UUID

product_router = APIRouter(prefix="/products", tags=["Products"])

# ------------------------------------------------------------------
# Public
# ------------------------------------------------------------------

from fastapi import Query

@product_router.get("", response_model=list[ProductResponse])
async def get_products(
    limit: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
):
    service = ProductService(session)
    return await service.get_products(limit=limit, search=search, category=category)

@product_router.get("/{product_id}", response_model=ProductResponse, summary="Get product by ID")
async def get_product(
    product_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    service = ProductService(session)
    return await service.get_product(product_id)

# ------------------------------------------------------------------
# Seller
# ------------------------------------------------------------------

@product_router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    name: str = Form(...),
    description: str = Form(None),
    price: float = Form(...),
    stock: int = Form(...),
    category_id: str = Form(None),
    image: UploadFile = File(None),
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = ProductService(session)
    return await service.create(
        name=name,
        description=description,
        price=price,
        stock=stock,
        category_id=category_id,
        image=image,
        current_user=current_user
    )

@product_router.patch("/{product_id}", response_model=ProductResponse, summary="Update a product")
async def update_product(
    product_id: UUID,
    body: ProductUpdate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = ProductService(session)
    return await service.update_product(product_id=product_id, update=body, current_user=current_user)

@product_router.delete("/{product_id}", summary="Delete a product", status_code=204)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = ProductService(session)
    await service.delete(product_id, current_user)