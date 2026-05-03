"""
quiz_tasks.py — CrewAI task definitions for quiz generation and grading.

Generation output (MCQ):
  [{ id, text, options: [{letter, text}], correctIndex }]

Generation output (theory):
  [{ id, text }]

Grading output:
  { correct, score_pct, explanation, tip }
  score_pct: 0-100 integer.  MCQ = 100 or 0.  Theory = 0-100.

Count enforcement:
  Pre-numbered scaffolds are embedded in each generation prompt so the model
  fills N slots rather than counting while generating. This is the primary
  mechanism for hitting the exact question count reliably (~95%+).
  Prose-only "create exactly N" instructions are unreliable because the model
  treats the array as a creative task and stops when it feels done.
"""

from crewai import Task
from .quiz_agents import quiz_generator, quiz_grader


def _mcq_scaffold(count: int) -> str:
    """Pre-numbered JSON scaffold with count MCQ placeholder objects."""
    items = []
    for i in range(1, count + 1):
        items.append(
            f'  {{\n'
            f'    "id": {i},\n'
            f'    "text": "Question {i} text?",\n'
            f'    "options": [\n'
            f'      {{"letter": "A", "text": "..."}},\n'
            f'      {{"letter": "B", "text": "..."}},\n'
            f'      {{"letter": "C", "text": "..."}},\n'
            f'      {{"letter": "D", "text": "..."}}\n'
            f'    ],\n'
            f'    "correctIndex": 0\n'
            f'  }}'
        )
    return "[\n" + ",\n".join(items) + "\n]"


def _theory_scaffold(count: int) -> str:
    """Pre-numbered JSON scaffold with count theory placeholder objects."""
    items = [
        f'  {{"id": {i}, "text": "Question {i} text?"}}'
        for i in range(1, count + 1)
    ]
    return "[\n" + ",\n".join(items) + "\n]"


def generate_mcq_task(content: str, difficulty: str, count: int) -> Task:
    scaffold = _mcq_scaffold(count)
    return Task(
        description=f"""\
Generate exactly {count} multiple-choice questions from the DOCUMENT CONTENT below.
Replace every placeholder in the OUTPUT SCAFFOLD with a real question.
Every one of the {count} numbered slots must be filled — do not skip any.

DIFFICULTY: {difficulty}
  easy   — recall: answer is stated directly in the text
  medium — understanding: requires reading between the lines
  hard   — analysis: requires combining ideas from multiple parts

RULES:
1. Every question MUST be answerable from the DOCUMENT CONTENT below. No outside knowledge.
2. Each question has exactly 4 options labelled A, B, C, D.
3. Exactly ONE option is correct. Vary correctIndex across 0, 1, 2, 3 — do not always use 0.
4. Distractors must be plausible but clearly wrong based on the document.
5. Cover different sections — do not cluster all questions on one topic.
6. Return ONLY the completed JSON array. No markdown fences, no prose, nothing else.

OUTPUT SCAFFOLD — replace all {count} placeholders, keep the structure exactly:
{scaffold}

DOCUMENT CONTENT:
{content}
""",
        expected_output=(
            f"A completed JSON array of exactly {count} MCQ objects. "
            "Each object: id (int), text (str), options (4 items: letter+text), correctIndex (int 0-3). "
            "No markdown, no extra text."
        ),
        agent=quiz_generator,
    )


