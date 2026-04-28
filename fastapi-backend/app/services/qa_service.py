import json
import logging
import re
from app.llm.router import get_llm_response, get_llm_stream
from app.core.config import get_settings
from app.rag.retriever import retrieve_chunks, retrieve_all_chunks

settings = get_settings()
logger = logging.getLogger(__name__)


# Helpers

def _extract_json(text: str) -> str:
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return text.strip()


# Limit context size to avoid token overflow and keep LLM responses fast/cost-efficient
def _truncate_context(context: str, max_chars: int = 8000) -> str:
    return context[:max_chars]


def _build_context(collection_id: str, query: str, top_k: int | None = None) -> str:
    """Retrieve the most relevant chunks and join them into a context string."""
    k = top_k or settings.RETRIEVAL_TOP_K
    chunks = retrieve_chunks(collection_id, query, top_k=k)
    if not chunks:
        return ""
    return "\n\n---\n\n".join(
        f"[From: {c['doc_name']}]\n{c['content']}" for c in chunks
    )


def _build_all_context(collection_id: str) -> str:
    """Return ALL chunks — used for whole-document analysis (compare, glossary, detect)."""
    chunks = retrieve_all_chunks(collection_id)
    if not chunks:
        return ""
    return "\n\n---\n\n".join(
        f"[From: {c['doc_name']}]\n{c['content']}" for c in chunks
    )


# Simple keyword-based intent detection to short-circuit quiz requests without LLM
def _detect_intent(message: str) -> str:
    msg = message.lower()
    quiz_phrases = [
        "quiz me", "test me", "test my knowledge",
        "give me a quiz", "let me try", "i want a quiz"
    ]
    return "quiz" if any(p in msg for p in quiz_phrases) else "normal"


# Build a better retrieval query by combining the latest message with prior user context
def _build_query(messages: list[dict]) -> str:
    if not messages:
        return ""

    last = messages[-1]["content"]

    if len(messages) < 2:
        return last

    prev_user = next(
        (m["content"] for m in reversed(messages[:-1]) if m["role"] == "user"),
        "",
    )

    return f"{prev_user}\nFollow-up: {last}"



# Streaming Chat

def _system_prompt(mode: str, file_names: list[str]) -> str:
    """
    Build a mode-aware system prompt.

    Every prompt includes two special tokens the frontend handles:
      [QUIZ_CTA]      — append at the end of substantive answers to show a "Quiz Me" button
      [QUIZ_REDIRECT] — use ONLY when the user explicitly asks to be tested/quizzed;
                        the frontend will show a navigation button to the quiz page
    """
    files = ", ".join(file_names) if file_names else "the uploaded documents"
    base = (
        f"You are an AI assistant helping the user understand their uploaded documents: {files}. "
        "Answer clearly and concisely using the provided context."
    )
    quiz = (
        "\n\n[QUIZ_CTA] RULES:"
        "\n- ONLY include [QUIZ_CTA] if the user expresses interest in testing themselves, practicing, or learning deeply."
        "\n- You MAY occasionally suggest a quiz (sparingly, not more than once every few responses)."
        "\n- DO NOT include [QUIZ_CTA] in every answer."
        "\n\n[QUIZ_REDIRECT] RULES:"
        "\n- ONLY include [QUIZ_REDIRECT] if the user EXPLICITLY asks to be tested or take a quiz."
        "\n- When using it, respond briefly and then add [QUIZ_REDIRECT] on its own line."
    )

    prompts = {
        "default": f"{base} Answer only from the documents. Say if unsure.{quiz}",
        "resume": (
            f"{base} You are in Resume Mode. "
            "The left panel already shows the full structured resume analysis (skill gaps, suggestions, cover letter readiness). "
            "Do NOT reproduce that full analysis in chat. "
            "Instead, answer the user's specific questions, expand on individual points from the analysis panel, "
            "or help draft cover letter paragraphs and rewrite resume bullet points on request. "
            "Keep answers focused and conversational — the panel handles the overview."
        ),
        "compare": (
            f"{base} You are in Compare Mode. "
            "The left panel shows the full comparison table. "
            "Do not reproduce the full table in chat. "
            "Answer specific follow-up questions about the comparison concisely.{quiz}"
        ).format(quiz=quiz),
        "glossary": (
            f"{base} You are in Glossary Mode. "
            "The left panel already contains a searchable, alphabetical glossary of every technical term extracted from the documents. "
            "Do NOT list, re-extract, or dump glossary entries in chat — the user can browse the panel directly. "
            "In chat only: (1) give a deeper explanation of a specific term the user asks about, "
            "(2) explain how a term is used in context within the documents, "
            "or (3) answer follow-up questions. "
            "Keep answers brief and targeted. No bullet-point term dumps."
        ),
    }

    return prompts.get(mode, prompts["default"])


