from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Wallet, Order, Seller
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload


class AdminRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self, admin: User):
        total_users = await self.session.scalar(select(func.count(User.id)))

        total_sellers = await self.session.scalar(
            select(func.count(Seller.id)).where(Seller.approved == True)
        )

        total_pending_seller = await self.session.scalar(
            select(func.count(Seller.id)).where(Seller.approved == False)
        )

        total_suspend_seller = await self.session.scalar(
            select(func.count(Seller.id)).where(Seller.is_suspended == True)
        )

        total_orders = await self.session.scalar(select(func.count(Order.id)))

        revenue_result = await self.session.execute(
            select(func.sum(Order.total_amount))
        )
        total_revenue = revenue_result.scalar()

        platform_balance = float(total_revenue) if total_revenue else 0.0

        total_wallet_balance = await self.session.scalar(
            select(func.sum(Wallet.balance))
        )

        total_earned = await self.session.scalar(
            select(func.sum(Wallet.total_earned))
        )

        return {
            "total_users": total_users,
            "total_sellers": total_sellers,
            "pending_sellers": total_pending_seller,
            "suspended_sellers": total_suspend_seller,
            "total_orders": total_orders,
            "financial": {
                "total_revenue": round(float(total_revenue) if total_revenue else 0.0, 2),
                "platform_balance": round(platform_balance, 2),
                "total_wallet_balance": round(float(total_wallet_balance) if total_wallet_balance else 0.0, 2),
                "total_earned_by_sellers": round(float(total_earned) if total_earned else 0.0, 2),
                "paid_withdrawals": 0,
                "pending_withdrawals": 0,
            },
        }

    async def get_pending_sellers(self, admin: User):
        stmt = select(Seller).where(Seller.approved == False)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_suspended_sellers(self, admin: User):
        stmt = select(Seller).where(Seller.is_suspended == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_approved_sellers(self, admin: User):
        stmt = select(Seller).where(Seller.approved == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_all_sellers(self, admin: User):
        stmt = select(Seller)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def unsuspend_seller(self, admin: User, seller_id: int):
        stmt = select(Seller).where(Seller.id == seller_id)
        result = await self.session.execute(stmt)
        seller = result.scalar_one_or_none()
        if not seller:
            return None
        seller.is_suspended = False
        await self.session.commit()
        return seller

    async def get_sellers_financials(self, admin: User):
        stmt = select(Seller).options(
            selectinload(Seller.wallet),
            selectinload(Seller.orders)
        )
        result = await self.session.execute(stmt)
        sellers = result.scalars().all()
        financials = []
        for seller in sellers:
            wallet = seller.wallet
            financials.append({
                "seller_id": seller.id,
                "seller_name": seller.name,
                "total_earned": float(wallet.total_earned) if wallet else 0.0,
                "wallet_balance": float(wallet.balance) if wallet else 0.0,
                "total_orders": len(seller.orders) if seller.orders else 0,
            })
        return financials

    async def save(self, seller: Seller):
        self.session.add(seller)
        await self.session.flush()