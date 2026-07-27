from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.seller import Seller
from app.Helper.helper_func import raise_not_found,raise_bad_request
from app.seller.seller_repo import SellerRepository
from app.models.user import User
from pydantic import BaseModel
from uuid import UUID


class SellerApply(BaseModel):
    shop_name: str
    shop_description: str = None

class SellerUpdate(BaseModel):
    shop_name: str =None
    shop_description: str = None
    phone:str = None

class SellerService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.seller_repo = SellerRepository(session=session)

    async def create(self,current_user:User,data:SellerApply):
        seller = await self.seller_repo.get_by_user_id(current_user.id)

        if seller:
            raise_bad_request("already exist")

        seller = Seller(
            user_id=current_user.id,
                    shop_name=data.shop_name,
                    shop_description=data.shop_description,
                    approved=False
        )
        await self.seller_repo.create(seller=seller)
        return {"message": "Application submitted, waiting for approval"}

    async def get_seller(self,seller_id:UUID)->Seller:
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            raise_not_found("seller not exists")
        return seller

    async def get_all_seller(self)->list[Seller]:
        sellers = await self.seller_repo.get_all()
        return sellers

    async def delete(self,seller_id:UUID):
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            raise_not_found("seller not exists")
        await self.seller_repo.delete(seller)

    async def update(self,current_user:User,update:SellerUpdate)->Seller:
        seller =await self.seller_repo.get_by_user_id(current_user.id)

        if not seller:
            raise_not_found("seller not exist")

        data = update.model_dump(exclude_unset=True)

        if "shop_name" in data and len(data["shop_name"]) < 3:
             raise_bad_request("Shop name must be at least 3 characters.")
        for field, value in data.items():
            setattr(seller, field, value)

        return await self.seller_repo.save(seller=seller)