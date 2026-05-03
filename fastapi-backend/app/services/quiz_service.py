"""
quiz_service.py — Business logic layer: RAG retrieval → LLM.

generate_quiz()    — retrieve document content, run generator agent (CrewAI)
evaluate_answers() — batch all grading into ONE LLM call (direct router)

Key design decisions:
- Grading is a direct LLM call, not per-question CrewAI crews.
  N questions = 1 LLM call, not N calls.
- All RAG lookups for grading happen up-front before the single LLM call,
  so the model has all context in one prompt.
- Document content is truncated before generation so the bulk of the token
  budget goes to output questions, not the input context.
- MCQ options are shuffled after generation so the correct answer is
  never always A — the LLM tends to write the correct answer first.
"""

import logging
import random
from app.rag.retriever import build_context, retrieve_chunks
from app.core.config import get_settings
from app.agents.quiz_crew import run_quiz_generation, run_batch_grade
from app.schemas.quiz import GeneratedQuestion, MCQOption, QuizFeedback

settings = get_settings()
logger   = logging.getLogger(__name__)

_CONTENT_MAX_CHARS = 12_000

_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "what", "how", "why", "when",
    "where", "who", "which", "that", "this", "these", "those", "and", "but",
    "or", "so", "of", "in", "on", "at", "to", "for", "with", "by", "from",
    "about", "as", "your", "their", "its", "our", "my", "his", "her",
    "explain", "describe", "does", "role", "during", "formation",
}

# Letter labels for MCQ options in display order
_LETTERS = ["A", "B", "C", "D"]


def _shuffle_mcq_options(
    options: list[MCQOption],
    correct_index: int,
) -> tuple[list[MCQOption], int]:
    """
    Shuffle the options list and return the new list + updated correctIndex.

    Why this is necessary:
      LLMs reliably write the correct answer as the first option (index 0 = A)
      because it's the most natural thing to do — write the right answer,
      then fill in distractors. "Distribute correct answers across positions"
      in the prompt doesn't fix this — the model ignores it.

      The fix is post-processing: shuffle the options in Python where randomness
      is actually random, then re-assign letters and correctIndex.

    Example:
      Input:  options=[A_correct, B_wrong, C_wrong, D_wrong], correctIndex=0
      Shuffle: [C_wrong, A_correct, D_wrong, B_wrong]
      Output: options=[A(was C), B(was A/correct), C(was D), D(was B)], correctIndex=1
    """
    if not options or correct_index >= len(options):
        return options, correct_index

    # Remember which option is correct by reference (not index)
    correct_option_text = options[correct_index].text

    # Shuffle a copy so we don't mutate the input
    shuffled = list(options)
    random.shuffle(shuffled)

    # Re-assign letter labels in display order (A, B, C, D)
    reassigned = [
        MCQOption(letter=_LETTERS[i], text=opt.text)
        for i, opt in enumerate(shuffled)
    ]

    # Find the new index of the correct option
    new_correct_index = next(
        i for i, opt in enumerate(shuffled) if opt.text == correct_option_text
    )

    return reassigned, new_correct_index


def generate_quiz(
    collection_id: str,
    difficulty:    str,
    count:         int,
    question_type: str,
) -> list[GeneratedQuestion]:
    """
    Retrieve document content via RAG and generate quiz questions.

    Content is truncated to _CONTENT_MAX_CHARS before being passed to the
    generator so the model's output token budget goes to questions, not context.
    """
    content = build_context(
        collection_id,
        query="main topics key concepts important ideas examples definitions",
        top_k=settings.RETRIEVAL_TOP_K_BROAD,
    )

    if not content:
        raise ValueError(
            "No content found for this collection. "
            "Please upload your documents first."
        )

    # Truncate to leave room for the model to output all requested questions.
    # At the boundary we cut at the last full stop so we don't split mid-sentence.
    if len(content) > _CONTENT_MAX_CHARS:
        truncated = content[:_CONTENT_MAX_CHARS]
        last_stop = truncated.rfind(". ")
        content = truncated[: last_stop + 1] if last_stop != -1 else truncated
        logger.info(
            "Document content truncated to %d chars for generation.", len(content)
        )

    raw_questions = run_quiz_generation(content, difficulty, count, question_type)

    questions: list[GeneratedQuestion] = []
    for item in raw_questions[:count]:
        try:
            if question_type == "mcq":
                raw_options = [
                    MCQOption(letter=o["letter"], text=o["text"])
                    for o in item.get("options", [])
                ]
                raw_correct = int(item.get("correctIndex", 0))

                # Shuffle options so correct answer isn't always A
                options, correct_index = _shuffle_mcq_options(raw_options, raw_correct)

                questions.append(GeneratedQuestion(
                    id=item["id"],
                    text=item["text"],
                    options=options,
                    correctIndex=correct_index,
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
      1. Retrieve grading context for every question up-front.
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
