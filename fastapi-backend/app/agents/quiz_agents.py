"""
quiz_agents.py — CrewAI agent definitions for the quiz pipeline.

Following the AI Agents book pattern:
  - Each agent has one clear role (role-playing principle)
  - Each agent does one job — never more (focus principle)
  - The agents cooperate: Generator creates questions, Grader evaluates,
    Feedback Agent explains (cooperation principle)

LLM setup:
  CrewAI needs to know which LLM to use. Without this it defaults to OpenAI
  and throws an auth error. We point it at Groq using the model string
  "groq/model-name" which CrewAI recognises via the litellm integration.
"""

from crewai import Agent, LLM
from app.core.config import get_settings

settings = get_settings()

# Configure Groq as the LLM for all agents.
# CrewAI uses litellm under the hood — the "groq/" prefix routes to Groq's API.
# temperature=0.7 for generation (we want variety in questions).
# temperature=0.1 for grading (consistent scores — same answer = same grade).
llm_generate = LLM(
    model=f"groq/{settings.GROQ_MODEL}",
    api_key=settings.GROQ_API_KEY,
    temperature=0.7,
)

llm_grade = LLM(
    model=f"groq/{settings.GROQ_MODEL}",
    api_key=settings.GROQ_API_KEY,
    temperature=0.1,
)


quiz_generator = Agent(
    role="Quiz Generator",
    goal="Create high-quality quiz questions directly from study document content",
    backstory=(
        "You are a professional exam setter with 20 years of experience. "
        "You only write questions based on the content you are given — never from memory. "
        "You always return valid JSON and nothing else."
    ),
    llm=llm_generate,
    verbose=False,   # set True to see agent reasoning in the terminal
)

quiz_grader = Agent(
    role="Quiz Grader",
    goal="Evaluate student answers accurately and return a structured JSON score",
    backstory=(
        "You are a strict but fair examiner. "
        "You compare the student's answer against the provided document context. "
        "You always return valid JSON with correct, score_pct, explanation, and tip fields."
    ),
    llm=llm_grade,
    verbose=False,
)
