import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import init_db
from app.api import upload, summary, voice
from app.api import quiz, qa
from app.rag.vectordb import cleanup_stale_collections

logger = logging.getLogger(__name__)
settings = get_settings()

# Run cleanup once every 24 hours
_CLEANUP_INTERVAL_SECONDS = settings.COLLECTION_TTL_DAYS * 24 * 60 * 60


async def _ttl_cleanup_loop() -> None:
    """Background task: delete stale collections every 24 hours."""
    while True:
        try:
            deleted = await asyncio.to_thread(cleanup_stale_collections)
            if deleted:
                logger.info("TTL cleanup sweep: deleted %d collection(s).", deleted)
        except Exception:
            logger.exception("TTL cleanup sweep raised an unexpected error.")
        await asyncio.sleep(_CLEANUP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME}")
    init_db()
    print("Server ready")

    # Kick off the background cleanup task
    cleanup_task = asyncio.create_task(_ttl_cleanup_loop())
    logger.info(
        "TTL cleanup task started (interval=24h, ttl=%d day(s)).",
        settings.COLLECTION_TTL_DAYS,
    )

    yield

    # Gracefully cancel on shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    print("Server shutting down")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(summary.router, prefix="/api/summary", tags=["Summary"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(qa.router, prefix="/api/qa", tags=["Q&A"])


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
