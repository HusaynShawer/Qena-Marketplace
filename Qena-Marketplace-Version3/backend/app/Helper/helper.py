from app.models.order import Order, OrderStatus

VALID_STATUSES = [s.value for s in OrderStatus]

# Terminal states (delivered, cancelled) have no outgoing transitions,
# so once an order reaches them the seller can no longer change the status.
SELLER_ALLOWED_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": [],
    "cancelled": [],
    }