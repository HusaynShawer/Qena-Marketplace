from app.models.wallet import (
    Wallet,
    WalletTransaction,
    TransactionType,
    WithdrawalRequest,
    WithdrawalStatus,
)
from app.schemas.wallet import (
    WithdrawalRequestCreate,
    WithdrawalRequestResponse,
    WalletResponse,
    WalletTransactionResponse,
)
from app.wallet.wallet_repo import WalletRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from fastapi import HTTPException
from uuid import UUID

class WalletService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.wallet_repo = WalletRepository(session)

    # --------------------------------------------------------
    # Wallet
    # --------------------------------------------------------

    async def create(
        self,
        wallet: Wallet,
    ) -> Wallet:
        return await self.wallet_repo.create(wallet)

    async def credit_wallet(
        self,
        seller_id: UUID,
        amount: float,
        order_id: UUID,
    ) -> None:

        wallet = await self.wallet_repo.get_by_seller_id(
            seller_id=seller_id
        )

        if not wallet:
            wallet = Wallet(
                seller_id=seller_id,
                balance=0,
                total_earned=0,
            )

            await self.wallet_repo.create(wallet)

        wallet.balance += amount
        wallet.total_earned += amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=TransactionType.CREDIT,
            amount=amount,
            order_id=order_id,
            description=f"Revenue from order {order_id}",
        )

        await self.wallet_repo.save(wallet)
        await self.wallet_repo.create_transaction(transaction)

    async def get_wallet(
        self,
        current_user: User,
    ) -> Wallet:

        wallet = await self.wallet_repo.get_by_seller_id(
            seller_id=current_user.id
        )

        if not wallet:
            raise HTTPException(
                status_code=404,
                detail="Wallet not found.",
            )

        return wallet

    async def get_transactions(
        self,
        current_user: User,
    ) -> list[WalletTransaction]:

        wallet = await self.wallet_repo.get_by_seller_id(
            seller_id=current_user.id
        )

        if not wallet:
            raise HTTPException(
                status_code=404,
                detail="Wallet not found.",
            )

        return await self.wallet_repo.get_transactions_by_wallet_id(
            wallet.id
        )

    # --------------------------------------------------------
    # Withdrawal Requests
    # --------------------------------------------------------

    async def request_withdraw(
        self,
        seller_id: UUID,
        request: WithdrawalRequest,
    ) -> WithdrawalRequest:

        wallet = await self.wallet_repo.get_by_seller_id(
            seller_id=seller_id
        )

        if not wallet:
            raise HTTPException(
                status_code=404,
                detail="Wallet not found.",
            )

        if wallet.balance < request.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient wallet balance.",
            )

        pending = await self.wallet_repo.get_pending_withdraw(
            seller_id=seller_id
        )

        if pending:
            raise HTTPException(
                status_code=400,
                detail="You already have a pending withdrawal request.",
            )

        request.seller_id = seller_id
        request.status = WithdrawalStatus.PENDING

        return await self.wallet_repo.request_withdraw(request)

    async def get_pending_withdraw(
        self,
        seller_id: UUID,
    ) -> WithdrawalRequest | None:

        return await self.wallet_repo.get_pending_withdraw(
            seller_id=seller_id
        )

    async def admin_get_pending_withdraw(
        self,
    ) -> list[WithdrawalRequest]:

        return await self.wallet_repo.get_pending_withdraws()

    async def approve_withdraw(
        self,
        request_id: UUID,
    ) -> WithdrawalRequest:

        request = await self.wallet_repo.get_withdraw_by_id(
            request_id=request_id
        )

        if not request:
            raise HTTPException(
                status_code=404,
                detail="Withdrawal request not found.",
            )

        if request.status != WithdrawalStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Withdrawal request has already been processed.",
            )

        wallet = await self.wallet_repo.get_by_seller_id(
            seller_id=request.seller_id
        )

        if not wallet:
            raise HTTPException(
                status_code=404,
                detail="Wallet not found.",
            )

        if wallet.balance < request.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient wallet balance.",
            )

        wallet.balance -= request.amount

        transaction = WalletTransaction(
            wallet_id=wallet.id,
            type=TransactionType.DEBIT,
            amount=request.amount,
            description=f"Withdrawal request #{request.id}",
        )

        request.status = WithdrawalStatus.APPROVED

        await self.wallet_repo.save(wallet)
        await self.wallet_repo.save_withdraw(request)
        await self.wallet_repo.create_transaction(transaction)

        return request

    async def reject_withdraw(
        self,
        request_id: UUID,
        admin_note: str | None = None,
    ) -> WithdrawalRequest:

        request = await self.wallet_repo.get_withdraw_by_id(
            request_id=request_id
        )

        if not request:
            raise HTTPException(
                status_code=404,
                detail="Withdrawal request not found.",
            )

        if request.status != WithdrawalStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail="Withdrawal request has already been processed.",
            )

        request.status = WithdrawalStatus.REJECTED
        request.admin_note = admin_note

        await self.wallet_repo.save_withdraw(request)

        return request