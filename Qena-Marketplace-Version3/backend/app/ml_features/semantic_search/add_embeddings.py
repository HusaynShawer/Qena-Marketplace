import asyncio
from sqlalchemy import select
from app.models.product import Product
from app.ml_features.semantic_search.embeddings import generate_embeddings
from app.core.database import AsyncSessionLocal


async def add_embeddings_to_products() -> None:
    """Add embeddings to products in the database."""
    async with AsyncSessionLocal() as session:
        stmt = select(Product).where(Product.embeddings.is_(None))
        result = await session.execute(stmt)
        products_without_embeddings = result.scalars().all()

        if not products_without_embeddings:
            print("No products without embeddings found.")
            return

        print(f"Starting to add embeddings to {len(products_without_embeddings)} products...")

        for i in range(0, len(products_without_embeddings), 10):
            batch = products_without_embeddings[i:i + 10]
            texts = []
            valid_products = []

            for product in batch:
                text = f"{product.name} {product.description or ''}".strip()
                if not text:
                    print(f"Skipping product {product.id} due to empty name and description.")
                    continue
                texts.append(text)
                valid_products.append(product)

            if not texts:
                continue

            try:
                embeddings = await generate_embeddings(texts)
                for product, embedding in zip(valid_products, embeddings):
                    product.embeddings = embedding

                await session.commit()
                print(f"Added embeddings for batch starting at index {i}.")
            except Exception as exc:
                print(f"Error generating embeddings for batch starting at index {i}: {exc}")
                await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_embeddings_to_products())