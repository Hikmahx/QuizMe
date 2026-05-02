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
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class FallbackLLM(BaseLLM):
    """
    CrewAI-compatible LLM that delegates to our multi-provider router.

    BaseLLM requires:
      - model attribute (set to a placeholder string)
      - call(messages, ...) -> str
      - acall(messages, ...) -> str  (async version)
    """

    def __init__(self, temperature: float = 0.3, max_tokens: int | None = None, **kwargs):
        super().__init__(model="fallback-router", **kwargs)
        self._temperature = temperature
        # Store max_tokens so each agent can request a different output budget.
        # None means the router falls back to settings.LLM_MAX_TOKENS (4096).
        self._max_tokens = max_tokens

    def call(
        self,
        messages: List[dict],
        tools: Optional[List[Any]] = None,
        callbacks: Optional[List[Any]] = None,
        **kwargs,
    ) -> str:
        """Synchronous call — used by CrewAI during task execution."""
        return get_llm_response(
            messages,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
        )

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


# Generation needs a large output budget.
# 30 MCQ questions × ~200 tokens each = ~6000 tokens minimum.
# Cap at 8000 which is within Groq llama-3.3-70b's supported output range.
_llm_generate = FallbackLLM(temperature=0.5, max_tokens=8000)

# Grading is a single batched call — the existing LLM_MAX_TOKENS_GRADING
# setting controls the budget via run_batch_grade's explicit max_tok argument.
_llm_grade = FallbackLLM(temperature=0.1)


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