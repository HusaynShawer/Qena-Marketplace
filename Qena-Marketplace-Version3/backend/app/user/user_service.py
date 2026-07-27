from sqlalchemy.ext.asyncio import AsyncSession
from app.Helper.helper_func import raise_not_found,raise_bad_request,raise_forbidden
from app.user.user_repo import UserRepository
from app.models.user import User
from uuid import UUID


class UserService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session=session)

    async def create_user(self,user:User):
        existing_user = await self.user_repo.get_by_email(email=user.email)
        if existing_user:
            raise_bad_request("Email already registered")
        await self.user_repo.create(user)

    async def get_user(self,user_id:UUID)->User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise_not_found("user not exists")
        return user
    
    async def get_profile(self,current_user:User)->User:
        # current_user.id is a UUID object already (SQLAlchemy `UUID(as_uuid=True)`)
        user = await self.user_repo.get_by_id(current_user.id)
        if not user:
            raise_not_found("user not exists")
        return user
    
    async def get_all(self,current_user:User)->list[User]:
        if current_user.role.lower() !="admin":
            raise_forbidden(
                "Admin Only can access all sellers"
            )
        users = await self.user_repo.get_all()
        return users

    async def delete(self,current_user:User,seller_id:UUID):
        if current_user.role.lower() !="admin":
            raise_forbidden(
                "Admin Only can delete sellers"
            )
        user = await self.user_repo.get_by_id(seller_id)
        if not user:
            raise_not_found("user not exists")
        await self.user_repo.delete(user)

    async def get_by_email(self, email: str) -> User | None:
        return await self.user_repo.get_by_email(email=email)

    # TODO next features
    # update Profile