def stream_chat(collection_id: str, mode: str, messages: list[dict], file_names: list[str]):
    """
    Generator that yields UTF-8 encoded text chunks from LLM.

    The user's last message is used as the RAG query.
    Retrieved chunks are prepended to the last user message as grounding context.
    The full conversation history is passed so LLM has follow-up context.
    """
    if not messages:
        return

    last_user = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        "",
    )

    # Intent detection (deterministic)
    if _detect_intent(last_user) == "quiz":
        yield "Sure — let's test your knowledge.\n\n[QUIZ_REDIRECT]".encode("utf-8")
        return

    query = _build_query(messages)
    context = _build_context(collection_id, query)
    context = _truncate_context(context)

    api_messages = []
    for i, m in enumerate(messages):
        if i == len(messages) - 1 and m["role"] == "user" and context:
            api_messages.append({
                "role": "user",
                "content": f"Relevant document excerpts:\n\n{context}\n\n---\n\n{m['content']}",
            })
        else:
            api_messages.append(m)

    stream = get_llm_stream(
        messages=[
            {"role": "system", "content": _system_prompt(mode, file_names)},
            *api_messages,
        ],
        temperature=0.7,
        max_tokens=settings.LLM_MAX_TOKENS,
    )

    for chunk in stream:
        # chunk is a litellm streaming object
        try:
            text = chunk.choices[0].delta.content or ""
        except (AttributeError, IndexError):
            continue
        if text:
            yield text.encode("utf-8")


# Mode Analysis

def analyze_mode(collection_id: str, mode: str, file_names: list[str]) -> dict:
    """
    Run mode-specific analysis on the uploaded documents using RAG.

    resume:  Returns agentSteps with skill gap findings.
    compare: Returns compareRows — one row per aspect, one value per document.
    glossary: Returns glossaryEntries — technical terms only, alphabetically sorted.
    """
    context = _truncate_context(_build_all_context(collection_id), 15000)

    if not context:
        return {"mismatch": True, "suggestions": ["default"]}

    if mode == "resume":
        return _analyze_resume(context)
    if mode == "compare":
        return _analyze_compare(context, file_names)
    if mode == "glossary":
        return _analyze_glossary(context)

    return {"mismatch": False}


def _analyze_resume(context: str) -> dict:
    prompt = f"""Analyse these documents to perform a resume + job description review.
Return ONLY JSON:

{{
  "mismatch": false,
  "analysisSteps": [
    {{"id":"1","icon":"document-text-outline","label":"Reading resume","detail":"<specific detail from the resume>","status":"done"}},
    {{"id":"2","icon":"briefcase-outline","label":"Reading job description","detail":"<specific role/company detail>","status":"done"}},
    {{"id":"3","icon":"analytics-outline","label":"Skill gap analysis","detail":"<N matching skills, M missing skills — name specific skills>","status":"done"}},
    {{"id":"4","icon":"create-outline","label":"Resume suggestions","detail":"<top 2-3 specific actionable suggestions>","status":"done"}},
    {{"id":"5","icon":"mail-outline","label":"Cover letter ready","detail":"Ask me to draft one","status":"done"}}
  ]
}}

If these documents are clearly NOT a resume/JD pair:
{{"mismatch":true,"suggestions":["default","compare","glossary"]}}

DOCUMENTS:
{context}"""

    return _call_analyze(prompt)


