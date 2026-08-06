from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.schemas.wallet import WithdrawalRequestCreate
from app.wallet.wallet_service import WalletService
from app.dependencies.auth import get_current_user, require_role

wallet_router = APIRouter(prefix="/wallet", tags=["Wallet"])
admin_wallet_router = APIRouter(prefix="/wallet/admin", tags=["Admin — Wallet"])


# ------------------------------------------------------------------
# Seller — Wallet
# ------------------------------------------------------------------

@wallet_router.get("", summary="Get my wallet")
async def get_wallet(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.get_wallet(current_user)


@wallet_router.get("/transactions", summary="List wallet transactions")
async def get_transactions(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.get_transactions(current_user)


# ------------------------------------------------------------------
# Seller — Withdrawal requests
# ------------------------------------------------------------------

@wallet_router.post("/withdraw", summary="Request a withdrawal")
async def request_withdraw(
    request: WithdrawalRequestCreate,
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Submit a withdrawal request.
    Returns 400 if: amount < 50, balance insufficient, or pending request exists.
    """
    if request.amount < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الحد الأدنى للسحب ٥٠ جنيه مصري"
        )

    service = WalletService(session)
    return await service.request_withdraw(current_user.id, request)


@wallet_router.get("/withdraw/pending", summary="Get my pending withdrawal")
async def get_pending_withdraw(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.get_pending_withdraw(current_user.id)


@wallet_router.get("/withdrawals", summary="Get my withdrawal requests")
async def get_my_withdrawals(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.get_seller_withdrawals(current_user.id)


# ------------------------------------------------------------------
# Admin — Withdrawal management
# ------------------------------------------------------------------

@admin_wallet_router.get("/withdrawals", summary="List all pending withdrawals")
async def admin_get_pending_withdrawals(
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.admin_get_pending_withdraw()


@admin_wallet_router.post("/withdrawals/{request_id}/approve", summary="Approve a withdrawal")
async def approve_withdraw(
    request_id: UUID,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.approve_withdraw(request_id)


@admin_wallet_router.post("/withdrawals/{request_id}/reject", summary="Reject a withdrawal")
async def reject_withdraw(
    request_id: UUID,
    admin_note: str | None = Query(default=None, description="Optional rejection reason"),
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.reject_withdraw(request_id, admin_note)


@admin_wallet_router.get("/wallets", summary="List all sellers' wallets")
async def admin_get_wallets(
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    service = WalletService(session)
    return await service.admin_get_wallets()