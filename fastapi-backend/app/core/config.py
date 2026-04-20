from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):

    APP_NAME: str = "QuizMe API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    DATABASE_URL: str

    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MAX_TOKENS: int = 2048
    GROQ_TEMPERATURE: float = 0.3

    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 100

    # How many chunks to return when searching (like SQL LIMIT)
    RETRIEVAL_TOP_K: int = 5
    # For quiz generation we want broader coverage of the document
    RETRIEVAL_TOP_K_BROAD: int = 15

    # Chunks are deleted if not accessed for this many days
    COLLECTION_TTL_DAYS: int = 3
    CLEANUP_INTERVAL_HOURS: int = 6

    MAX_FILE_SIZE_MB: int = 20
    MAX_FILES_PER_SESSION: int = 10
    ALLOWED_MIME_TYPES: list[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ]

    # Voice: STT
    # Leave empty ("") to use faster-whisper locally instead
    ASSEMBLYAI_API_KEY: str = ""
    # faster-whisper model: "tiny", "base", "small", "medium", "large-v3"
    # "base" is a good balance of speed and accuracy on CPU
    WHISPER_MODEL_SIZE: str = "base"

    # Voice: Text-to-Speech
    # Leave empty ("") to use Edge TTS instead
    CARTESIA_API_KEY: str = ""

    # Cartesia voice ID — find more in their dashboard
    CARTESIA_VOICE_ID: str = "a0e99841-438c-4a64-b679-ae501e7d6091"

    # Edge TTS voice — used when Cartesia key is not set or fails.
    # Free, no API key, same neural engine as Azure Cognitive Services.
    # Run `edge-tts --list-voices` to see all available voices.
    EDGE_TTS_VOICE: str = "en-US-JennyNeural"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()
