from pydantic import BaseModel, field_validator
from typing import Literal


class FilePayload(BaseModel):
    """
    Represents a single file sent from the frontend.
    The frontend sends these as base64 data URLs stored in localStorage.
    """
    name: str
    type: str    # MIME type, e.g. "application/pdf"
    dataUrl: str # "data:application/pdf;base64,JVBERi0x..."

    @field_validator("dataUrl")
    @classmethod
    def must_have_data(cls, v: str) -> str:
        """
        Pydantic validators run automatically during object creation.
        This is like a Mongoose custom validator.
        """
        if not v or len(v) < 100:
            raise ValueError("dataUrl appears to be empty or invalid")
        return v


class UploadRequest(BaseModel):
    """The JSON body for POST /api/upload"""
    files: list[FilePayload]


class UploadResponse(BaseModel):
    """What the upload endpoint returns"""
    collection_id: str
    files_indexed: int
    total_chunks: int
    message: str


# Summary Schemas 

class SummaryRequest(BaseModel):
    """The JSON body for POST /api/summary"""
    files: list[FilePayload]
    length: Literal["short", "medium", "long"] = "medium"
    style: Literal["default", "combined", "doc-by-doc"] = "default"


class SingleSummary(BaseModel):
    """Summary for one document"""
    doc_name: str
    summary: str


class SummaryResponse(BaseModel):
    """What the summary endpoint returns"""
    collection_id: str
    style: str
    summaries: list[SingleSummary]
    # If the AI detects docs are unrelated in 'combined' mode,
    # it sets this to True and the frontend falls back to doc-by-doc
    fallback: bool = False