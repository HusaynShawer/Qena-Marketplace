import logging
from uuid import UUID

from fastapi import Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.unitofwork import UnitOfWork
from app.Helper.helper_func import raise_forbidden, raise_not_found, raise_bad_request
from app.models import Product, User
from app.models.seller import Seller
from app.seller.seller_repo import SellerRepository

logger = logging.getLogger(__name__)


class SellerApply(BaseModel):
    shop_name: str
    shop_description: str | None = None
    phone: str | None = None


class SellerUpdate(BaseModel):
    shop_name: str | None = None
    shop_description: str | None = None
    phone: str | None = None


class SellerService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.seller_repo = SellerRepository(session)
        self.uow = UnitOfWork(session)

    async def get_seller_products(self, current_user: User) -> list[Product]:
        logger.info("User %s fetching their seller products", current_user.id)
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Seller not found for user %s", current_user.id)
            raise_not_found("Seller not found")

        products = await self.seller_repo.get_seller_products(seller.id)
        if not products:
            logger.warning("No products found for seller %s", seller.id)
            raise_not_found("No products found for this seller")

        logger.debug("Returning %d products for seller %s", len(products), seller.id)
        return products

    async def create(self, current_user: User, data: SellerApply):
        logger.info("User %s applying to become a seller", current_user.id)

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if seller:
            logger.warning("User %s already has a seller profile", current_user.id)
            raise_bad_request("Seller already exists")

        seller = Seller(
            user_id=current_user.id,
            shop_name=data.shop_name,
            shop_description=data.shop_description,
            phone=data.phone,
            approved=False,
        )

        try:
            await self.seller_repo.create(seller)
            await self.uow.commit()
            logger.info("Seller application submitted for user %s", current_user.id)
            return {"message": "Application submitted, waiting for approval"}
        except Exception:
            logger.exception("Failed to create seller application for user %s", current_user.id)
            await self.uow.rollback()
            raise

    async def get_seller(self, seller_id: UUID) -> Seller:
        logger.debug("Fetching seller %s", seller_id)
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            logger.warning("Seller %s not found", seller_id)
            raise_not_found("Seller not exists")
        return seller

    async def update_product(self, current_user: User, product_id: UUID, **kwargs) -> Product:
        logger.info("User %s updating product %s", current_user.id, product_id)
        product = await self.seller_repo.get_product_by_id(product_id)
        if not product:
            logger.warning("Product %s not found for update", product_id)
            raise_not_found("Product not found")

        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Seller not found for user %s", current_user.id)
            raise_not_found("Seller not found")

        if product.seller_id != seller.id:
            logger.warning("User %s tried to update product %s they don't own", current_user.id, product_id)
            raise_forbidden("You do not own this product")

        updated_product = await self.seller_repo.update_product(product, **kwargs)

        try:
            await self.uow.commit()
            logger.info("Product %s updated by seller %s", product_id, seller.id)
            return updated_product
        except Exception:
            logger.exception("Failed to update product %s", product_id)
            await self.uow.rollback()
            raise

    async def get_all_seller(self) -> list[Seller]:
        logger.debug("Fetching all sellers")
        sellers = await self.seller_repo.get_all()
        logger.debug("Returning %d sellers", len(sellers))
        return sellers

    async def delete(self, seller_id: UUID):
        logger.info("Deleting seller %s", seller_id)
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            logger.warning("Seller %s not found for deletion", seller_id)
            raise_not_found("Seller not exists")

        try:
            await self.seller_repo.delete(seller)
            await self.uow.commit()
            logger.info("Seller %s deleted successfully", seller_id)
        except Exception:
            logger.exception("Failed to delete seller %s", seller_id)
            await self.uow.rollback()
            raise

    async def update(self, current_user: User, update: SellerUpdate) -> Seller:
        logger.info("User %s updating their seller profile", current_user.id)
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Seller not found for user %s", current_user.id)
            raise_not_found("Seller not exist")

        data = update.model_dump(exclude_unset=True)

        if "shop_name" in data and len(data["shop_name"]) < 3:
            logger.warning("Invalid shop name length for user %s", current_user.id)
            raise_bad_request("Shop name must be at least 3 characters.")

        for field, value in data.items():
            setattr(seller, field, value)

        try:
            seller = await self.seller_repo.save(seller)
            await self.uow.commit()
            logger.info("Seller profile updated for user %s", current_user.id)
            return seller
        except Exception:
            logger.exception("Failed to update seller profile for user %s", current_user.id)
            await self.uow.rollback()
            raise

    async def get_my_seller(self, user_id: UUID) -> Seller:
        logger.debug("Fetching seller for user %s", user_id)
        seller = await self.seller_repo.get_by_user_id(user_id=user_id)
        if not seller:
            logger.warning("Seller not found for user %s", user_id)
            raise_not_found("Seller Not Found")
        return seller