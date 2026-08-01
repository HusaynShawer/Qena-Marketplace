from app.models.order import Order
from fastapi import HTTPException
from app.models import User, Seller
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product
from app.schemas.product import ProductResponse

def _buyer_info_dict(self, order: Order):
    buyer = order.buyer

    return {
        "order_id": order.id,
        "buyer_name": buyer.name if buyer else None,
        "buyer_email": buyer.email if buyer else None,
        "buyer_phone": order.buyer_phone,
        "buyer_address": order.buyer_address,
        "buyer_city": order.buyer_city,
        "buyer_notes": order.buyer_notes,
        "order_status": order.status.value,
        "total_amount": order.total_amount,
    }
def raise_not_found(detail: str):
    raise HTTPException(
        status_code=404,
        detail=detail,
    )


def raise_bad_request(detail: str):
    raise HTTPException(
        status_code=400,
        detail=detail,
    )


def raise_forbidden(detail: str):
    raise HTTPException(
        status_code=403,
        detail=detail,
    )


def raise_unauthorized(detail: str):
    raise HTTPException(
        status_code=401,
        detail=detail,
    )
def _seller_dict(s: Seller) -> dict:
        return {
            "id": s.id,
            "shop_name": s.shop_name,
            "shop_description": s.shop_description,
            "approved": s.approved,
            "is_suspended": s.is_suspended,
            "suspension_reason": s.suspension_reason,
            "suspended_at": s.suspended_at.isoformat() if s.suspended_at else None,
            "user": {
                "id": s.user.id,
                "name": s.user.name,
                "email": s.user.email,
            } if s.user else None,
        }
def require_admin(current_user: User):
    if current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def _get_seller_or_404(seller_id: int, db: AsyncSession) -> Seller:

    from app.seller.seller_repo import SellerRepository

    seller_repo = SellerRepository(db)
    seller = await seller_repo.get_by_seller_id(seller_id)

    if not seller:
        raise_not_found("Seller Not Found")
    return seller

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
