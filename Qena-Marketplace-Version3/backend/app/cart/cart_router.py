from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from uuid import UUID

from app.cart.cart_service import CartService
from app.schemas.items import CartItemCreate, CartItemUpdate


cart_router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


@cart_router.get("/")
async def get_cart(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CartService(session=session)
    return await service.get_cart(current_user=current_user)


@cart_router.post("/")
async def add_to_cart(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CartService(session=session)
    return await service.add_to_cart(
        item=item,
        current_user=current_user,
    )


@cart_router.put("/{item_id}")
async def update_quantity(
    item_id: UUID,
    update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CartService(session=session)
    return await service.update_quantity(
        item_id=item_id,        
        quantity=update.quantity,
        current_user=current_user,
    )


@cart_router.delete("/{item_id}")
async def delete_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CartService(session=session)
    return await service.delete_item(
        item_id=item_id,
        current_user=current_user,
    )


@cart_router.delete("/")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    service = CartService(session=session)
    return await service.clear_cart(
        current_user=current_user,
    )