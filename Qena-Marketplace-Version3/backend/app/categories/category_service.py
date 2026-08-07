import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Category, User
from app.categories.category_repo import CategoryRepository
from app.Helper.helper_func import raise_not_found, raise_bad_request, require_admin
from uuid import UUID
from app.schemas.category import catrequest
from app.core.unitofwork import UnitOfWork

logger = logging.getLogger(__name__)


class CategoryService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.cat_repo = CategoryRepository(session)
        self.uow = UnitOfWork(session)

    async def get_by_id(self, cat_id: UUID) -> Category:
        logger.info("Fetching category by id: %s", cat_id)
        cat = await self.cat_repo.get_by_id(cat_id)
        if not cat:
            logger.warning("Category %s not found", cat_id)
            raise_not_found("Category Not Found")
        return cat

    async def get_all(self):
        logger.info("Fetching all categories")
        cats = await self.cat_repo.get_all()
        if not cats:
            logger.warning("No categories available")
            raise_not_found("No categories available")
        logger.debug("Returning %d categories", len(cats))
        return [{"id": c.id, "name": c.name} for c in cats]

    async def add(self, current_user: User, cat: catrequest) -> Category:
        logger.info("Admin %s attempting to add category: '%s'", current_user.id, cat.name)
        if require_admin(current_user):
            category = Category(
                name=cat.name,
                description=cat.description
            )
            await self.cat_repo.add(category)

            try:
                await self.cat_repo.save(category)
                await self.uow.commit()
                logger.info("Category '%s' added successfully by admin %s", cat.name, current_user.id)
                return {"message": "Category Appended successfully"}
            except Exception:
                logger.exception("Failed to add category '%s' for admin %s", cat.name, current_user.id)
                await self.uow.rollback()
                raise

        logger.warning("Non-admin user %s attempted to add category", current_user.id)
        raise_bad_request("only admin can add new categories")

    async def category_products(self, cat_id: UUID):
        logger.info("Fetching products for category %s", cat_id)
        products = await self.cat_repo.category_products(cat_id)
        logger.debug("Category %s has %d products", cat_id, len(products) if products else 0)
        return products