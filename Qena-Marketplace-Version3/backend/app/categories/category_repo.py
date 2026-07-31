from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.category import Category
from uuid import UUID

class CategoryRepository:
    def __init__(self, session:AsyncSession):
        self.session = session

    async def get_by_id(self,cat_id:UUID)->Category|None:
        stmt = select(Category).where(Category.id == cat_id)
        result =await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add(self,cat:Category)->Category:
        self.session.add(cat)
        await self.session.flush()
        return cat

    async def get_all(self)->list[Category]:
        stmt = select(Category)
        results = await self.session.execute(stmt) 
        return results.scalars().all()

    async def save(self,cat:Category):
        await self.session.flush()