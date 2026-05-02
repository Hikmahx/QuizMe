import re
import json
import logging

logger = logging.getLogger(__name__)


def extract_json(text: str) -> str:
    """
    Extract clean JSON from an LLM response.

    LLMs frequently add text before or after the JSON despite instructions.
    This function handles the common failure modes:

      1. Markdown fences:  ```json [...] ```
      2. Prose preamble:   "Here are your questions:\n[...]"
      3. Trailing text:    "[...]\nLet me know if you need more!"

    Strategy:
      - Strip markdown fences first.
      - Then find the first '[' (array) or '{' (object) and slice from there.
      - This is safe: valid JSON always starts with one of these two characters.
    """
    # Step 1 — strip markdown fences (```json...``` or ```...```)
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    text = text.strip()

    # Step 2 — find where the actual JSON starts (first [ or {)
    # This removes any prose preamble the model added before the JSON.
    array_start  = text.find("[")
    object_start = text.find("{")

    if array_start == -1 and object_start == -1:
        # No JSON-like structure found — return as-is and let json.loads fail
        return text

    if array_start == -1:
        json_start = object_start
    elif object_start == -1:
        json_start = array_start
    else:
        json_start = min(array_start, object_start)

    text = text[json_start:]

    # Step 3 — strip anything after the closing bracket/brace
    # Find the matching end character so trailing prose is also removed.
    open_char  = text[0]
    close_char = "]" if open_char == "[" else "}"
    close_idx  = text.rfind(close_char)
    if close_idx != -1:
        text = text[: close_idx + 1]

    return text.strip()


def parse_json_robust(text: str) -> object:
    """
    Parse JSON from an LLM response as robustly as possible.

    Tries in order:
      1. extract_json() + json.loads()  — fast, strict
      2. json_repair.loads()            — handles minor syntax errors (trailing commas etc.)
      3. Raises ValueError              — gives the caller a chance to handle gracefully

    Use this instead of bare json.loads() for any LLM output.
    """
    cleaned = extract_json(text)

    # Attempt 1 — standard JSON parse on cleaned text
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as first_err:
        logger.debug("Standard JSON parse failed (%s), trying json_repair…", first_err)

    # Attempt 2 — json_repair handles minor LLM JSON mistakes
    # (trailing commas, unquoted keys, truncated arrays, etc.)
    try:
        from json_repair import repair_json
        repaired = repair_json(cleaned, return_objects=True)
        if repaired is not None:
            logger.info("json_repair recovered the response.")
            return repaired
    except Exception as repair_err:
        logger.debug("json_repair also failed: %s", repair_err)

    # Both failed — raise with the original cleaned text for logging upstream
    raise ValueError(
        f"Could not parse JSON after extraction and repair.\n"
        f"Cleaned text (first 400 chars): {cleaned[:400]}"
    )
