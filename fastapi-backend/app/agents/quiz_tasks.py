"""
quiz_tasks.py — CrewAI task definitions for quiz generation and grading.

Every Task needs:
  - description:     what to do (the full instructions + data)
  - expected_output: a description of the output format (required by CrewAI 0.28+)
  - agent:           which agent handles this task

The MCQ generation output format matches the frontend's QuizQuestion type exactly:
  { id, text, options: [{letter, text}], correctIndex }

Theory generation output:
  { id, text }

Grading output (for both MCQ and theory):
  { correct, score_pct, explanation, tip }

score_pct (0-100) is used for both types:
  - MCQ:    always 100 (correct) or 0 (wrong)
  - Theory: 0-100 based on how well the answer matches the document context
  This makes the feedback card consistent — one number format for everything.
"""

from crewai import Task
from .quiz_agents import quiz_generator, quiz_grader


def generate_mcq_task(content: str, difficulty: str, count: int) -> Task:
    """
    Task for the Quiz Generator agent to produce MCQ questions.

    The output format uses `correctIndex` (0-3) to match the frontend directly.
    Vary the correct answer position — don't always put it at index 0.
    """
    return Task(
        description=f"""
Create exactly {count} multiple choice questions from the document content below.

Difficulty: {difficulty}
- easy:   recall questions answerable directly from the text
- medium: understanding and light inference required
- hard:   synthesis of multiple ideas or deep analysis required

Rules:
- Every question MUST be answerable from the document content provided.
- Each question has exactly 4 options (A, B, C, D).
- Only ONE option is correct.
- Vary the position of the correct answer — do NOT always use index 0.
- Cover different sections of the document, not just one topic.
- Return ONLY the JSON array. No markdown, no extra text.

JSON format (correctIndex is the 0-based index of the correct option):
[
  {{
    "id": 1,
    "text": "Question text here?",
    "options": [
      {{"letter": "A", "text": "First option"}},
      {{"letter": "B", "text": "Second option"}},
      {{"letter": "C", "text": "Third option"}},
      {{"letter": "D", "text": "Fourth option"}}
    ],
    "correctIndex": 2
  }}
]

DOCUMENT CONTENT:
{content}
""",
        expected_output=(
            f"A JSON array of exactly {count} MCQ question objects, "
            "each with id, text, options (4 items with letter+text), and correctIndex."
        ),
        agent=quiz_generator,
    )


def generate_theory_task(content: str, difficulty: str, count: int) -> Task:
    """
    Task for the Quiz Generator agent to produce open-ended theory questions.
    Theory questions ask students to explain, describe, or analyse a concept.
    """
    return Task(
        description=f"""
Create exactly {count} open-ended theory questions from the document content below.

Difficulty: {difficulty}
- easy:   straightforward "what is" or "describe" questions
- medium: "explain how" or "compare" questions requiring understanding
- hard:   "analyse", "evaluate", or "synthesise" questions requiring deep thinking

Rules:
- Every question MUST be answerable from the document content provided.
- Questions should require explanation, not just a single-word answer.
- Cover different sections of the document.
- Return ONLY the JSON array. No markdown, no extra text.

JSON format:
[
  {{"id": 1, "text": "Explain the concept of..."}},
  {{"id": 2, "text": "What is the difference between..."}}
]

DOCUMENT CONTENT:
{content}
""",
        expected_output=(
            f"A JSON array of exactly {count} theory question objects, "
            "each with id and text fields only."
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
    Task for the Quiz Grader agent to evaluate one answer.

    For MCQ:
      correct_answer = the text of the correct option (e.g. "Retrieval-Augmented Generation")
      The grader checks if user_answer matches correct_answer and explains why.
      score_pct is always 0 or 100 for MCQ.

    For theory:
      correct_answer = "" (no predefined answer exists)
      The grader reads the document context and evaluates the student's answer.
      score_pct is 0-100 based on accuracy, completeness, and depth.
      correct = True if score_pct >= 60.

    Percentage is used instead of a 0-5 scale because:
      - "60%" is immediately understood; "3/5" requires mental translation
      - It aligns with MCQ (100% or 0%) for consistent display
      - A 60% threshold for pass/fail is universally understood
    """
    if question_type == "mcq":
        grading_instructions = f"""
This is a MULTIPLE CHOICE question.
Correct answer: {correct_answer}
Student selected: {user_answer}

Determine if the student's answer matches the correct answer.
score_pct should be 100 if correct, 0 if wrong.
Explain WHY the correct answer is correct, referencing the document context.
Give a short tip to remember this concept.
"""
    else:
        grading_instructions = f"""
This is a THEORY question (open-ended).
There is no single correct answer. Grade based on accuracy, completeness, and depth.

Student's answer: {user_answer}

Use the document context below to evaluate the answer.
Assign a score_pct from 0-100:
  0-39:  Incorrect or very incomplete
  40-59: Partially correct but missing key ideas
  60-79: Mostly correct with minor gaps
  80-100: Accurate and well-explained

correct = true if score_pct >= 60, false otherwise.
Explain what was right and what was missing, referencing the document.
Give a short study tip.
"""

    return Task(
        description=f"""
Grade this quiz answer.

QUESTION: {question}

{grading_instructions}

DOCUMENT CONTEXT:
{context}

Return ONLY this JSON — no markdown, no extra text:
{{
  "correct": true or false,
  "score_pct": 0 to 100,
  "explanation": "2-3 sentences explaining the grade, referencing the document",
  "tip": "One short memory tip for next time"
}}
""",
        expected_output=(
            "A single JSON object with correct (bool), score_pct (int 0-100), "
            "explanation (str), and tip (str)."
        ),
        agent=quiz_grader,
    )
