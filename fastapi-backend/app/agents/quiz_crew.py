"""
quiz_crew.py — CrewAI Crew orchestration for quiz generation and grading.

A Crew is a team of agents working on tasks in sequence.
For generation: one agent, one task — simple and focused.
For grading: one agent, one task per question — runs concurrently.

Parsing note:
  crew.kickoff() returns a CrewOutput object, not a string.
  Use result.raw to get the text the agent produced.
  Then strip markdown fences and parse JSON.
"""

import json
import re
import logging
from crewai import Crew
from .quiz_tasks import generate_mcq_task, generate_theory_task, grade_answer_task

logger = logging.getLogger(__name__)


def extract_json(text: str) -> str:
    """
    Strip markdown code fences that LLMs sometimes add despite being told not to.
    Handles ```json ... ``` and ``` ... ``` wrappers.
    """
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*",          "", text)
    return text.strip()


def run_quiz_generation(content: str, difficulty: str, count: int, qtype: str) -> list[dict]:
    """
    Run the Quiz Generator agent and return a list of question dicts.

    The Crew has one agent and one task — the focus principle from the book.
    Returns parsed question dicts (not raw text) so the caller gets clean data.
    Raises ValueError if the output can't be parsed.
    """
    if qtype == "mcq":
        task = generate_mcq_task(content, difficulty, count)
    else:
        task = generate_theory_task(content, difficulty, count)

    crew = Crew(
        agents=[task.agent],
        tasks=[task],
        verbose=False,
    )

    # crew.kickoff() returns CrewOutput — use .raw to get the text
    result = crew.kickoff()
    raw_text = result.raw if hasattr(result, "raw") else str(result)

    try:
        questions = json.loads(extract_json(raw_text))
        if not isinstance(questions, list):
            raise ValueError("Expected a JSON array of questions")
        return questions
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Generation parse error: %s\nRaw: %s", e, raw_text[:500])
        raise ValueError(
            "Could not parse generated questions. Please try again."
        )


# Grading
def run_single_grade(
    question: str,
    user_answer: str,
    correct_answer: str,
    question_type: str,
    context: str,
) -> dict:
    """
    Run the Quiz Grader agent for one question and return a feedback dict.

    Returns a safe fallback dict on any failure so the feedback page never breaks.
    """
    task = grade_answer_task(
        question=question,
        user_answer=user_answer,
        correct_answer=correct_answer,
        question_type=question_type,
        context=context,
    )

    crew = Crew(
        agents=[task.agent],
        tasks=[task],
        verbose=False,
    )

    result   = crew.kickoff()
    raw_text = result.raw if hasattr(result, "raw") else str(result)

    try:
        data = json.loads(extract_json(raw_text))
        return {
            "correct":     bool(data.get("correct", False)),
            "score_pct":   int(data.get("score_pct", 0)),
            "explanation": data.get("explanation", "No explanation provided."),
            "tip":         data.get("tip", ""),
        }
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        logger.error("Grade parse error: %s\nRaw: %s", e, raw_text[:300])
        # Safe fallback — never crash the feedback page
        return {
            "correct":     False,
            "score_pct":   0,
            "explanation": "Could not evaluate this answer automatically.",
            "tip":         "",
        }
