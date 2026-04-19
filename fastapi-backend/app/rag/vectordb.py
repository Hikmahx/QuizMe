import hashlib
from sqlalchemy.sql import func
from app.core.database import SessionLocal, DocumentCollection, DocumentChunk

def make_collection_id(files: list[dict]) -> str:
    raw = "".join(file["name"] + str(len(file["dataUrl"])) for file in files)
    return hashlib.md5(raw.encode()).hexdigest()[:16]

def collection_exists(collection_id: str) -> bool:
    with SessionLocal() as db:
        return db.get(DocumentCollection, collection_id) is not None

def register_collection(collection_id: str, file_fingerprint: str):
    with SessionLocal() as db:
        db.add(DocumentCollection(id=collection_id, file_fingerprint=file_fingerprint))
        db.commit()

def touch_collection(collection_id: str):
    with SessionLocal() as db:
        row = db.get(DocumentCollection, collection_id)
        if row:
            row.last_accessed = func.now()
            db.commit()

def store_chunks(collection_id: str, chunks: list[dict]):
    with SessionLocal() as db:
        for chunk in chunks:
            db.add(DocumentChunk(
                collection_id=collection_id,
                doc_name=chunk["doc_name"],
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                embedding=chunk["embedding"]
            ))
        db.commit()