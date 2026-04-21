from pydantic import BaseModel
from typing import Literal


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
    correctIndex: int | None             = None  # 0-based index into options (MCQ only)


class GenerateResponse(BaseModel):
    questions: list[GeneratedQuestion]
    source:    str = "ai"   # "ai" or "mock" — frontend shows a notice if "mock"


class AnswerToEvaluate(BaseModel):
    question:      str
    user_answer:   str
    # For MCQ: the text of the correct option (e.g. "Retrieval-Augmented Generation")
    # For theory: empty string — the grader uses the document context instead
    correct_answer: str = ""
    question_type:  Literal["mcq", "theory"]


class EvaluateRequest(BaseModel):
    # collection_id is optional — if absent, grades without document context
    collection_id: str | None = None
    answers:       list[AnswerToEvaluate]


# Evaluation response

class QuizFeedback(BaseModel):
    correct:     bool
    # Percentage 0-100 used for both MCQ and theory:
    #   MCQ:    100 if correct, 0 if wrong
    #   Theory: 0-100 based on accuracy and completeness
    # Percentage is more intuitive than a 0-5 scale — "60%" is immediately understood.
    score_pct:   int
    explanation: str
    tip:         str


class EvaluateResponse(BaseModel):
    feedbacks: list[QuizFeedback]
    # Overall score as a percentage across all questions
    overall_pct: int
