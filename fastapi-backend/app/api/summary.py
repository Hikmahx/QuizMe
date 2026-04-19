from fastapi import APIRouter, HTTPException
from app.schemas.summary import SummaryRequest, SummaryResponse
from app.services.summary_service import generate_summary

router = APIRouter()


@router.post("/", response_model=SummaryResponse)
def summarise_documents(body: SummaryRequest):
    if not body.files:
        raise HTTPException(status_code=400, detail="No files provided")

    try:
        result = generate_summary(
            files=body.files,
            length=body.length,
            style=body.style,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")

    return SummaryResponse(**result)