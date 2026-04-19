import hashlib
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from app.core.database import SessionLocal, DocumentCollection, DocumentChunk


def make_collection_id(files: list[dict]) -> str:
    raw = "".join(file["name"] + str(len(file["dataUrl"])) for file in files)
    return hashlib.md5(raw.encode()).hexdigest()[:16]


def collection_exists(collection_id: str) -> bool:
    db = SessionLocal()
    try:
        item = db.get(DocumentCollection, collection_id)
        return item is not None
    finally:
        db.close()


def register_collection(collection_id: str, file_fingerprint: str):
    db = SessionLocal()
    try:
        row = DocumentCollection(id=collection_id, file_fingerprint=file_fingerprint)
        db.add(row)
        db.commit()
    except IntegrityError:
        db.rollback()
    finally:
        db.close()


def touch_collection(collection_id: str):
    db = SessionLocal()
    try:
        row = db.get(DocumentCollection, collection_id)
        if row:
            row.last_accessed = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


def store_chunks(collection_id: str, chunks: list[dict]):
    db = SessionLocal()
    try:
        records = [
            DocumentChunk(
                collection_id=collection_id,
                doc_name=chunk["doc_name"],
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                embedding=chunk["embedding"],
            )
            for chunk in chunks
        ]
        db.add_all(records)
        db.commit()
    finally:
        db.close()
