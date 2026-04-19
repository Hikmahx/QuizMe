from fastapi import Header, HTTPException
from app.core.config import get_settings

settings = get_settings()


def verify_content_type(content_type: str = Header(default="application/json")):

    if "application/json" not in content_type:
        raise HTTPException(
            status_code=400,
            detail="Content-Type must be application/json",
        )