from fastapi import APIRouter, Depends, HTTPException
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

@product_router.get("", response_model=list[ProductResponse], summary="List all products")
async def get_products(
    session: AsyncSession = Depends(get_db),
):
    """Return all available products. Raises 404 if none exist."""
    service = ProductService(session)
    return await service.get_products()


@product_router.get("/{product_id}", response_model=ProductResponse, summary="Get product by ID")
async def get_product(
    product_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    """Return a single product by its ID. Raises 404 if not found."""
    service = ProductService(session)
    return await service.get_product(product_id)


# ------------------------------------------------------------------
# Seller
# ------------------------------------------------------------------

@product_router.post("", response_model=ProductResponse, summary="Create a product", status_code=201)
async def create_product(
    body: ProductCreate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """Create a new product under the authenticated seller's account."""
    service = ProductService(session)
    product = Product(**body.model_dump(), seller_id=current_user.id)
    return await service.create(product)


@product_router.patch("/{product_id}", response_model=ProductResponse, summary="Update a product")
async def update_product(
    product_id: UUID,
    body: ProductUpdate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Partially update a product's fields.
    Only the owning seller can update. Raises 400 if price ≤ 0 or stock < 0.
    """
    service = ProductService(session)
    product = await service.get_product(product_id)

    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return await service.update_product(product_id, body)


@product_router.delete("/{product_id}", summary="Delete a product", status_code=204)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Delete a product by ID. Returns 204 No Content on success.
    Only the owning seller can delete.
    """
    service = ProductService(session)
    product = await service.get_product(product_id)

    if product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await service.delete(product)