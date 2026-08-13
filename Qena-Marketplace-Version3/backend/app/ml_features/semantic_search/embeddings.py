from app.core.config import settings
import cohere 

co = cohere.AsyncClient(api_key=settings.EMBEDDING_API_KEY)

async def generate_embeddings(
    texts: list[str], 
    model: str = None, 
    input_type: str = "search_document"
) -> list[list[float]]:
    model = model or settings.EMBEDDING_MODEL
    response = await co.embed(
        texts=texts,
        model=model,
        input_type=input_type
    )
    return response.embeddings