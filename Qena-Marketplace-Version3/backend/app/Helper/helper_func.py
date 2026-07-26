from app.models.order import Order
from fastapi import HTTPException

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