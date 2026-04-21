"""
quiz_service.py — Business logic layer connecting RAG retrieval to the CrewAI agents.

This sits between the API route and the agent crew.
It handles:
  1. Fetching document content from Supabase via RAG
  2. Calling the generation or grading crew
  3. Returning clean data to the route handler

RAG strategy:
  Generation: fetch broad chunks (RETRIEVAL_TOP_K_BROAD = 15 by default)
              using a general query so we cover the whole document.
  Grading:    fetch targeted chunks (RETRIEVAL_TOP_K = 5) using the question
              as the query so we get the most relevant passage for that answer.
"""

import logging
from app.rag.retriever import retrieve_chunks, retrieve_all_chunks
from app.core.config import get_settings
from app.agents.quiz_crew import run_quiz_generation, run_single_grade
from app.schemas.quiz import GeneratedQuestion, MCQOption, QuizFeedback

settings = get_settings()
logger   = logging.getLogger(__name__)


def generate_quiz(
    collection_id: str,
    difficulty:    str,
    count:         int,
    question_type: str,
) -> list[GeneratedQuestion]:
    """
    Fetch document content via RAG and generate quiz questions.

    We use a broad retrieval query to get a cross-section of the document —
    not just one narrow topic — so the questions cover the whole material.

    Raises ValueError if the collection has no content.
    """
    # Retrieve broad context — more chunks = more diverse questions
    chunks = retrieve_chunks(
        collection_id=collection_id,
        query="main topics key concepts important ideas examples definitions",
        top_k=settings.RETRIEVAL_TOP_K_BROAD,
    )

    if not chunks:
        raise ValueError(
            "No content found for this collection. "
            "Please upload your documents first."
        )

    # Join chunks into one context string, labelled by source document
    content = "\n\n---\n\n".join(
        f"[From: {c['doc_name']}]\n{c['content']}"
        for c in chunks
    )

    # Run the Quiz Generator agent
    raw_questions = run_quiz_generation(content, difficulty, count, question_type)

    # Convert raw dicts to typed Pydantic objects the API can return
    questions = []
    for item in raw_questions[:count]:
        try:
            if question_type == "mcq":
                questions.append(GeneratedQuestion(
                    id=item["id"],
                    text=item["text"],
                    options=[MCQOption(letter=o["letter"], text=o["text"])
                             for o in item.get("options", [])],
                    correctIndex=int(item.get("correctIndex", 0)),
                ))
            else:
                questions.append(GeneratedQuestion(
                    id=item["id"],
                    text=item["text"],
                ))
        except (KeyError, TypeError, ValueError) as e:
            logger.warning("Skipping malformed question: %s", e)
            continue

    if not questions:
        raise ValueError("No valid questions generated. Please try again.")

    return questions


def evaluate_answers(
    answers:       list[dict],
    collection_id: str | None,
) -> tuple[list[QuizFeedback], int]:
    """
    Grade every answer using the Quiz Grader agent and return feedbacks + overall score.

    For each question, we retrieve the most relevant document chunk using the
    question text as the query — so the grader always has the right passage.

    Returns:
        (list of QuizFeedback, overall_pct as int)
    """
    feedbacks = []

    for item in answers:
        question      = item["question"]
        user_answer   = item["user_answer"]
        correct_answer = item.get("correct_answer", "")
        question_type = item["question_type"]

        # Get relevant document context for this specific question
        context = _get_grading_context(question, collection_id)

        # Run the Quiz Grader agent for this one question
        result = run_single_grade(
            question=question,
            user_answer=user_answer,
            correct_answer=correct_answer,
            question_type=question_type,
            context=context,
        )

        feedbacks.append(QuizFeedback(
            correct=result["correct"],
            score_pct=result["score_pct"],
            explanation=result["explanation"],
            tip=result["tip"],
        ))

    # Overall percentage = average of all score_pcts
    overall_pct = (
        round(sum(f.score_pct for f in feedbacks) / len(feedbacks))
        if feedbacks else 0
    )

    return feedbacks, overall_pct


def _get_grading_context(question: str, collection_id: str | None) -> str:
    """
    Retrieve the most relevant document passage for a given question.
    Returns an empty string if no collection_id is provided.
    """
    if not collection_id:
        return ""

    try:
        chunks = retrieve_chunks(
            collection_id=collection_id,
            query=question,
            top_k=settings.RETRIEVAL_TOP_K,
        )
        if not chunks:
            return ""
        return "\n\n---\n\n".join(
            f"[From: {c['doc_name']}]\n{c['content']}"
            for c in chunks
        )
    except Exception as e:
        logger.warning("RAG retrieval failed for grading (using no context): %s", e)
        return ""
