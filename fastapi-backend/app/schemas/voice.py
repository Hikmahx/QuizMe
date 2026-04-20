from pydantic import BaseModel


class AnswerRequest(BaseModel):
    question: str
    collection_id: str


class SpeakRequest(BaseModel):
    text: str
