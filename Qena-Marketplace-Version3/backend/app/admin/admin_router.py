from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.admin.admin_service import AdminService, SuspendRequest
from app.dependencies.auth import get_current_user, get_db
from app.models import User

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


@admin_router.get("/stats")
async def admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_stats(current_user)


@admin_router.get("/sellers/pending")
async def get_pending_sellers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_pending_sellers(current_user)


@admin_router.get("/sellers/suspended")
async def get_suspended_sellers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_suspended_sellers(current_user)


@admin_router.get("/sellers/approved")
async def get_approved_sellers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_approved_sellers(current_user)


@admin_router.get("/sellers/all")
async def get_all_sellers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_all_sellers(current_user)


@admin_router.get("/sellers/{seller_id}")
async def get_seller(
    seller_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_seller_by_id(seller_id, current_user)


@admin_router.get("/sellers/financials")
async def get_sellers_financials(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.get_sellers_financials(current_user)


@admin_router.post("/sellers/{seller_id}/approve")
async def approve_seller(
    seller_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.approve_seller(seller_id, current_user)


@admin_router.post("/sellers/{seller_id}/suspend")
async def suspend_seller(
    seller_id: int,
    body: SuspendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.suspend_seller(seller_id, body, current_user)


@admin_router.post("/sellers/{seller_id}/unsuspend")
async def unsuspend_seller(
    seller_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    return await service.unsuspend_seller(seller_id, current_user)