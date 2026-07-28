from fastapi import Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.admin_repo import AdminRepo
from app.models import Seller, User
from app.Helper.helper_func import (
    _seller_dict,
    require_admin,
    _get_seller_or_404,
    raise_bad_request,
    raise_not_found,
)
from datetime import datetime
from uuid import UUID


class SuspendRequest(BaseModel):
    reason: Optional[str] = None


class AdminService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.admin_repo = AdminRepo(session)

    async def get_stats(self, current_user: User):
        require_admin(current_user)
        stats = await self.admin_repo.get_stats(current_user)
        return stats

    async def get_pending_sellers(self, current_user: User):
        require_admin(current_user)
        pending_sellers = await self.admin_repo.get_pending_sellers(current_user)
        return [_seller_dict(seller) for seller in pending_sellers]

    async def get_suspended_sellers(self, current_user: User):
        require_admin(current_user)
        suspended_sellers = await self.admin_repo.get_suspended_sellers(current_user)
        return [_seller_dict(seller) for seller in suspended_sellers]

    async def get_approved_sellers(self, current_user: User):
        require_admin(current_user)
        approved_sellers = await self.admin_repo.get_approved_sellers(current_user)
        return [_seller_dict(seller) for seller in approved_sellers]

    async def get_all_sellers(self, current_user: User):
        require_admin(current_user)
        sellers = await self.admin_repo.get_all_sellers(current_user)
        return [_seller_dict(seller) for seller in sellers]

    async def get_seller_by_id(self, seller_id: int, current_user: User):
        require_admin(current_user)
        seller = await _get_seller_or_404(seller_id, self.session)
        return _seller_dict(seller)

    async def get_sellers_financials(self, current_user: User):
        require_admin(current_user)
        financials = await self.admin_repo.get_sellers_financials(current_user)
        return financials

    async def approve_seller(self, seller_id: int, current_user: User):
        require_admin(current_user)
        seller = await _get_seller_or_404(seller_id, self.session)
        if seller.is_suspended:
            raise_bad_request("Cannot approve a suspended seller.")
        seller.approved = True
        seller.approved_at = datetime.utcnow()
        await self.admin_repo.save(seller)
        return {"message": f"Seller {seller_id} approved successfully."}

    async def suspend_seller(
        self,
        seller_id: int,
        body: SuspendRequest,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await _get_seller_or_404(seller_id, self.session)
        if seller.is_suspended:
            raise_bad_request("Seller is already suspended.")
        seller.is_suspended = True
        seller.suspended_at = datetime.utcnow()
        seller.suspension_reason = body.reason
        await self.admin_repo.save(seller)
        return {"message": "Seller suspended", "seller_id": seller_id}

    async def unsuspend_seller(
        self,
        seller_id: int,
        current_user: User,
    ):
        require_admin(current_user)
        seller = await _get_seller_or_404(seller_id, self.session)
        if not seller.is_suspended:
            raise_bad_request("Seller is not suspended")
        seller.is_suspended = False
        seller.suspended_at = None
        seller.suspension_reason = None
        await self.admin_repo.save(seller)
        return {"message": "Seller unsuspended", "seller_id": seller_id}