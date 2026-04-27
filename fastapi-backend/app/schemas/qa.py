from pydantic import BaseModel
from typing import Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class QAChatRequest(BaseModel):
    collection_id: str
    mode: Literal["default", "resume", "compare", "glossary"] = "default"
    messages: list[ChatMessage]



class QAAnalyzeRequest(BaseModel):
    collection_id: str
    mode: Literal["resume", "compare", "glossary"]
    file_names: list[str] = [] # file names are needed for the compare table headers


# Auto mode detection

class QADetectRequest(BaseModel):
    collection_id: str
    file_names: list[str]


class QADetectResponse(BaseModel):
    # "resume" | "compare" | null
    suggestion: str | None = None
    reason: str = ""