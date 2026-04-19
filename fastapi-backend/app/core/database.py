from contextlib import contextmanager
from sqlalchemy import (
    Column, ForeignKey, Integer, String, Text, DateTime, Index,
    create_engine, text
)
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.sql import func

from app.core.config import get_settings

settings = get_settings()

# Engine + session factory

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # drops stale connections before reuse
    echo=False,           # set True to log all SQL
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Declarative base

class Base(DeclarativeBase):
    pass


# ORM models
class DocumentCollection(Base):
    """
    Tracks which sets of files have been indexed.
    collection_id = a short hash generated from the file names + sizes.
    Same files → same collection_id → reuse existing embeddings.
    """
    __tablename__ = "document_collections"

    id               = Column(String(16), primary_key=True)
    file_fingerprint = Column(Text, nullable=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    last_accessed    = Column(DateTime(timezone=True), server_default=func.now())


class DocumentChunk(Base):
    """
    Stores the actual text chunks and their vector embeddings.
    embedding = a list of 384 floats produced by the embedding model.
    """
    __tablename__ = "document_chunks"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    collection_id = Column(
        String(16),
        ForeignKey("document_collections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    doc_name      = Column(Text, nullable=False)
    chunk_index   = Column(Integer, nullable=False)
    content       = Column(Text, nullable=False)
    embedding     = Column(Vector(384))           # requires pgvector.sqlalchemy
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    # ivfflat approximate-nearest-neighbour index (cosine distance)
    # Equivalent to the manual CREATE INDEX in the old code.
    __table_args__ = (
        Index(
            "document_chunks_embedding_idx",
            "embedding",
            postgresql_using="ivfflat",
            postgresql_with={"lists": 100},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )


# Session context manager

@contextmanager
def get_db():
    """
    Yields a SQLAlchemy Session and handles commit / rollback / close.

    Usage:
        with get_db() as db:
            db.add(some_model_instance)
            # commit happens automatically on exit

    For FastAPI dependency injection, use get_db_dependency() instead.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_dependency():
    """
    FastAPI-compatible generator for use with Depends().

    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db_dependency)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# Initialisation
def init_db():
    """
    Enables the pgvector extension and creates all tables + indexes.
    Safe to call on every startup — all statements are IF NOT EXISTS.
    """
    # pgvector must be enabled before SQLAlchemy tries to create the Vector column
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()

    # Creates every table that inherits from Base (if it doesn't exist yet)
    Base.metadata.create_all(bind=engine)

    print("Database initialised successfully")