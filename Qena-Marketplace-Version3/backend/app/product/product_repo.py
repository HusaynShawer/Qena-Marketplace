from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product

class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, product: Product) -> Product:
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def get_by_id(self,product_id:str)->Product|None:
        stmt = select(Product).where(Product.id == product_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_seller(self,seller_id:str)->list[Product]:
        stmt = select(Product).where(Product.seller_id==seller_id)
        results = await self.session.execute(stmt)
        return results.scalars().all()

    async def get_all(self)->list[Product]:
        stmt = select(Product)
        results = await self.session.execute(stmt)
        return results.scalars().all()

    async def update(self, product: Product) -> Product:
        return await self.save(product)

    async def delete(self,product:Product)->Product:
            await self.session.delete(product)
            await self.session.flush()

    async def get_by_name(self,product_name:str)->list[Product]|None:
        stmt = select(Product).where(Product.name.like(f"%{product_name}%"))
        products = await self.session.execute(stmt)
        return products.scalars().all()

    async def save(self, product: Product) -> Product:
        await self.session.flush()
        await self.session.refresh(product)
        return product
