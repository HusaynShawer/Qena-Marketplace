from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.wallet import WithdrawalRequestCreate
from app.wallet.wallet_service import WalletService
from app.dependencies.auth import get_current_user, require_role

wallet_router = APIRouter(prefix="/wallet", tags=["Wallet"])
admin_router = APIRouter(prefix="/admin/wallet", tags=["Admin — Wallet"])


# ------------------------------------------------------------------
# Seller — Wallet
# ------------------------------------------------------------------

@wallet_router.get("", summary="Get my wallet")
async def get_wallet(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """Return the authenticated seller's wallet (balance, total earned)."""
    service = WalletService(session)
    return await service.get_wallet(current_user)


@wallet_router.get("/transactions", summary="List wallet transactions")
async def get_transactions(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """Return all credit/debit transactions for the authenticated seller's wallet."""
    service = WalletService(session)
    return await service.get_transactions(current_user)


# ------------------------------------------------------------------
# Seller — Withdrawal requests
# ------------------------------------------------------------------

@wallet_router.post("/withdraw", summary="Request a withdrawal")
async def request_withdraw(
    request: WithdrawalRequestCreate,  # ✅ Pydantic schema, not SQLAlchemy model
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """
    Submit a withdrawal request against the seller's wallet balance.
    Returns 400 if balance is insufficient or a pending request already exists.
    """
    service = WalletService(session)
    return await service.request_withdraw(current_user.id, request)


@wallet_router.get("/withdraw/pending", summary="Get my pending withdrawal")
async def get_pending_withdraw(
    current_user: User = Depends(require_role("seller")),
    session: AsyncSession = Depends(get_db),
):
    """Return the seller's current pending withdrawal request, or null if none."""
    service = WalletService(session)
    return await service.get_pending_withdraw(current_user.id)


# ------------------------------------------------------------------
# Admin — Withdrawal management
# ------------------------------------------------------------------

@admin_router.get("/withdrawals", summary="List all pending withdrawals")
async def admin_get_pending_withdrawals(
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    """Return all pending withdrawal requests across all sellers."""
    service = WalletService(session)
    return await service.admin_get_pending_withdraw()


@admin_router.post("/withdrawals/{request_id}/approve", summary="Approve a withdrawal")
async def approve_withdraw(
    request_id: int,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    """
    Approve a pending withdrawal request.
    Deducts the amount from the seller's wallet and records a DEBIT transaction.
    Returns 400 if already processed or balance is insufficient.
    """
    service = WalletService(session)
    return await service.approve_withdraw(request_id)


@admin_router.post("/withdrawals/{request_id}/reject", summary="Reject a withdrawal")
async def reject_withdraw(
    request_id: int,
    admin_note: str | None = Query(default=None, description="Optional rejection reason"),
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db),
):
    """
    Reject a pending withdrawal request.
    Optionally attach an admin note explaining the reason.
    Returns 400 if the request has already been processed.
    """
    service = WalletService(session)
    return await service.reject_withdraw(request_id, admin_note)