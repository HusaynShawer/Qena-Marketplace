from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.product import ProductResponse
from app.ml_features.recommendation.recommendation_service import RecommendationService
import logging

logger = logging.getLogger(__name__)
recommendation_router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@recommendation_router.get("/", response_model=list[ProductResponse])
async def get_recommendations(
    page: int = Query(default=1, ge=1, description="رقم الصفحة"),
    per_page: int = Query(default=20, ge=1, le=100, description="عدد المنتجات في الصفحة"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    service = RecommendationService(db)
    
    limit = page * per_page
    all_candidates = await service.get_recommendations(
        user_id=current_user.id,
        limit=limit,
    )
    
    # Pagination Logic
    start = (page - 1) * per_page
    end = start + per_page
    
    return all_candidates[start:end]


# Trending: Pagination
@recommendation_router.get("/trending", response_model=list[ProductResponse])
async def get_trending(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    days: int = Query(default=7, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
  
    service = RecommendationService(db)
    # نجيب الـ Trending Strategy مباشرة
    from app.ml_features.recommendation.strategies.trending import TrendingStrategy
    from app.interactions.interaction_service import InteractionService
    from app.product.product_repo import ProductRepository
    
    interaction_service = InteractionService(db)
    product_repo = ProductRepository(db)
    
    trending = TrendingStrategy(
        interaction_service=interaction_service,
        product_repository=product_repo,
        days=days,
    )
    
    limit = page * per_page
    candidates = await trending.get_candidates(
        user_id=UUID("00000000-0000-0000-0000-000000000000"),
        limit=limit,
    )
    
    start = (page - 1) * per_page
    return candidates[start:start + per_page]


#You May Also Like:
@recommendation_router.get("/similar/{product_id}", response_model=list[ProductResponse])
async def get_similar_products(
    product_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):

    from app.product.product_repo import ProductRepository
    
    product_repo = ProductRepository(db)
    
    product = await product_repo.get_by_id(product_id)
    if not product or not product.embeddings:
        return await product_repo.get_by_category(
            category_id=product.category_id if product else None,
            limit=limit,
        )
    
    similar = await product_repo.get_similar_by_embedding(
        query_vector=product.embeddings,
        exclude_ids=[product_id],
        limit=limit,
    )
    
    return similar


@recommendation_router.post("/interactions")
async def log_interaction(
    product_id: UUID,
    interaction_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    valid = {"view", "click", "purchase", "cart_add"}
    itype = interaction_type.lower()
    if itype not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid. Choose from: {valid}")
    
    service = RecommendationService(db)
    try:
        await service.log_interaction(current_user.id, product_id, itype)
        return {"message": "Interaction logged"}
    except Exception as exc:
        logger.error(f"log_interaction failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to log interaction")

    