def _analyze_compare(context: str, file_names: list[str]) -> dict:
    files_str = " vs ".join(file_names) if file_names else "Document 1 vs Document 2"
    n_docs    = max(len(file_names), 2)
    # Build the values array template dynamically for n documents
    val_template = ",".join([f'"<value for doc {i+1}>"' for i in range(n_docs)])

    prompt = f"""Compare these {n_docs} documents ({files_str}) across multiple dimensions.

Return ONLY valid JSON — no markdown, no explanation:
{{
  "mismatch": false,
  "compareRows": [
    {{"aspect":"Main topic","values":[{val_template}]}},
    {{"aspect":"Key arguments","values":[{val_template}]}},
    {{"aspect":"Target audience","values":[{val_template}]}},
    {{"aspect":"Writing style","values":[{val_template}]}},
    {{"aspect":"Scope / length","values":[{val_template}]}},
    {{"aspect":"Conclusion","values":[{val_template}]}}
  ]
}}

Base every value on actual document content. If only one document exists:
{{"mismatch":true,"suggestions":["default","glossary"]}}

DOCUMENTS:
{context}"""

    return _call_analyze(prompt)


def _analyze_glossary(context: str) -> dict:
    prompt = f"""Extract technical terminology and domain-specific jargon from these documents.

IMPORTANT rules for what to include and exclude:
- INCLUDE: technical terms, domain jargon, acronyms, specialised vocabulary, proper nouns for concepts
- INCLUDE: terms that a reader would need to look up or that are specific to the document's field
- EXCLUDE: common English words (even if capitalised): "document", "user", "data", "system", "process"
- EXCLUDE: basic nouns and everyday words that anyone would know
- EXCLUDE: names of people or organisations (unless they refer to a concept, e.g. "Marxism")

Return ONLY valid JSON — no markdown, no explanation:
{{
  "mismatch": false,
  "glossaryEntries": [
    {{"term":"<Technical Term>","definition":"<Clear concise definition based on how it is used in the document>"}}
  ]
}}

Extract 10-40 terms. Sort alphabetically by term.

If the documents contain NO meaningful technical terminology (e.g. fiction, casual text):
{{"mismatch":true,"suggestions":["default","compare"]}}

DOCUMENTS:
{context}"""

    return _call_analyze(prompt)


def _call_analyze(prompt: str) -> dict:
    """Call LLM for analysis and parse the JSON response. Returns a safe fallback on error."""
    try:
        raw = get_llm_response(
            messages=[
                {"role": "system", "content": "You are a document analysis assistant. Return ONLY valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=3000,
        )
        data = json.loads(_extract_json(raw or "{}"))
        return data
    except (json.JSONDecodeError, Exception) as e:
        logger.error("analyze error: %s", e)
        return {"mismatch": False}


# Mode Detection

def detect_mode(collection_id: str, file_names: list[str]) -> dict:
    """
    Analyse the uploaded documents to suggest a mode before the user types anything.

    Detects:
    - Resume + JD pair → suggest "resume"
    - Multiple docs on the same topic → suggest "compare"
    - Neither → suggestion = null (stay in default)

    This is called once on chat init and results in a friendly AI suggestion
    message in the chat UI with clickable yes/no buttons.
    """
    context = _build_all_context(collection_id)
    if not context:
        return {"suggestion": None, "reason": ""}

    n_docs    = len(file_names)
    files_str = ", ".join(file_names)

    prompt = f"""You are analysing {n_docs} uploaded document(s): {files_str}

Determine which of the following best describes the documents:

A) One document appears to be a RESUME/CV and another appears to be a JOB DESCRIPTION
   → return "resume"

B) There are 2 or more documents that cover SIMILAR or RELATED topics
   (e.g. two reports on the same subject, two articles on the same theme, lecture notes + textbook)
   → return "compare"

C) Neither of the above applies — documents are unrelated, or there is only one document
   → return null

Return ONLY this JSON:
{{
  "suggestion": "resume" | "compare" | null,
  "reason": "One sentence explaining why"
}}

DOCUMENT CONTENT:
{context}"""

    try:
        raw = get_llm_response(
            messages=[
                {"role": "system", "content": "Analyse documents and return ONLY valid JSON."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=200,
        )
        data = json.loads(_extract_json(raw or "{}"))
        return {
            "suggestion": data.get("suggestion"),
            "reason":     data.get("reason", ""),
        }
    except Exception as e:
        logger.error("detect_mode error: %s", e)
        return {"suggestion": None, "reason": ""}