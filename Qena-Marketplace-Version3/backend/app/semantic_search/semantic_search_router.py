from app.semantic_search.retriver import retrieve_similar_products
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

SM_router = APIRouter()
@SM_router.post("/search")
async def search_similar_products(query: str, top_k: int = 5, session: AsyncSession = Depends(get_db)):
    """Search for similar products based on a query string."""
    return await retrieve_similar_products(session, query, top_k)