def generate_theory_task(content: str, difficulty: str, count: int) -> Task:
    scaffold = _theory_scaffold(count)
    return Task(
        description=f"""\
Generate exactly {count} open-ended theory questions from the DOCUMENT CONTENT below.
Replace every placeholder in the OUTPUT SCAFFOLD with a real question.
Every one of the {count} numbered slots must be filled — do not skip any.

DIFFICULTY: {difficulty}
  easy   — "what is" / "describe" questions requiring recall
  medium — "explain how" / "compare" questions requiring understanding
  hard   — "analyse" / "evaluate" questions requiring deep thinking

RULES:
1. Every question MUST be directly answerable from the DOCUMENT CONTENT below. No outside knowledge.
2. Questions must require more than a one-word answer.
3. Cover different sections — do not cluster on one topic.
4. Return ONLY the completed JSON array. No markdown fences, no prose, nothing else.

OUTPUT SCAFFOLD — replace all {count} placeholders, keep the structure exactly:
{scaffold}

DOCUMENT CONTENT:
{content}
""",
        expected_output=(
            f"A completed JSON array of exactly {count} theory question objects. "
            "Each object: id (int) and text (str) only. No markdown, no extra text."
        ),
        agent=quiz_generator,
    )


def grade_answer_task(
    question: str,
    user_answer: str,
    correct_answer: str,
    question_type: str,
    context: str,
) -> Task:
    """
    Grade one student answer.

    MCQ:    compare user_answer text against correct_answer text → 0 or 100.
    Theory: evaluate conceptual understanding against document context → 0-100.
            Paraphrasing = correct. Only fail if factually wrong or off-topic.
    """

    if question_type == "mcq":
        grading_block = f"""\
QUESTION TYPE: Multiple Choice

CORRECT ANSWER: {correct_answer}
STUDENT SELECTED: {user_answer}

Rule: If the student's selection matches the correct answer (same text or near-identical),
score_pct = 100 and correct = true. Otherwise score_pct = 0 and correct = false.
In your explanation, state WHY the correct answer is right, referencing the document context.
"""
    else:
        grading_block = f"""\
QUESTION TYPE: Open-ended Theory

THE STUDENT HAS PROVIDED THE ANSWER BELOW. It exists. Grade it.
Never say the answer is missing or not provided.

STUDENT'S ANSWER:
\"\"\"{user_answer}\"\"\"

MANDATORY GRADING RULES — follow every one without exception:

1. GRADE ON MEANING, NOT WORDING.
   If the student conveys the correct concept in their own words (paraphrasing),
   that answer is CORRECT. Do not penalise different phrasing or vocabulary.

2. USE CONTEXT AS A FACT-CHECK, NOT A WORD MATCHER.
   The document context tells you what is factually true.
   Compare the student's IDEA against those facts — not their exact words.

3. IF THE CONTEXT IS UNRELATED TO THE QUESTION, IGNORE IT.
   Some context may come from the wrong part of the document. If it clearly
   does not help answer the question, discard it and use your general knowledge.

4. SCORING GUIDE:
     85-100%  Core concept correct and explained clearly
     65-84%   Core concept correct, could be more complete
     45-64%   Partially correct — got some ideas, missed key points
     20-44%   Shows some awareness but misunderstood the main point
     0-19%    Factually wrong or completely off-topic

5. correct = true if score_pct >= 50.

6. START YOUR EXPLANATION by acknowledging what the student got right.
   Only then mention what was missing or could be improved.
   Never say "wrong" if the student paraphrased correctly.
"""

    context_block = (
        f"\nDOCUMENT CONTEXT (use for fact-checking — do NOT require word-for-word matching):\n{context}\n"
        if context and context.strip()
        else "\nNo document context available — grade using general knowledge.\n"
    )

    return Task(
        description=f"""\
Grade this quiz answer and return a JSON object.

QUESTION: {question}

{grading_block}
{context_block}

Return ONLY this JSON — no markdown fences, no extra text, nothing else:
{{
  "correct": true or false,
  "score_pct": integer 0 to 100,
  "explanation": "2-3 sentences. First acknowledge what the student got right. Then note any gaps. Never say the answer was missing.",
  "tip": "One actionable study tip (max 1 sentence)."
}}
""",
        expected_output=(
            "A single JSON object with: correct (bool), score_pct (int 0-100), "
            "explanation (str, 2-3 sentences), tip (str, 1 sentence). No markdown."
        ),
        agent=quiz_grader,
    )
