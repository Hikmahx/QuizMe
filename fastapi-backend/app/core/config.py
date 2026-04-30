from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "QuizMe API"
    DEBUG: bool = False
    ALLOWED_ORIGINS_STR: str = "http://localhost:3000"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS_STR.split(",") if o.strip()]
    DATABASE_URL: str

    # LLM providers
    # Comma-separated preference order. The router tries each in order,
    # skipping any whose API key is blank, falling back on rate-limit/error.
    LLM_PROVIDER_ORDER_STR: str = "groq,cerebras,mistral,gemini"

    GROQ_API_KEY:     str = ""
    GROQ_MODEL:       str = "llama-3.3-70b-versatile"

    MISTRAL_API_KEY:  str = ""
    MISTRAL_MODEL:    str = "mistral-large-latest"

    GEMINI_API_KEY:   str = ""
    GEMINI_MODEL:     str = "gemini-2.0-flash"

    CEREBRAS_API_KEY: str = ""
    CEREBRAS_MODEL:   str = "llama3.1-8b"

    # Separate token budgets:
    # Generation needs more tokens to output 10-30 structured questions.
    # Grading needs fewer — each feedback item is ~80-120 tokens.
    LLM_TEMPERATURE:        float = 0.3
    LLM_MAX_TOKENS:         int   = 4096   # used for generation
    LLM_MAX_TOKENS_GRADING: int   = 2048   # used for batch grading (overrides per call)

    # Embedding & RAG
    EMBEDDING_MODEL:       str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIMENSION:   int = 384
    CHUNK_SIZE:            int = 1000
    CHUNK_OVERLAP:         int = 100
    RETRIEVAL_TOP_K:       int = 3   # per-question context (lower = faster grading)
    RETRIEVAL_TOP_K_BROAD: int = 15  # whole-document scan for generation

    # Upload
    MAX_FILE_SIZE_MB:      int = 20
    MAX_FILES_PER_SESSION: int = 10
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/markdown",
    ]

    # Voice
    ASSEMBLYAI_API_KEY: str = ""
    WHISPER_MODEL_SIZE: str = "base"
    CARTESIA_API_KEY:   str = ""
    CARTESIA_VOICE_ID:  str = "a0e99841-438c-4a64-b679-ae501e7d6091"
    EDGE_TTS_VOICE:     str = "en-US-JennyNeural"

    @property
    def LLM_PROVIDER_ORDER(self) -> List[str]:
        return [p.strip() for p in self.LLM_PROVIDER_ORDER_STR.split(",") if p.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()
