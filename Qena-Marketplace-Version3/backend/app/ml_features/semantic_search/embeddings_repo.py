from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.product import Product

class EmbeddingsRepo:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def bulk_insert(self, embeddings_data: list[dict]) -> None:
        products = [Product(**data) for data in embeddings_data]
        self.session.add_all(products)
        await self.session.commit()

    async def similarity_search(self, query_embedding: list[float], top_k: int = 5) -> list[Product]:
        stmt = select(Product).order_by(
            Product.embeddings.cosine_distance(query_embedding)
        ).limit(top_k)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())