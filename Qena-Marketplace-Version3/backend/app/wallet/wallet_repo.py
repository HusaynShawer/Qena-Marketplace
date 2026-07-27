from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wallet import (
    Wallet,
    WalletTransaction,
    WithdrawalRequest,
    WithdrawalStatus,
)
from uuid import UUID


class WalletRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ------------------------------------------------------------------
    # Wallet
    # ------------------------------------------------------------------

    async def create(
        self,
        wallet: Wallet,
    ) -> Wallet:
        self.session.add(wallet)
        await self.session.flush()
        await self.session.refresh(wallet)
        return wallet

    async def save(
        self,
        wallet: Wallet,
    ) -> Wallet:
        await self.session.flush()
        await self.session.refresh(wallet)
        return wallet

    async def get_by_seller_id(
        self,
        seller_id: UUID,
    ) -> Wallet | None:
        stmt = select(Wallet).where(
            Wallet.seller_id == seller_id
        )

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()

    async def withdraw(
        self,
        wallet: Wallet,
        amount: float,
    ) -> Wallet:
        wallet.balance -= amount
        return await self.save(wallet)

    # ------------------------------------------------------------------
    # Wallet Transactions
    # ------------------------------------------------------------------

    async def create_transaction(
        self,
        transaction: WalletTransaction,
    ) -> WalletTransaction:
        self.session.add(transaction)

        await self.session.flush()
        await self.session.refresh(transaction)

        return transaction

    async def get_transactions_by_wallet_id(
        self,
        wallet_id: UUID,
    ) -> list[WalletTransaction]:
        stmt = select(WalletTransaction).where(
            WalletTransaction.wallet_id == wallet_id
        )

        result = await self.session.execute(stmt)

        return result.scalars().all()

    # ------------------------------------------------------------------
    # Withdrawal Requests
    # ------------------------------------------------------------------

    async def request_withdraw(
        self,
        request: WithdrawalRequest,
    ) -> WithdrawalRequest:
        self.session.add(request)

        await self.session.flush()
        await self.session.refresh(request)

        return request

    async def get_pending_withdraw(
        self,
        seller_id: UUID,
    ) -> WithdrawalRequest | None:
        stmt = select(WithdrawalRequest).where(
            WithdrawalRequest.seller_id == seller_id,
            WithdrawalRequest.status == WithdrawalStatus.PENDING,
        )

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()

    async def get_pending_withdraws(
        self,
    ) -> list[WithdrawalRequest]:
        stmt = select(WithdrawalRequest).where(
            WithdrawalRequest.status == WithdrawalStatus.PENDING
        )

        result = await self.session.execute(stmt)

        return result.scalars().all()

    async def get_withdraw_by_id(
        self,
        request_id: UUID,
    ) -> WithdrawalRequest | None:
        stmt = select(WithdrawalRequest).where(
            WithdrawalRequest.id == request_id
        )

        result = await self.session.execute(stmt)

        return result.scalar_one_or_none()

    async def save_withdraw(
        self,
        request: WithdrawalRequest,
    ) -> WithdrawalRequest:
        await self.session.flush()
        await self.session.refresh(request)

        return request