from app.core.database import SessionLocal, DocumentChunk
from app.rag.embedder import get_embedding
from app.core.config import get_settings

settings = get_settings()


def retrieve_chunks(collection_id: str, query: str, top_k: int | None = None) -> list[dict]:
    """
    The core of RAG: given a user's query, find the most relevant document chunks.

    How it works:
    1. Convert the query to an embedding (same model as we used for chunks)
    2. Ask PostgreSQL: "find me the top_k rows in document_chunks whose
       embedding is closest (by cosine distance) to the query embedding"
    3. Return those rows as a list of dicts

    The <=> operator is pgvector's cosine distance operator.
    ORDER BY embedding <=> query_vec sorts by similarity (closest first).

    Args:
        collection_id: Which set of files to search.
        query:         The user's question or topic.
        top_k:         How many chunks to return. Defaults to config value.

    Returns:
        [
            {"content": "...", "doc_name": "notes.pdf", "chunk_index": 2},
            ...
        ]
    """
    if top_k is None:
        top_k = settings.RETRIEVAL_TOP_K
    # Convert the query to an embedding using the same model
    query_embedding = get_embedding(query)

    db = SessionLocal()

    try:
        rows = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.collection_id == collection_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
            .all()
        )

        return [
            {
                "content": row.content,
                "doc_name": row.doc_name,
                "chunk_index": row.chunk_index
            }
            for row in rows
        ]

    finally:
        db.close()


def retrieve_all_chunks(collection_id: str) -> list[dict]:
    """
    Returns ALL chunks for a collection without similarity filtering.
    Used for operations that need the full document context,
    like summary generation (you want the whole document, not just part of it).
    """
    db = SessionLocal()

    try:
        rows = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.collection_id == collection_id)
            .order_by(DocumentChunk.doc_name, DocumentChunk.chunk_index)
            .all()
        )

        return [
            {
                "content": row.content,
                "doc_name": row.doc_name,
                "chunk_index": row.chunk_index
            }
            for row in rows
        ]

    finally:
        db.close()