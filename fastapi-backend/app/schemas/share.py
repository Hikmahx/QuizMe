from pydantic import BaseModel, EmailStr


class EmailShareRequest(BaseModel):
    to: EmailStr
    summary: str
    doc_name: str | None = None
    sender_name: str | None = None
    recipient_name: str | None = None


class EmailShareResponse(BaseModel):
    success: bool
    message: str
