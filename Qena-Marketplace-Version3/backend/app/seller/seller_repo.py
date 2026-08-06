from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Seller,Product
from uuid import UUID


class SellerRepository:
    def __init__(self,session:AsyncSession):
        self.session = session

    async def create(self,seller:Seller)->Seller:
        self.session.add(seller)
        await self.session.flush()
        await self.session.refresh(seller)
        return seller

    async def get_seller_products(self, seller_id: UUID) -> list[Product]:
        stmt = select(Product).where(Product.seller_id == seller_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_product_by_id(self, product_id: UUID) -> Product | None:
        stmt = select(Product).where(Product.id == product_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_seller_id(self,seller_id:UUID)->Seller|None:
        stmt = select(Seller).where(Seller.id == seller_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_user_id(self,user_id:UUID)->Seller|None:
        stmt = select(Seller).where(Seller.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self)->list[Seller]:
        stmt = select(Seller)
        resluts = await self.session.execute(stmt)
        return resluts.scalars().all()

    async def update_product(self, product: Product, **kwargs) -> Product:
        for key, value in kwargs.items():
            setattr(product, key, value)
        await self.session.flush()
        await self.session.refresh(product)
        return product
    
    async def save(self,seller:Seller)->Seller:
        await self.session.flush()
        return seller

    async def delete(self,seller:Seller):
        await self.session.delete(seller)
        await self.session.flush()