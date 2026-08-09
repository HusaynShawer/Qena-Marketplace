from sqlalchemy.ext.asyncio import AsyncSession
from app.Helper.helper_func import raise_not_found, raise_bad_request, raise_forbidden
from app.user.user_repo import UserRepository
from app.models.user import User
from uuid import UUID

class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session=session)

    async def create_user(self, user: User):
        existing_user = await self.user_repo.get_by_email(email=user.email)
        if existing_user:
            raise_bad_request("Email already registered")
        await self.user_repo.create(user)

    async def get_by_id(self, user_id: UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise_not_found("User not found")
        return user
    
    async def get_profile(self, current_user: User) -> User:
        user = await self.user_repo.get_by_id(current_user.id)
        if not user:
            raise_not_found("User not found")
        return user
    
    async def get_all(self, current_user: User) -> list[User]:
        if current_user.role.value != "admin":
            raise_forbidden("Admin only can access all users")
        return await self.user_repo.get_all()

    async def delete(self, current_user: User, seller_id: UUID):
        if current_user.role.value != "admin":
            raise_forbidden("Admin only can delete users")
        user = await self.user_repo.get_by_id(seller_id)
        if not user:
            raise_not_found("User not found")
        await self.user_repo.delete(user)

    async def get_by_email(self, email: str) -> User | None:
        return await self.user_repo.get_by_email(email=email)
    
    async def update_user(self, user: User) -> User:
        """Save/update existing user."""
        return await self.user_repo.save(user)