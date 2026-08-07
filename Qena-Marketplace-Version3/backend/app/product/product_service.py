import logging
import os
import uuid
from pathlib import Path
from uuid import UUID

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.Helper.helper_func import (
    raise_not_found,
    raise_bad_request,
    serialize_product,
)
from app.models import Product, User
from app.product.product_repo import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.seller.seller_repo import SellerRepository

logger = logging.getLogger(__name__)


class ProductService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session=session)
        self.seller_repo = SellerRepository(session=session)
        self.upload_dir = os.getenv("UPLOAD_DIR", "/app/static/uploads")

    async def create(
        self,
        name: str,
        description: str | None,
        price: float,
        stock: int,
        category_id: str | None,
        image: UploadFile | None,
        current_user: User,
    ) -> Product:
        logger.info("User %s creating product: '%s'", current_user.id, name)

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Product creation failed: user %s is not a seller", current_user.id)
            raise_not_found("No seller exists")

        image_url = None

        if image:
            upload_dir = Path(self.upload_dir) / "products"
            upload_dir.mkdir(parents=True, exist_ok=True)

            extension = (
                image.filename.split(".")[-1]
                if image.filename and "." in image.filename
                else "jpg"
            )
            filename = f"{uuid.uuid4()}.{extension}"
            file_path = upload_dir / filename

            async with aiofiles.open(file_path, "wb") as f:
                await f.write(await image.read())

            image_url = f"/static/uploads/products/{filename}"
            logger.debug("Image saved for product: %s", image_url)

        product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
            seller_id=seller.id,
            image_url=image_url,
        )

        created = await self.product_repo.create(product)
        logger.info("Product created: %s (id: %s) by seller %s", name, created.id, seller.id)
        return created

    async def get_product(self, product_id: UUID) -> Product:
        logger.debug("Fetching product %s", product_id)
        product = await self.product_repo.get_by_id(product_id=product_id)
        if not product:
            logger.warning("Product %s not found", product_id)
            raise_not_found("Product not found")
        return product

    async def get_products(
        self,
        limit: int | None,
        search: str | None,
        category: str | None = None,
    ) -> list[dict]:
        logger.info(
            "Fetching products (limit=%s, search='%s', category='%s')",
            limit, search, category,
        )
        products = await self.product_repo.get_all(
            limit=limit,
            search=search,
            category=category,
        )
        if not products:
            logger.warning("No products found for the given filters")
            raise_not_found("No products available")

        result = []
        for p in products:
            reviews = p.reviews or []
            review_count = len(reviews)
            avg_rating = sum(r.rating for r in reviews) / review_count if review_count else 0.0

            data = serialize_product(p)
            data["review_count"] = review_count
            data["avg_rating"] = round(avg_rating, 1)
            result.append(data)

        logger.debug("Returning %d products", len(result))
        return result

    async def update_product(
        self,
        product_id: UUID,
        update: ProductUpdate,
        current_user: User,
    ) -> Product:
        logger.info("User %s updating product %s", current_user.id, product_id)

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Update failed: user %s is not a seller", current_user.id)
            raise_bad_request("must be seller to edit this product")

        product = await self.get_product(product_id)
        if seller.id != product.seller_id:
            logger.warning(
                "Update failed: seller %s does not own product %s (owner: %s)",
                seller.id, product_id, product.seller_id,
            )
            raise_bad_request("only seller own this product can edit it")

        data = update.model_dump(exclude_unset=True)
        if "price" in data and data["price"] <= 0:
            raise_bad_request("Price must be greater than zero")
        if "stock" in data and data["stock"] < 0:
            raise_bad_request("Stock cannot be negative")

        for field, value in data.items():
            setattr(product, field, value)

        updated = await self.product_repo.save(product)
        logger.info("Product %s updated by seller %s", product_id, seller.id)
        return updated

    async def delete(self, product_id: UUID, current_user: User):
        logger.info("User %s deleting product %s", current_user.id, product_id)

        product = await self.product_repo.get_by_id(product_id)
        if not product:
            logger.warning("Delete failed: product %s not found", product_id)
            raise_not_found("Product Not Found")

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Delete failed: user %s is not a seller", current_user.id)
            raise_not_found("Seller Not Found")

        product.is_active = False

        if product.image_url:
            file_name = os.path.basename(product.image_url)
            if file_name:
                file_path = Path(self.upload_dir) / "products" / file_name
                if file_path.exists():
                    file_path.unlink()
                    logger.debug("Deleted product image: %s", file_path)

        await self.product_repo.save(product)
        logger.info("Product %s soft-deleted by seller %s", product_id, seller.id)
        return {"message": "Product deleted successfully"}