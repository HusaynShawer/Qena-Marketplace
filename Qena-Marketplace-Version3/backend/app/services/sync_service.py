from sqlalchemy.orm import Session
from app.models import Product, Order, OrderItem
from backend.app.utils.logging_config import logger

def process_incoming_sync(payload: dict, db: Session):
    action = payload.get("action")
    data = payload.get("data", {})
    
    if action == "order_created":
        # Example: external POS system created an order
        # We could create an order in our system with a flag
        logger.info(f"External order received: {data}")
        # TODO: Implement order creation with external reference
    elif action == "stock_updated":
        # External system reports stock change
        product_id = data.get("product_id")
        new_stock = data.get("new_stock")
        if product_id and new_stock is not None:
            product = db.query(Product).filter(Product.id == product_id).first()
            if product:
                product.stock = new_stock
                db.commit()
                logger.info(f"Stock updated for product {product_id} from external source")
    else:
        logger.warning(f"Unknown sync action: {action}")