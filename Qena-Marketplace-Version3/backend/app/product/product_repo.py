from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Product, Category


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, product: Product) -> Product:
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def get_by_id(self, product_id: UUID) -> Product | None:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(Product.id == product_id, Product.is_active == True)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ids(self, product_ids: list[UUID]) -> list[Product]:
        if not product_ids:
            return []

        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(Product.id.in_(product_ids), Product.is_active == True)
        )
        result = await self.session.execute(stmt)
        order_map = {product_id: index for index, product_id in enumerate(product_ids)}
        products = list(result.scalars().all())
        return sorted(products, key=lambda p: order_map.get(p.id, len(product_ids)))        

    async def get_by_seller(self, seller_id: UUID) -> list[Product]:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(Product.seller_id == seller_id, Product.is_active == True)
        )
        results = await self.session.execute(stmt)
        return results.scalars().all()

    async def get_all(
        self,
        limit: int | None = None,
        search: str | None = None,
        category: str | None = None
    ) -> list[Product]:
     
        conditions = [Product.is_active == True]

        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                (Product.name.ilike(search_pattern)) |
                (Product.description.ilike(search_pattern))
            )

        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
                selectinload(Product.reviews),
            )
            .where(*conditions)
        )

        if category:
            stmt = stmt.join(Product.category).where(Category.name.ilike(category))

        stmt = stmt.order_by(Product.created_at.desc())

        if limit:
            stmt = stmt.limit(limit)

        results = await self.session.execute(stmt)
        return results.scalars().all()

    async def update(self, product: Product) -> Product:
        return await self.save(product)

    async def delete(self, product: Product) -> None:
        await self.session.delete(product)
        await self.session.flush()

    async def get_by_name(self, product_name: str) -> list[Product] | None:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(Product.name.like(f"%{product_name}%"))
        )
        products = await self.session.execute(stmt)
        return products.scalars().all()

    async def get_by_ids_with_embeddings(
        self,
        product_ids: list[UUID],
    ) -> list[Product]:
        if not product_ids:
            return []

        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(
                Product.id.in_(product_ids),
                Product.is_active == True,
                Product.embeddings.isnot(None),
            )
        )
        result = await self.session.execute(stmt)
        order_map = {pid: idx for idx, pid in enumerate(product_ids)}
        products = list(result.scalars().all())
        return sorted(products, key=lambda p: order_map.get(p.id, len(product_ids)))

    async def get_similar_by_embedding(
        self,
        query_vector: list[float],
        exclude_ids: list[UUID],
        limit: int = 20,
    ) -> list[Product]:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.seller),
            )
            .where(
                Product.is_active == True,
                Product.embeddings.isnot(None),
                Product.id.notin_(exclude_ids) if exclude_ids else True,
            )
            .order_by(Product.embeddings.cosine_distance(query_vector))
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, product: Product) -> Product:
        await self.session.flush()
        await self.session.refresh(product)
        return product