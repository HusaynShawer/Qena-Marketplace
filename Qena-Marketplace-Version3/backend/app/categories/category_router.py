from fastapi import APIRouter,Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Category,User
from app.categories.category_service import CategoryService
from app.Helper.helper_func import raise_not_found,raise_bad_request,require_admin
from uuid import UUID
from app.dependencies.auth import get_current_user,get_db
from app.schemas.category import catrequest

category_router = APIRouter(prefix="/category",tags=["Category"])

@category_router.get("/get_all")
async def list_categories(db: AsyncSession = Depends(get_db)):
    cat_service = CategoryService(db)
    return await cat_service.get_all()

@category_router.post("/add_categroy")
async def add_category(cat:catrequest,current_user:User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cat_service = CategoryService(db)
    category = await cat_service.add(current_user=current_user,cat = cat)
    return category

