from sentence_transformers import SentenceTransformer
from app.core.config import get_settings

settings = get_settings()

model = SentenceTransformer(settings.EMBEDDING_MODEL)


def get_embedding(text: str) -> list[float]:
    """
    Convert a single piece of text into an embedding vector.
    Returns a list of numbers (e.g., 1536 floats).
    """
    return model.encode(text).tolist()


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Convert multiple texts at once (more efficient than calling one by one).
    """
    return model.encode(texts).tolist()

def embed_chunks(chunks: list[dict]) -> list[dict]:
    """Add an 'embedding' field to each chunk dict."""
    texts = [c["content"] for c in chunks]
    embeddings = model.encode(texts).tolist()
    for chunk, emb in zip(chunks, embeddings):
        chunk["embedding"] = emb
    return chunks