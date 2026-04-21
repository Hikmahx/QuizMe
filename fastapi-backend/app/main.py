from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import init_db
from app.api import upload, summary, voice
from app.api import quiz

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME}")
    init_db()
    print("Server ready")
    yield
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


@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
