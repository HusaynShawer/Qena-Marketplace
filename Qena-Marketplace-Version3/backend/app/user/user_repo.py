from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from uuid import UUID


class UserRepository:
    def __init__(self,session:AsyncSession):
        self.session = session

    async def create(self,user:User):
        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user
    
    async def get_by_id(self,user_id:UUID)->User|None:
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_email(self,email:str)->User|None:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(self,name:str)->User|None:
        stmt = select(User).where(User.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    
    async def get_all(self)->list[User]:
        stmt = select(User)
        resluts = await self.session.execute(stmt)
        return resluts.scalars().all()
    
    async def save(self,user:User)->User:
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update(self,user:User):
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def delete(self,user:User):
        await self.session.delete(user)
        await self.session.flush()