import logging
from fastapi import APIRouter, HTTPException

from app.schemas.quiz import (QuizGenerateRequest, GenerateResponse, EvaluateRequest, EvaluateResponse,)
from app.services.quiz_service import generate_quiz, evaluate_answers

logger = logging.getLogger(__name__)
router = APIRouter()


# POST /api/quiz/generate/  — generates questions from uploaded documents
@router.post("/generate/", response_model=GenerateResponse)
def create_quiz(data: QuizGenerateRequest):
    """
    Generate quiz questions from a document collection using the Quiz Generator agent.

    Flow:
      1. Retrieve broad document context from Supabase via RAG
      2. Pass context + settings to the Quiz Generator agent (CrewAI)
      3. Parse and validate the JSON questions
      4. Return structured QuizQuestion objects the frontend renders directly

    Falls back to a 422 error if the collection has no content or generation fails.
    The frontend catches this and falls back to mock questions — the quiz never breaks.
    """
    try:
        questions = generate_quiz(
            collection_id=data.collection_id,
            difficulty=data.difficulty,
            count=data.question_count,
            question_type=data.question_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    return GenerateResponse(questions=questions, source="ai")


# POST /api/quiz/evaluate/  — grades answers and returns feedback with percentages
@router.post("/evaluate/", response_model=EvaluateResponse)
def evaluate_quiz(data: EvaluateRequest):
    """
    Grade all quiz answers using the Quiz Grader agent.

    Flow per question:
      1. Retrieve the most relevant document chunk for this question (RAG)
      2. Pass question + answer + context to the Quiz Grader agent (CrewAI)
      3. Parse the JSON feedback: correct, score_pct, explanation, tip

    score_pct is a percentage (0-100) for both MCQ and theory:
      MCQ:    100 if correct, 0 if wrong
      Theory: 0-100 based on accuracy and completeness (>= 60 = correct)

    Using percentage instead of 0-5 because:
      - "60%" is immediately understood by anyone; "3/5" requires mental translation
      - Aligns with MCQ scoring for a consistent display in the FeedbackCard
    """
    if not data.answers:
        raise HTTPException(status_code=400, detail="No answers provided")

    try:
        feedbacks, overall_pct = evaluate_answers(
            answers=[a.model_dump() for a in data.answers],
            collection_id=data.collection_id,
        )
    except Exception as e:
        logger.error("Evaluation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    return EvaluateResponse(feedbacks=feedbacks, overall_pct=overall_pct)
