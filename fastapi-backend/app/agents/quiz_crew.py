"""
quiz_crew.py — CrewAI for generation, direct LLM for grading.

Generation still uses CrewAI (one call, complex structured output).
Grading uses a single direct LLM call for ALL questions at once:
  N questions = 1 LLM call, not N calls.
"""

import json
import logging
from crewai import Crew
from .quiz_tasks import generate_mcq_task, generate_theory_task
from app.llm.router import get_llm_response
from app.core.config import get_settings
from app.utils.text import extract_json

settings = get_settings()
logger = logging.getLogger(__name__)


# Generation (CrewAI — 1 call per quiz)

def run_quiz_generation(
    content: str,
    difficulty: str,
    count: int,
    qtype: str,
) -> list[dict]:
    """
    Generate quiz questions via a single CrewAI agent call.
    Returns a list of raw question dicts.
    Raises ValueError if the output cannot be parsed as a JSON array.
    """
    task = (
        generate_mcq_task(content, difficulty, count)
        if qtype == "mcq"
        else generate_theory_task(content, difficulty, count)
    )
    crew = Crew(
        agents=[task.agent],
        tasks=[task],
        verbose=False,
    )

    # crew.kickoff() returns CrewOutput — use .raw to get the text
    result = crew.kickoff()
    raw= result.raw if hasattr(result, "raw") else str(result)

    try:
        parsed = json.loads(extract_json(raw))
        if not isinstance(parsed, list):
            raise ValueError("Expected a JSON array at the top level.")
        return parsed
    except Exception as e:
        logger.error(
            "Generation JSON parse error: %s\nRaw (first 600 chars): %s",
            e, raw[:600],
        )
        raise ValueError(f"Could not parse generated questions: {e}")


# Grading (direct LLM — 1 call for ALL questions)

def run_batch_grade(items: list[dict]) -> list[dict]:
    """
    Grade ALL answers in a single LLM call.

    Each item must have:
        question       str
        user_answer    str
        correct_answer str   (correct option text for MCQ; "" for theory)
        question_type  "mcq" | "theory"
        context        str   (relevant document passage; "" if unavailable)

    Returns a list of dicts — one per item:
        { correct (bool), score_pct (int 0-100), explanation (str), tip (str) }
    """
    numbered_items = "\n\n".join(
        _format_item(i + 1, item) for i, item in enumerate(items)
    )

    prompt = f"""You are a fair quiz grader. Grade every question below and return a JSON array.

GRADING RULES:
1. Grade on UNDERSTANDING, not word-for-word matching. Paraphrasing = correct.
2. MCQ: score_pct = 100 if student's selection matches correct answer, else 0.
3. Theory: score 0-100 based on conceptual understanding.
   - 85-100%: core concept correct and well-explained in own words
   - 65-84%:  core concept correct, could be more complete
   - 45-64%:  partially correct — got some ideas, missed key point
   - 20-44%:  shows some awareness but misunderstood main point
   - 0-19%:   factually wrong or completely off-topic
4. correct = true if score_pct >= 50.
5. Theory explanations: start by acknowledging what the student got RIGHT.
6. Never say an answer is "missing" or "not provided" — every question has an answer below.
7. If the document context does not clearly relate to the question, use general knowledge.

QUESTIONS TO GRADE:
{numbered_items}

Return ONLY a JSON array of exactly {len(items)} objects in the same order.
No markdown fences. No text before or after the array.
Each object: {{ "correct": bool, "score_pct": int, "explanation": "str", "tip": "str" }}"""

    raw = ""
    try:
        # Token budget: ~150 tokens per feedback item, capped at the grading limit
        max_tok = min(settings.LLM_MAX_TOKENS_GRADING, 150 * len(items))
        raw = get_llm_response(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=max_tok,
        )
        parsed = json.loads(extract_json(raw))

        if not isinstance(parsed, list):
            raise ValueError("Expected a JSON array")

        results = []
        for i, item in enumerate(items):
            entry = parsed[i] if i < len(parsed) else {}
            results.append(_clean_entry(entry, item))
        return results

    except Exception as e:
        logger.error(
            "Batch grade failed: %s\nRaw (first 600 chars): %s",
            e, raw[:600],
        )
        return [_fallback(item) for item in items]


def _format_item(n: int, item: dict) -> str:
    qtype = item["question_type"]
    lines = [
        f"--- Question {n} ({qtype.upper()}) ---",
        f"Question: {item['question']}",
        f"Student's answer: {item['user_answer'] or '(no answer given)'}",
    ]
    if qtype == "mcq" and item.get("correct_answer"):
        lines.append(f"Correct answer: {item['correct_answer']}")
    if item.get("context"):
        ctx = item["context"][:500]   # cap per-question context
        lines.append(f"Document context (fact-check only):\n{ctx}")
    return "\n".join(lines)


def _clean_entry(entry: dict, item: dict) -> dict:
    explanation = str(entry.get("explanation", "")).lower()
    # Hallucination guard
    if item.get("user_answer") and any(p in explanation for p in [
        "no answer", "not provided", "did not provide",
        "answer is missing", "no response", "left blank",
    ]):
        logger.warning(
            "Grader hallucinated 'no answer'. Q: %s | A: %s",
            item["question"][:60], item["user_answer"][:60],
        )
        return {
            "correct": True,
            "score_pct": 70,
            "explanation": (
                "Your answer captures the core idea correctly. "
                "(A grading inconsistency was automatically corrected.)"
            ),
            "tip": "Keep explaining concepts in your own words.",
        }
    return {
        "correct":     bool(entry.get("correct", False)),
        "score_pct":   max(0, min(100, int(entry.get("score_pct", 0)))),
        "explanation": str(entry.get("explanation", "")),
        "tip":         str(entry.get("tip", "")),
    }


def _fallback(item: dict) -> dict:
    return {
        "correct":     False,
        "score_pct":   0,
        "explanation": "Could not automatically grade this answer. Please review it manually.",
        "tip": "",
    }
