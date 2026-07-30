from sqlalchemy.ext.asyncio import AsyncSession
from app.models.seller import Seller
from app.Helper.helper_func import raise_not_found, raise_bad_request
from app.seller.seller_repo import SellerRepository
from app.models.user import User, UserRole
from app.models import Product
from pydantic import BaseModel
from uuid import UUID
from app.core.unitofwork import UnitOfWork
from app.dependencies.auth import get_current_user, require_role
from fastapi import Depends


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
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise_not_found("Seller not found")
        products = await self.seller_repo.get_seller_products(seller.id)
        if not products:
            raise_not_found("No products found for this seller")
        return products

    async def create(
        self,
        current_user: User,
        data: SellerApply,
    ):
        seller = await self.seller_repo.get_by_user_id(current_user.id)

        if seller:
            raise_bad_request("Seller already exists")

        seller = Seller(
            user_id=current_user.id,
            shop_name=data.shop_name,
            shop_description=data.shop_description,
            phone = data.phone,
            approved=False,
        )

        try:
            await self.seller_repo.create(seller)

            await self.uow.commit()

            return {
                "message": "Application submitted, waiting for approval"
            }

        except Exception:
            await self.uow.rollback()
            raise

    async def get_seller(
        self,
        seller_id: UUID,
    ) -> Seller:

        seller = await self.seller_repo.get_by_seller_id(seller_id)

        if not seller:
            raise_not_found("Seller not exists")

        return seller

    async def get_all_seller(self) -> list[Seller]:
        return await self.seller_repo.get_all()

    async def delete(
        self,
        seller_id: UUID,
    ):

        seller = await self.seller_repo.get_by_seller_id(seller_id)

        if not seller:
            raise_not_found("Seller not exists")

        try:
            await self.seller_repo.delete(seller)

            await self.uow.commit()

        except Exception:
            await self.uow.rollback()
            raise

    async def update(
        self,
        current_user: User,
        update: SellerUpdate,
    ) -> Seller:

        seller = await self.seller_repo.get_by_user_id(current_user.id)

        if not seller:
            raise_not_found("Seller not exist")

        data = update.model_dump(exclude_unset=True)

        if "shop_name" in data and len(data["shop_name"]) < 3:
            raise_bad_request("Shop name must be at least 3 characters.")

        for field, value in data.items():
            setattr(seller, field, value)

        try:
            seller = await self.seller_repo.save(seller)

            await self.uow.commit()

            return seller

        except Exception:
            await self.uow.rollback()
            raise

    async def get_my_seller(self, user_id: UUID) -> Seller:
        seller = await self.seller_repo.get_by_user_id(user_id=user_id)

        if not seller:
            raise_not_found("Seller Not Found")

        return seller