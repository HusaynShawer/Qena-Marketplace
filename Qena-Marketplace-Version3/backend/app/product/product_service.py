from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Product, User
from app.product.product_repo import ProductRepository
from app.Helper.helper_func import raise_not_found,raise_bad_request
from app.schemas.product import ProductUpdate
from uuid import UUID
from app.seller.seller_repo import SellerRepository
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

class ProductService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.product_repo = ProductRepository(session=session)
        self.seller_repo = SellerRepository(session=session)

    async def create(self,body:ProductCreate,current_user:User)->Product:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise_not_found("No seller exists")
        product = Product(**body.model_dump(), seller_id=seller.id)
        return await self.product_repo.create(product=product)

    async def get_product(self,product_id:UUID)->Product:
        product = await self.product_repo.get_by_id(product_id=product_id)
        if not product:
            raise_not_found("Product not found")
        return product

    async def get_products(self)->list[Product]:
        product = await self.product_repo.get_all()
        if not product:
            raise_not_found("No products available")
        return product

    #update_product
    async def update_product(
        self,
        product_id: UUID,
        update: ProductUpdate,
        current_user:User
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

    #delete_product
    async def delete(self,product_id:UUID,current_user:User):
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise_not_found("Product Not Found")

        seller = await self.seller_repo.get_by_user_id(current_user.id)

        if not seller:
            raise_not_found("Seller Not Found")

        return await self.product_repo.delete(product=product)
         