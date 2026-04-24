from pydantic import BaseModel
from typing import Literal, Optional


class QuizGenerateRequest(BaseModel):
    collection_id:  str
    difficulty:     Literal["easy", "medium", "hard"]
    question_type:  Literal["mcq", "theory"]
    question_count: Literal[10, 20, 30]


class MCQOption(BaseModel):
    letter: str   # "A", "B", "C", "D"
    text:   str


class GeneratedQuestion(BaseModel):
    id:           int
    text:         str
    options:      list[MCQOption] | None = None  # MCQ only
    correctIndex: int | None             = None  # 0-based index (MCQ only)


class GenerateResponse(BaseModel):
    questions: list[GeneratedQuestion]
    source:    str = "ai"   # "ai" or "mock"


class AnswerToEvaluate(BaseModel):
    question:      str
    user_answer:   str = ""    # typed/spoken text for theory; selected option text for MCQ
    correct_answer: str = ""    # correct option text (MCQ only); empty for theory
    question_type:  Literal["mcq", "theory"]


class EvaluateRequest(BaseModel):
    collection_id: Optional[str] = None   # if absent, grades without document context
    answers:       list[AnswerToEvaluate]


class QuizFeedback(BaseModel):
    correct:     bool
    score_pct:   int    # 0-100; MCQ = 100 or 0; theory = 0-100
    explanation: str
    tip:         str


class EvaluateResponse(BaseModel):
    feedbacks: list[QuizFeedback]
    overall_pct: int    # average score_pct across all questions
