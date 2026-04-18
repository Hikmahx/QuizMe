from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # change all to lowercase
    
    app_name: str = "QuizMe API"
    app_version: str = "1.0.0"
    debug: bool = False
    allowed_origins: list[str] = ["http://localhost:3000"]
    database_url: str
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    groq_max_token: int = 2048
    groq_temperature: float = 0.3
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    chunk_size: int = 1000
    chunk_overlap: int = 100

    # How many chunks to return when searching (like SQL LIMIT)
    retrieval_top_k: int = 5
    # For quiz generation we want broader coverage of the document
    retrieval_top_k_broad: int = 15

    # Chunks are deleted if not accessed for this many days
    collection_ttl_days: int = 3
    cleanup_interval_hours: int = 6

    max_file_size_mb: int = 20
    max_files_per_session: int = 10
    allowed_mime_types: list[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache
def get_settings() -> Settings:
    return Settings()