import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.wallet import (
    Wallet,
    WalletTransaction,
    TransactionType,
    WithdrawalRequest,
    WithdrawalStatus,
)
from app.schemas.wallet import (
    WithdrawalRequestCreate,
)
from app.seller.seller_repo import SellerRepository
from app.wallet.wallet_repo import WalletRepository

logger = logging.getLogger(__name__)


class WalletService:

    def __init__(self, session: AsyncSession):
        self.session = session
        self.wallet_repo = WalletRepository(session)
        self.seller_repo = SellerRepository(session)

    # --------------------------------------------------------
    # Wallet
    # --------------------------------------------------------

    async def create(self, wallet: Wallet) -> Wallet:
        logger.info("Creating wallet for seller %s", wallet.seller_id)
        return await self.wallet_repo.create(wallet)

    async def credit_wallet(
        self,
        seller_id: UUID,
        amount: float,
        order_id: UUID,
    ) -> None:
        logger.info("Crediting seller %s for order %s", seller_id, order_id)

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller_id)

        if not wallet:
            wallet = Wallet(
                seller_id=seller_id,
                balance=0,
                total_earned=0,
            )
            await self.wallet_repo.create(wallet)
            logger.debug("Created new wallet for seller %s", seller_id)

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
        logger.info("Wallet %s credited successfully", wallet.id)

    async def get_wallet(self, current_user: User) -> Wallet:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Wallet access failed: user %s is not a seller", current_user.id)
            raise HTTPException(status_code=404, detail="Seller not found.")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            logger.warning("Wallet not found for seller %s", seller.id)
            raise HTTPException(status_code=404, detail="Wallet not found.")

        logger.debug("Returning wallet for seller %s", seller.id)
        return wallet

    async def get_transactions(self, current_user: User) -> list[WalletTransaction]:
        seller = await self.seller_repo.get_by_user_id(current_user.id)
        if not seller:
            logger.warning("Transaction list failed: user %s is not a seller", current_user.id)
            raise HTTPException(status_code=404, detail="Seller not found.")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            logger.warning("Wallet not found for seller %s", seller.id)
            raise HTTPException(status_code=404, detail="Wallet not found.")

        transactions = await self.wallet_repo.get_transactions_by_wallet_id(wallet.id)
        logger.debug("Returning %d transactions for wallet %s", len(transactions), wallet.id)
        return transactions

    # --------------------------------------------------------
    # Withdrawal Requests
    # --------------------------------------------------------

    async def request_withdraw(
        self,
        user: UUID,
        request: WithdrawalRequestCreate,
    ) -> WithdrawalRequest:
        logger.info("User %s requesting withdrawal", user)

        seller = await self.seller_repo.get_by_user_id(user)
        if not seller:
            logger.warning("Withdrawal request failed: user %s is not a seller", user)
            raise HTTPException(status_code=404, detail="Seller not found")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=seller.id)
        if not wallet:
            wallet = Wallet(seller_id=seller.id, balance=0, total_earned=0)
            await self.wallet_repo.create(wallet)
            logger.debug("Created wallet for seller %s during withdrawal request", seller.id)

        if wallet.balance < request.amount:
            logger.warning("Withdrawal request denied: insufficient balance for seller %s", seller.id)
            raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

        pending = await self.wallet_repo.get_pending_withdraw(seller_id=seller.id)
        if pending:
            logger.warning("Withdrawal request denied: seller %s already has a pending request", seller.id)
            raise HTTPException(status_code=400, detail="You already have a pending withdrawal request.")

        withdrawal = WithdrawalRequest(
            seller_id=seller.id,
            amount=request.amount,
            method=request.method,
            account_number=request.account_number,
            status=WithdrawalStatus.PENDING,
        )

        created = await self.wallet_repo.request_withdraw(withdrawal)
        logger.info("Withdrawal request %s created for seller %s", created.id, seller.id)
        return created

    async def get_pending_withdraw(self, user_id: UUID) -> WithdrawalRequest | None:
        seller = await self.seller_repo.get_by_user_id(user_id)
        if not seller:
            logger.warning("Pending withdrawal check failed: user %s is not a seller", user_id)
            raise HTTPException(status_code=404, detail="Seller not found")
        return await self.wallet_repo.get_pending_withdraw(seller_id=seller.id)

    async def admin_get_pending_withdraw(self) -> list[WithdrawalRequest]:
        logger.debug("Admin fetching all pending withdrawal requests")
        return await self.wallet_repo.get_pending_withdraws()

    async def approve_withdraw(self, request_id: UUID) -> WithdrawalRequest:
        logger.info("Approving withdrawal request %s", request_id)

        request = await self.wallet_repo.get_withdraw_by_id(request_id=request_id)
        if not request:
            logger.warning("Withdrawal request %s not found", request_id)
            raise HTTPException(status_code=404, detail="Withdrawal request not found.")

        if request.status != WithdrawalStatus.PENDING:
            logger.warning("Withdrawal request %s already processed", request_id)
            raise HTTPException(status_code=400, detail="Withdrawal request has already been processed.")

        wallet = await self.wallet_repo.get_by_seller_id(seller_id=request.seller_id)
        if not wallet:
            logger.warning("Wallet not found for seller %s during withdrawal approval", request.seller_id)
            raise HTTPException(status_code=404, detail="Wallet not found.")

        if wallet.balance < request.amount:
            logger.warning("Insufficient balance for withdrawal request %s", request_id)
            raise HTTPException(status_code=400, detail="Insufficient wallet balance.")

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

        logger.info("Withdrawal request %s approved for seller %s", request_id, request.seller_id)
        return request

    async def reject_withdraw(
        self,
        request_id: UUID,
        admin_note: str | None = None,
    ) -> WithdrawalRequest:
        logger.info("Rejecting withdrawal request %s", request_id)

        request = await self.wallet_repo.get_withdraw_by_id(request_id=request_id)
        if not request:
            logger.warning("Withdrawal request %s not found", request_id)
            raise HTTPException(status_code=404, detail="Withdrawal request not found.")

        if request.status != WithdrawalStatus.PENDING:
            logger.warning("Withdrawal request %s already processed", request_id)
            raise HTTPException(status_code=400, detail="Withdrawal request has already been processed.")

        request.status = WithdrawalStatus.REJECTED
        request.admin_note = admin_note

        await self.wallet_repo.save_withdraw(request)
        logger.info("Withdrawal request %s rejected", request_id)
        return request

    async def get_seller_withdrawals(self, user_id: UUID):
        seller = await self.seller_repo.get_by_user_id(user_id)
        if not seller:
            logger.warning("Withdrawal history failed: user %s is not a seller", user_id)
            raise HTTPException(status_code=404, detail="Seller not found")
        return await self.wallet_repo.get_withdrawals_by_seller_id(seller.id)

    async def admin_get_wallets(self) -> list[Wallet]:
        logger.debug("Admin fetching all wallets")
        return await self.wallet_repo.get_all_wallets()