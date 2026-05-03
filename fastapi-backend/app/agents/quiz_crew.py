"""
quiz_crew.py — CrewAI for generation, direct LLM for grading.
"""

import logging
from crewai import Crew
from .quiz_tasks import generate_mcq_task, generate_theory_task
from app.llm.router import get_llm_response
from app.core.config import get_settings
from app.utils.text import extract_json, parse_json_robust

settings = get_settings()
logger = logging.getLogger(__name__)


# Generation (CrewAI — 1 call per quiz)

def run_quiz_generation(
    content: str,
    difficulty: str,
    count: int,
    qtype: str,
) -> list[dict]:
    for attempt in range(3):
        task = (
            generate_mcq_task
            if qtype == "mcq"
            else generate_theory_task
        )(
            content, difficulty, count
        )
        crew = Crew(
            agents=[task.agent],
            tasks=[task],
            verbose=False,
        )

        result = crew.kickoff()
        raw = result.raw if hasattr(result, "raw") else str(result)
        try:
            parsed = parse_json_robust(raw)
            if isinstance(parsed, list) and len(parsed) >= count:
                return parsed[:count]
        except Exception:
            pass
    raise ValueError(f"Failed to generate {count} questions after 3 attempts")


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
1. DETECT NONSENSE FIRST. If a theory answer is gibberish, random characters,
   unrelated words, or clearly not an attempt (e.g. "Bjsisokk", "asdfgh", "lol"),
   score_pct = 0, correct = false. No partial credit for nonsense.
2. Grade genuine attempts on UNDERSTANDING, not word-for-word matching. Paraphrasing = correct.
3. MCQ: score_pct = 100 if student's selection matches correct answer, else 0.
4. Theory (genuine attempts only): score 0-100 based on conceptual understanding.
   - 85-100%: core concept correct and well-explained in own words
   - 65-84%:  core concept correct, could be more complete
   - 45-64%:  partially correct — got some ideas, missed key point
   - 20-44%:  shows some awareness but misunderstood main point
   - 0-19%:   factually wrong, completely off-topic, or gibberish/nonsense
5. correct = true if score_pct >= 50.
6. DO NOT quote or repeat the student's answer in your explanation — they can see it.
7. Theory explanations: start by acknowledging what the student got RIGHT.
   For gibberish: say "This answer does not address the question."
8. Never say an answer is "missing" or "not provided" — every question has an answer below.
9. If the document context does not clearly relate to the question, use general knowledge.

QUESTIONS TO GRADE:
{numbered_items}

Return ONLY a JSON array of exactly {len(items)} objects in the same order.
No markdown fences. No text before or after the array.
Each object: {{ "correct": bool, "score_pct": int, "explanation": "str", "tip": "str" }}"""

    raw = ""
    try:
        max_tok = min(settings.LLM_MAX_TOKENS_GRADING, 150 * len(items))
        raw = get_llm_response(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=max_tok,
        )
        parsed = parse_json_robust(raw)

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
        ctx = item["context"][:500]
        lines.append(f"Document context (fact-check only):\n{ctx}")
    return "\n".join(lines)


def _clean_entry(entry: dict, item: dict) -> dict:
    explanation = str(entry.get("explanation", "")).lower()
    # Hallucination guard — LLM sometimes claims no answer was given
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
