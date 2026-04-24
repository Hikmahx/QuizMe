"""
quiz_agents.py — CrewAI agent definitions using the multi-provider LLM router.

FallbackLLM wraps our litellm-based router so CrewAI can use it as a drop-in
LLM. If Groq hits its rate limit mid-session, the next call automatically
falls through to Mistral → Gemini → Cerebras.
"""

import logging
from typing import Any, List, Optional

from crewai import Agent
from crewai.llms.base_llm import BaseLLM

from app.llm.router import get_llm_response

logger = logging.getLogger(__name__)


class FallbackLLM(BaseLLM):
    """
    CrewAI-compatible LLM that delegates to our multi-provider router.

    BaseLLM requires:
      - model attribute (set to a placeholder string)
      - call(messages, ...) -> str
      - acall(messages, ...) -> str  (async version)
    """

    def __init__(self, temperature: float = 0.3, **kwargs):
        super().__init__(model="fallback-router", **kwargs)
        self._temperature = temperature

    def call(
        self,
        messages: List[dict],
        tools: Optional[List[Any]] = None,
        callbacks: Optional[List[Any]] = None,
        **kwargs,
    ) -> str:
        """Synchronous call — used by CrewAI during task execution."""
        return get_llm_response(messages, temperature=self._temperature)

    async def acall(
        self,
        messages: List[dict],
        tools: Optional[List[Any]] = None,
        callbacks: Optional[List[Any]] = None,
        **kwargs,
    ) -> str:
        """Async wrapper — runs the sync call in a thread pool."""
        import asyncio
        return await asyncio.to_thread(self.call, messages)


# Higher temperature for generation (creative questions)
# Lower temperature for grading (consistent, reproducible scores)
_llm_generate = FallbackLLM(temperature=0.5)
_llm_grade    = FallbackLLM(temperature=0.1)


quiz_generator = Agent(
    role="Quiz Generator",
    goal="Create high-quality quiz questions directly from study document content",
    backstory=(
        "You are a professional exam setter with 20 years of experience. "
        "You ONLY write questions based on the exact content you are given — never from general knowledge or memory. "
        "Every question must be answerable from the provided document. "
        "You always return valid JSON and nothing else — no markdown, no explanation."
    ),
    llm=_llm_generate,
    verbose=False,
)

quiz_grader = Agent(
    role="Quiz Grader",
    goal=(
        "Evaluate whether a student understands the concept being asked, "
        "rewarding correct ideas regardless of the exact wording used"
    ),
    backstory=(
        "You are a fair and encouraging university tutor. "
        "You grade on UNDERSTANDING, not word-for-word recall. "
        "If a student expresses the correct idea in their own words (paraphrasing), that is CORRECT — full marks. "
        "You only mark an answer wrong if it is factually incorrect or completely off-topic. "
        "You always return valid JSON with correct, score_pct, explanation, and tip — nothing else."
    ),
    llm=_llm_grade,
    verbose=False,
)
