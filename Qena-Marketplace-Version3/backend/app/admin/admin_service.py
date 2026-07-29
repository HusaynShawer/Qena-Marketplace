from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.admin_repo import AdminRepo
from app.core.unitofwork import UnitOfWork
from app.Helper.helper_func import (
    _seller_dict,
    require_admin,
    raise_bad_request,
    raise_not_found,
)
from app.models import User
from app.seller.seller_repo import SellerRepository


class SuspendRequest(BaseModel):
    reason: Optional[str] = None


class AdminService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_repo = AdminRepo(session)
        self.seller_repo = SellerRepository(session)
        self.uow = UnitOfWork(session)

    # ----------------------------------------------------
    # Dashboard
    # ----------------------------------------------------

    async def get_stats(self, current_user: User):
        require_admin(current_user)
        return await self.admin_repo.get_stats(current_user)

    # ----------------------------------------------------
    # Sellers (الريبو أصبح يقوم بتحميل user تلقائياً)
    # ----------------------------------------------------

    async def get_pending_sellers(self, current_user: User):
        require_admin(current_user)
        sellers = await self.admin_repo.get_pending_sellers(current_user)
        return [_seller_dict(seller) for seller in sellers]

    async def get_suspended_sellers(self, current_user: User):
        require_admin(current_user)
        sellers = await self.admin_repo.get_suspended_sellers(current_user)
        return [_seller_dict(seller) for seller in sellers]

    async def get_approved_sellers(self, current_user: User):
        require_admin(current_user)
        sellers = await self.admin_repo.get_approved_sellers(current_user)
        return [_seller_dict(seller) for seller in sellers]

    async def get_all_sellers(self, current_user: User):
        require_admin(current_user)
        sellers = await self.admin_repo.get_all_sellers(current_user)
        return [_seller_dict(seller) for seller in sellers]

    async def get_seller_by_id(
        self,
        seller_id: UUID,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await self.admin_repo.get_seller_by_id_with_user(seller_id)
        if not seller:
            raise_not_found("Seller not found")
        return _seller_dict(seller)

    async def get_sellers_financials(self, current_user: User):
        require_admin(current_user)
        return await self.admin_repo.get_sellers_financials(current_user)

    # ----------------------------------------------------
    # Approve
    # ----------------------------------------------------

    async def approve_seller(
        self,
        seller_id: UUID,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            raise_not_found("Seller not found")
        if seller.is_suspended:
            raise_bad_request("Cannot approve a suspended seller.")

        seller.approved = True
        seller.approved_at = datetime.utcnow()

        try:
            await self.seller_repo.save(seller)
            await self.uow.commit()
            return {"message": "Seller approved successfully"}
        except Exception:
            await self.uow.rollback()
            raise

    # ----------------------------------------------------
    # Suspend
    # ----------------------------------------------------

    async def suspend_seller(
        self,
        seller_id: UUID,
        body: SuspendRequest,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            raise_not_found("Seller not found")
        if seller.is_suspended:
            raise_bad_request("Seller is already suspended.")

        seller.is_suspended = True
        seller.suspended_at = datetime.utcnow()
        seller.suspension_reason = body.reason

        try:
            await self.seller_repo.save(seller)
            await self.uow.commit()
            return {"message": "Seller suspended successfully"}
        except Exception:
            await self.uow.rollback()
            raise

    # ----------------------------------------------------
    # Unsuspend
    # ----------------------------------------------------

    async def unsuspend_seller(
        self,
        seller_id: UUID,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await self.seller_repo.get_by_seller_id(seller_id)
        if not seller:
            raise_not_found("Seller not found")
        if not seller.is_suspended:
            raise_bad_request("Seller is not suspended.")

        seller.is_suspended = False
        seller.suspended_at = None
        seller.suspension_reason = None

        try:
            await self.seller_repo.save(seller)
            await self.uow.commit()
            return {"message": "Seller unsuspended successfully"}
        except Exception:
            await self.uow.rollback()
            raise