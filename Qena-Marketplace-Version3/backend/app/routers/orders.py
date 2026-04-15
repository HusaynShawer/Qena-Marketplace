from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart
from app.models.product import Product
from app.models.user import User
from app.dependencies.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────

class StatusUpdate(BaseModel):
    status: str

class CheckoutRequest(BaseModel):
    """Buyer fills this at checkout so the seller can see delivery details."""
    buyer_phone: str
    buyer_address: str
    buyer_city: str
    buyer_notes: Optional[str] = None

# ── Helpers ────────────────────────────────────────────────────────────────────

VALID_STATUSES = [s.value for s in OrderStatus]

def _order_dict(o: Order):
    return {
        "id": o.id,
        "total_amount": o.total_amount,
        "status": o.status.value if o.status else "pending",
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "buyer_phone": o.buyer_phone,
        "buyer_address": o.buyer_address,
        "buyer_city": o.buyer_city,
        "buyer_notes": o.buyer_notes,
        "items": [
            {
                "product_id": i.product_id,
                "product_name": i.product.name if i.product else "Unknown",
                "quantity": i.quantity,
                "price": i.price,
            }
            for i in o.items
        ] if o.items else [],
    }

# ── Buyer endpoints ────────────────────────────────────────────────────────────

@router.post("/")
def create_order(
    checkout: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_items = db.query(Cart).filter(Cart.user_id == current_user.id).all()
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0
    for item in cart_items:
        product = item.product
        if not product:
            raise HTTPException(status_code=400, detail="Product not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
        total += product.price * item.quantity

    first_product = cart_items[0].product
    order = Order(
        buyer_id=current_user.id,
        seller_id=first_product.seller_id,
        total_amount=total,
        status=OrderStatus.PENDING,
        # delivery info
        buyer_phone=checkout.buyer_phone,
        buyer_address=checkout.buyer_address,
        buyer_city=checkout.buyer_city,
        buyer_notes=checkout.buyer_notes,
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        product = item.product
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price,
        )
        db.add(order_item)
        product.stock -= item.quantity

    db.query(Cart).filter(Cart.user_id == current_user.id).delete()
    credit_seller_wallet(first_product.seller_id, total, order.id, db)
    db.commit()

    return {"message": "Order created", "order_id": order.id}


@router.get("/")
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the current buyer's orders with full tracking info."""
    orders = (
        db.query(Order)
        .filter(Order.buyer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_dict(o) for o in orders]


@router.get("/{order_id}")
def get_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Single order detail for the buyer (includes tracking status)."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.buyer_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_dict(order)

# ── Seller / Admin endpoints ───────────────────────────────────────────────────

@router.get("/seller/all")
def get_seller_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """All orders for the logged-in seller, with buyer delivery info."""
    from app.models.seller import Seller
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")
    orders = (
        db.query(Order)
        .filter(Order.seller_id == seller.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        {
            **_order_dict(o),
            "buyer_name": o.buyer.name if o.buyer else "Unknown",
            "buyer_email": o.buyer.email if o.buyer else None,
        }
        for o in orders
    ]


@router.get("/{order_id}/buyer-info")
def get_buyer_info(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns buyer contact & delivery info for a specific order.
    Accessible by: the seller of that order OR an admin.
    """
    from app.models.seller import Seller

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check permission: seller who owns the order, or admin
    is_admin = current_user.email == "husaynshawer@gmail.com" or current_user.role.value == "admin"
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    is_order_seller = seller and seller.id == order.seller_id

    if not is_admin and not is_order_seller:
        raise HTTPException(status_code=403, detail="Not authorized")

    buyer = order.buyer
    return {
        "order_id": order.id,
        "buyer_name": buyer.name if buyer else None,
        "buyer_email": buyer.email if buyer else None,
        "buyer_phone": order.buyer_phone,
        "buyer_address": order.buyer_address,
        "buyer_city": order.buyer_city,
        "buyer_notes": order.buyer_notes,
        "order_status": order.status.value if order.status else "pending",
        "total_amount": order.total_amount,
    }


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Seller updates the delivery status of their order."""
    from app.models.seller import Seller

    if update.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Valid values: {VALID_STATUSES}",
        )

    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=403, detail="Not a seller")

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.seller_id == seller.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = update.status
    db.commit()
    return {"message": "Status updated", "new_status": update.status}


# ── Wallet helper (unchanged) ──────────────────────────────────────────────────

def credit_seller_wallet(seller_id: int, amount: float, order_id: int, db: Session):
    """إضافة فلوس لمحفظة البائع لما يتعمل أوردر"""
    from app.models.wallet import Wallet, WalletTransaction, TransactionType
    wallet = db.query(Wallet).filter(Wallet.seller_id == seller_id).first()
    if not wallet:
        wallet = Wallet(seller_id=seller_id, balance=0.0, total_earned=0.0)
        db.add(wallet)
        db.flush()
    wallet.balance += amount
    wallet.total_earned += amount
    tx = WalletTransaction(
        wallet_id=wallet.id,
        type=TransactionType.CREDIT,
        amount=amount,
        description=f"أرباح أوردر #{order_id}",
        order_id=order_id,
    )
    db.add(tx)