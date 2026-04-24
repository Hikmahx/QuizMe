"""
llm/router.py — Multi-provider LLM router with automatic fallback.

Tries providers in the order defined by LLM_PROVIDER_ORDER in .env.
If a provider fails (rate limit, auth, network), moves to the next.
Raises RuntimeError only if ALL providers fail.

Usage:
    from app.llm.router import get_llm_response
    text = get_llm_response(messages, temperature=0.1, max_tokens=2048)
"""

import logging
import litellm
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

litellm.suppress_debug_info = True

# Build ordered provider list from config

_PROVIDER_CONFIG = {
    "groq":    (f"groq/{settings.GROQ_MODEL}",    settings.GROQ_API_KEY),
    "cerebras": (f"cerebras/{settings.CEREBRAS_MODEL}", settings.CEREBRAS_API_KEY),
    "mistral":  (f"mistral/{settings.MISTRAL_MODEL}",  settings.MISTRAL_API_KEY),
    "gemini":   (f"gemini/{settings.GEMINI_MODEL}",    settings.GEMINI_API_KEY),
}

_active_providers: list[tuple[str, str, str]] = []  # (name, model, api_key)

for _provider in settings.LLM_PROVIDER_ORDER:
    _cfg = _PROVIDER_CONFIG.get(_provider)
    if _cfg:
        _model, _key = _cfg
        if _key and _key.strip():
            _active_providers.append((_provider, _model, _key))
            logger.info("LLM router: loaded provider '%s' → %s", _provider, _model)

if not _active_providers:
    raise ValueError(
        "No LLM providers configured. "
        "Set at least one of GROQ_API_KEY, CEREBRAS_API_KEY, MISTRAL_API_KEY, or GEMINI_API_KEY in .env."
    )


# Public interface 

def get_llm_response(
    messages:    list[dict],
    temperature: float | None = None,
    max_tokens:  int   | None = None,
) -> str:
    """
    Send messages to the first available LLM provider, falling back on failure.

    Args:
        messages:    OpenAI-format list, e.g. [{"role": "user", "content": "..."}]
        temperature: Overrides settings.LLM_TEMPERATURE when provided.
        max_tokens:  Overrides settings.LLM_MAX_TOKENS when provided.
                     Pass settings.LLM_MAX_TOKENS_GRADING for grading calls.

    Returns:
        The model's text response as a plain string.

    Raises:
        RuntimeError: If every configured provider fails.
    """
    last_error: Exception | None = None

    _temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
    _max_tokens  = max_tokens  if max_tokens  is not None else settings.LLM_MAX_TOKENS

    for name, model, api_key in _active_providers:
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                api_key=api_key,
                temperature=_temperature,
                max_tokens=_max_tokens,
            )
            content = response.choices[0].message.content
            logger.debug("LLM router: '%s' responded successfully.", name)
            return content or ""

        except Exception as e:
            logger.warning(
                "LLM router: '%s' failed (%s: %s). Trying next provider.",
                name, type(e).__name__, str(e)[:120],
            )
            last_error = e

    raise RuntimeError(
        f"All LLM providers failed. Last error: {last_error}"
    )
