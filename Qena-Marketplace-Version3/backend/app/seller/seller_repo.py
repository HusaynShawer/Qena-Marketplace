from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.seller import Seller
from uuid import UUID


class SellerRepository:
    def __init__(self,session:AsyncSession):
        self.session = session

    async def create(self,seller:Seller)->Seller:
        self.session.add(seller)
        await self.session.flush()
        await self.session.refresh(seller)
        return seller

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
    
    async def save(self,seller:Seller)->Seller:
        await self.session.flush()
        return seller

    async def delete(self,seller:Seller):
        await self.session.delete(seller)
        await self.session.flush()