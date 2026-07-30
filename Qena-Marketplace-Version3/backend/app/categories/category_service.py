from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Category,User
from app.categories.category_repo import CategoryRepository
from app.Helper.helper_func import raise_not_found,raise_bad_request,require_admin
from uuid import UUID
from app.schemas.category import catrequest
from app.core.unitofwork import UnitOfWork

class CategoryService:
    def __init__(self, session:AsyncSession):
        self.session = session
        self.cat_repo = CategoryRepository(session)
        self.uow = UnitOfWork(session)
    async def get_by_id(self,cat_id:UUID)->Category:
        cat = await self.cat_repo.get_by_id(cat_id)
        if not cat:
            raise_not_found("Category Not Found")
        return cat

    async def get_all(self):
        cats = await self.cat_repo.get_all()
        if not cats:
            raise_not_found("No categories avilible")
        return [{"id": c.id, "name": c.name} for c in cats]

    async def add(self,current_user:User,cat:catrequest)->Category:

        if require_admin(current_user):
            category = Category(
                name = cat.name,
                description = cat.description
            )
            await self.cat_repo.add(category)

            try:
                await self.cat_repo.save(category)
                await self.uow.commit()
                return {"message": "Category Appended successfully"}
            except Exception:
                await self.uow.rollback()
            raise
            
        raise_bad_request("only admin can add new categories")