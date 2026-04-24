"""
quiz_service.py — Business logic layer: RAG retrieval → LLM.

generate_quiz()    — retrieve document content, run generator agent (CrewAI)
evaluate_answers() — batch all grading into ONE LLM call (direct router)

Key design decisions:
- Grading is a direct LLM call, not per-question CrewAI crews.
  N questions = 1 LLM call, not N calls.
- All RAG lookups for grading happen up-front before the single LLM call,
  so the model has all context in one prompt.
- The stop-words set is intentionally manual — no extra dependency needed.
"""

import logging
from app.rag.retriever import retrieve_chunks
from app.core.config import get_settings
from app.agents.quiz_crew import run_quiz_generation, run_batch_grade
from app.schemas.quiz import GeneratedQuestion, MCQOption, QuizFeedback

settings = get_settings()
logger   = logging.getLogger(__name__)

# Stop-words excluded from the relevance keyword check
_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "what", "how", "why", "when",
    "where", "who", "which", "that", "this", "these", "those", "and", "but",
    "or", "so", "of", "in", "on", "at", "to", "for", "with", "by", "from",
    "about", "as", "your", "their", "its", "our", "my", "his", "her",
    "explain", "describe", "does", "role", "during", "formation",
}


def generate_quiz(
    collection_id: str,
    difficulty:    str,
    count:         int,
    question_type: str,
) -> list[GeneratedQuestion]:
    """
    Retrieve document content via RAG and generate quiz questions.
    Uses a broad query to get a cross-section of the whole document.
    """
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

    content = "\n\n---\n\n".join(
        f"[From: {c['doc_name']}]\n{c['content']}" for c in chunks
    )

    raw_questions = run_quiz_generation(content, difficulty, count, question_type)

    questions: list[GeneratedQuestion] = []
    for item in raw_questions[:count]:
        try:
            if question_type == "mcq":
                questions.append(GeneratedQuestion(
                    id=item["id"],
                    text=item["text"],
                    options=[
                        MCQOption(letter=o["letter"], text=o["text"])
                        for o in item.get("options", [])
                    ],
                    correctIndex=int(item.get("correctIndex", 0)),
                ))
            else:
                questions.append(GeneratedQuestion(id=item["id"], text=item["text"]))
        except (KeyError, TypeError, ValueError) as e:
            logger.warning("Skipping malformed question: %s", e)

    if not questions:
        raise ValueError("No valid questions were generated. Please try again.")

    return questions


def evaluate_answers(
    answers:       list[dict],
    collection_id: str | None,
) -> tuple[list[QuizFeedback], int]:
    """
    Grade all answers and return (feedbacks, overall_pct).

    Steps:
      1. Retrieve grading context for every question up-front (parallel-friendly).
      2. Send ALL questions + answers to the LLM in a single batched call.
      3. Parse and return.

    This is N RAG lookups + 1 LLM call, not N LLM calls.
    """
    # Step 1 — collect all contexts up-front
    grading_items = []
    for item in answers:
        context = _get_grading_context(item["question"], collection_id)
        grading_items.append({
            "question":       item["question"],
            "user_answer":    item.get("user_answer", ""),
            "correct_answer": item.get("correct_answer", ""),
            "question_type":  item["question_type"],
            "context":        context,
        })

    # Step 2 — single LLM call for all grading
    results = run_batch_grade(grading_items)

    # Step 3 — build response
    feedbacks = [
        QuizFeedback(
            correct=r["correct"],
            score_pct=r["score_pct"],
            explanation=r["explanation"],
            tip=r["tip"],
        )
        for r in results
    ]

    overall_pct = (
        round(sum(f.score_pct for f in feedbacks) / len(feedbacks))
        if feedbacks else 0
    )

    return feedbacks, overall_pct


def _get_grading_context(question: str, collection_id: str | None) -> str:
    """
    Retrieve the most relevant document passage for one question.

    Returns "" when:
      - No collection_id provided
      - RAG retrieval fails
      - Retrieved chunks appear unrelated to the question (stale collection)
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

        # Relevance guard — discard chunks from the wrong document
        question_keywords = {
            w.lower().strip("?.,!:;'\"")
            for w in question.split()
            if w.lower().strip("?.,!:;'\"") not in _STOP_WORDS
            and len(w) > 3
        }

        if question_keywords:
            combined = " ".join(c["content"].lower() for c in chunks)
            matches  = sum(1 for kw in question_keywords if kw in combined)
            if matches < 2:
                logger.warning(
                    "Context unrelated to question (%d/%d keywords). Skipping.",
                    matches, len(question_keywords),
                )
                return ""

        # Truncate each chunk so the batch prompt stays manageable
        return "\n\n---\n\n".join(
            f"[From: {c['doc_name']}]\n{c['content'][:500]}" for c in chunks
        )

    except Exception as e:
        logger.warning("RAG retrieval failed (using general knowledge): %s", e)
        return ""
