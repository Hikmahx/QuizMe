from fastapi import APIRouter, HTTPException
from app.schemas.summary import UploadRequest, UploadResponse
from app.services.upload_service import index_files
from app.core.config import get_settings

settings = get_settings()

router = APIRouter()


@router.post("/", response_model=UploadResponse)
def upload_documents(body: UploadRequest):

    # Validation
    if not body.files:
        raise HTTPException(status_code=400, detail="No files provided")

    if len(body.files) > settings.MAX_FILES_PER_SESSION:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_FILES_PER_SESSION} files per session",
        )

    for file in body.files:
        if file.type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"File type '{file.type}' is not supported. "
                       f"Allowed: PDF, DOCX, TXT, MD",
            )

        # Base64 inflates size by ~33%, so actual bytes ≈ len(dataUrl) * 0.75
        approx_mb = len(file.dataUrl) * 0.75 / (1024 * 1024)
        if approx_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=f"File '{file.name}' is too large ({approx_mb:.1f}MB). "
                       f"Maximum: {settings.MAX_FILE_SIZE_MB}MB",
            )

    try:
        result = index_files(body.files)
    except ValueError as e:
        # ValueError is raised by our extractors for unsupported/corrupt files
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index files: {str(e)}")

    return UploadResponse(
        collection_id=result["collection_id"],
        files_indexed=result["files_indexed"],
        total_chunks=result["total_chunks"],
        message="Files indexed successfully" if not result["cached"] else "Files already indexed",
    )