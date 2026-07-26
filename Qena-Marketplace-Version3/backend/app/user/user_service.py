from sqlalchemy.ext.asyncio import AsyncSession
from app.Helper.helper_func import raise_not_found,raise_bad_request,raise_forbidden
from app.user.user_repo import UserRepository
from app.models.user import User


class UserService:
    def __init__(self,session:AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session=session)


    async def get_user(self,user_id:str)->User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise_not_found("user not exists")
        return user
    
    async def get_profile(self,current_user:User)->User:
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

    async def delete(self,current_user:User,seller_id:str):
        if current_user.role.lower() !="admin":
            raise_forbidden(
                "Admin Only can delete sellers"
            )
        user = await self.user_repo.get_by_id(seller_id=seller_id)
        if not user:
            raise_not_found("user not exists")
        await self.user_repo.delete(seller_id=seller_id)

    # TODO next features
    # update Profile