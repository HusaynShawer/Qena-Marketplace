from sqlalchemy.orm import Session
from app.models.product import Product
from app.utils.logging import logger

def reserve_stock(product_id: int, quantity: int, db: Session) -> bool:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product or product.stock < quantity:
        return False
    product.stock -= quantity
    db.commit()
    logger.debug(f"Reserved {quantity} of product {product_id}")
    return True

def release_stock(product_id: int, quantity: int, db: Session):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.stock += quantity
        db.commit()
        logger.debug(f"Released {quantity} of product {product_id}")