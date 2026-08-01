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
from app.seller.seller_repo import SellerRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from fastapi import HTTPException
from uuid import UUID

class WalletService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.wallet_repo = WalletRepository(session)
        self.seller_repo = SellerRepository(session)
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

    async def get_wallet(self, current_user: User) -> Wallet:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found.")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found.")

        return wallet
    
    async def get_transactions(self, current_user: User) -> list[WalletTransaction]:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found.")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            raise HTTPException(status_code=404, detail="Wallet not found.")

        return await self.wallet_repo.get_transactions_by_wallet_id(wallet.id)
    # --------------------------------------------------------
    # Withdrawal Requests
    # --------------------------------------------------------

    async def request_withdraw(
        self,
        user: UUID,
        request: WithdrawalRequestCreate,
    ) -> WithdrawalRequest:

        seller = await self.seller_repo.get_by_user_id(user)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            wallet = Wallet(seller_id=seller.id, balance=0, total_earned=0)
            await self.wallet_repo.create(wallet)

        if wallet.balance < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

        pending = await self.wallet_repo.get_pending_withdraw(seller_id=seller.id)
        if pending:
            raise HTTPException(status_code=400, detail="You already have a pending withdrawal request.")

        withdrawal = WithdrawalRequest(
            seller_id=seller.id,
            amount=request.amount,
            method=request.method,                  
            account_number=request.account_number,
            status=WithdrawalStatus.PENDING,
        )

        return await self.wallet_repo.request_withdraw(withdrawal)

    async def get_pending_withdraw(
        self,
        user_id: UUID,
    ) -> WithdrawalRequest | None:

        seller = await self.seller_repo.get_by_user_id(user_id)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")
        return await self.wallet_repo.get_pending_withdraw(
            seller_id=seller.id
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

    async def get_seller_withdrawals(self, user_id: UUID):
        seller = await self.seller_repo.get_by_user_id(user_id)
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")
        return await self.wallet_repo.get_withdrawals_by_seller_id(seller.id)