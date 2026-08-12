import numpy as np
from app.semantic_search.embeddings import generate_embeddings
from app.semantic_search.embeddings_repo import EmbeddingsRepo

async def retrieve_similar_products(session, query: str, top_k: int = 5):
    query_embedding = (await generate_embeddings([query], input_type="search_query"))[0]
    
    embeddings_repo = EmbeddingsRepo(session)
    similar_products = await embeddings_repo.similarity_search(query_embedding, top_k)
    
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "score": float(
                np.dot(np.array(p.embeddings), np.array(query_embedding)) 
                / (np.linalg.norm(np.array(p.embeddings)) * np.linalg.norm(np.array(query_embedding)))
            )
        }
        for p in similar_products
    ]