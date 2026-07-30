from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Product, User
from app.product.product_repo import ProductRepository
from app.Helper.helper_func import raise_not_found, raise_bad_request
from app.schemas.product import ProductUpdate
from uuid import UUID
from app.seller.seller_repo import SellerRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
import os
import uuid
import aiofiles
from fastapi import UploadFile
from app.core.config import settings

class ProductService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session=session)
        self.seller_repo = SellerRepository(session=session)
        self.upload_dir = os.getenv("UPLOAD_DIR", "/app/static/uploads/products")

    async def create(
        self,
        name: str,
        description: str | None,
        price: float,
        stock: int,
        category_id: str | None,
        image: UploadFile | None,
        current_user: User
    ) -> Product:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise_not_found("No seller exists")

        image_url = None
        if image:
            os.makedirs(self.upload_dir, exist_ok=True)
            file_extension = image.filename.split(".")[-1] if image.filename and "." in image.filename else "jpg"
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(self.upload_dir, unique_filename)
            
            async with aiofiles.open(file_path, "wb") as out_file:
                content = await image.read()
                await out_file.write(content)
            
            image_url = f"/static/uploads/products/{unique_filename}"

        product_data = {
            "name": name,
            "description": description,
            "price": price,
            "stock": stock,
            "category_id": category_id,
            "seller_id": seller.id,
            "image_url": image_url,
        }
        product = Product(**product_data)
        return await self.product_repo.create(product=product)

    async def get_product(self, product_id: UUID) -> Product:
        product = await self.product_repo.get_by_id(product_id=product_id)
        if not product:
            raise_not_found("Product not found")
        return product

    async def get_products(self) -> list[Product]:
        product = await self.product_repo.get_all()
        if not product:
            raise_not_found("No products available")
        return product

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
        return await self.product_repo.delete(product=product)