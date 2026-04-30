import re


def extract_json(text: str) -> str:
    """Strip markdown code fences from LLM responses before JSON parsing."""
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return text.strip()
