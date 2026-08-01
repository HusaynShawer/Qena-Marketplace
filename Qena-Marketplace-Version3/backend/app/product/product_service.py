from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Product, User
from app.product.product_repo import ProductRepository
from app.Helper.helper_func import raise_not_found, raise_bad_request,serialize_product
from app.schemas.product import ProductUpdate
from uuid import UUID
from app.seller.seller_repo import SellerRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.core.config import settings
from pathlib import Path


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

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
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

            # This URL perfectly matches the actual filesystem location now.
            image_url = f"/static/uploads/products/{filename}"

        product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
            seller_id=seller.id,
            image_url=image_url,
        )

        return await self.product_repo.create(product)

    async def get_product(self, product_id: UUID) -> Product:
        product = await self.product_repo.get_by_id(product_id=product_id)
        if not product:
            raise_not_found("Product not found")
        return product

    async def get_products(
        self,
        limit: int | None,
        search: str | None,
        category: str | None = None
    ) -> list[dict]:
        products = await self.product_repo.get_all(
            limit=limit,
            search=search,
            category=category
        )
        if not products:
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
        return result

    async def update_product(
        self,
        product_id: UUID,
        update: ProductUpdate,
        current_user: User
    ) -> Product:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise_bad_request("must be seller to edit this product")
        product = await self.get_product(product_id)
        if seller.id != product.seller_id:
            raise_bad_request("only seller own this product can edit it")
        data = update.model_dump(exclude_unset=True)
        if "price" in data and data["price"] <= 0:
            raise_bad_request("Price must be greater than zero")
        if "stock" in data and data["stock"] < 0:
            raise_bad_request("Stock cannot be negative")
        for field, value in data.items():
            setattr(product, field, value)
        return await self.product_repo.save(product)

    async def delete(self, product_id: UUID, current_user: User):
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise_not_found("Product Not Found")
        
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise_not_found("Seller Not Found")

        product.is_active = False

        if product.image_url:
            file_name = os.path.basename(product.image_url)
            if file_name:
                file_path = Path(self.upload_dir) / "products" / file_name
                if file_path.exists():
                    file_path.unlink()

        await self.product_repo.save(product)
        return {"message": "Product deleted successfully"}