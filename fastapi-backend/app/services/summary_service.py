from groq import Groq
from app.rag.retriever import retrieve_all_chunks
from app.rag.vectordb import make_collection_id, collection_exists, touch_collection
from app.services.upload_service import index_files
from app.schemas.summary import FilePayload, SingleSummary
from app.core.config import get_settings

settings = get_settings()

groq_client = Groq(api_key=settings.GROQ_API_KEY)

LENGTH_INSTRUCTIONS = {
    "short":  "Write a concise summary in 3-5 sentences (approximately 80-120 words).",
    "medium": "Write a clear summary in 2-3 short paragraphs (approximately 200-300 words).",
    "long":   "Write a detailed summary in 4-6 paragraphs (approximately 400-600 words).",
}


def _get_collection_id(files: list[FilePayload]) -> str:
    """
    Ensures the files are indexed before we try to use them.
    If the collection already exists, just touch it. If not, index first.

    This is a safety net — the frontend should always call /api/upload first,
    but this makes the summary endpoint self-contained.
    """
    collection_id = make_collection_id(
        [{"name": f.name, "dataUrl": f.dataUrl} for f in files]
    )

    if not collection_exists(collection_id):
        index_files(files)
    else:
        touch_collection(collection_id)

    return collection_id


def _summarise_single_doc(chunks: list[dict], length: str, doc_name: str) -> str:
    """
    Calls Groq to summarise a single document's chunks.

    We join all chunks into one big context block and ask the AI to summarise it.
    For summary (unlike Q&A), we want ALL chunks — not just the top-k relevant ones —
    because we are summarising the whole document, not answering a specific question.
    """

    # Join all chunks into one context string.
    # We label each chunk with its source so the AI knows it is one document.
    context = "\n\n---\n\n".join(chunk["content"] for chunk in chunks)
    length_instruction = LENGTH_INSTRUCTIONS.get(length, LENGTH_INSTRUCTIONS["medium"])

    prompt = f"""\
You are a document summarisation assistant.
Below is the full text of a document called "{doc_name}".
{length_instruction}
Focus on the main ideas, key points, and important conclusions.
Do not add information that is not in the document.

DOCUMENT:
{context}

SUMMARY:"""

    response = groq_client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=settings.GROQ_MAX_TOKENS,
        temperature=settings.GROQ_TEMPERATURE,
    )

    # response.choices[0].message.content is the AI's reply text.
    return response.choices[0].message.content.strip()


def _summarise_combined(all_chunks: list[dict], length: str) -> tuple[str, bool]:
    """
    Summarises multiple documents as one unified summary.
    Returns (summary_text, fallback_triggered).

    fallback_triggered = True means the AI detected the docs are unrelated,
    and the frontend should switch to doc-by-doc view.
    """

    # Group chunks by document
    docs_context = {}
    for chunk in all_chunks:
        name = chunk["doc_name"]
        if name not in docs_context:
            docs_context[name] = []
        docs_context[name].append(chunk["content"])

    # Build a context block with clear doc separations
    context_parts = []
    for doc_name, chunks in docs_context.items():
        doc_text = "\n\n".join(chunks)
        context_parts.append(f"=== Document: {doc_name} ===\n\n{doc_text}")

    context = "\n\n".join(context_parts)
    length_instruction = LENGTH_INSTRUCTIONS.get(length, LENGTH_INSTRUCTIONS["medium"])

    prompt = f"""\
You are summarising multiple documents together.
{length_instruction}
If the documents are clearly unrelated topics, respond with exactly:
UNRELATED_DOCUMENTS

Otherwise, write a unified summary covering all documents.

DOCUMENTS:
{context}

SUMMARY:"""

    response = groq_client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=settings.GROQ_MAX_TOKENS,
        temperature=settings.GROQ_TEMPERATURE,
    )

    result = response.choices[0].message.content.strip()

    if "UNRELATED_DOCUMENTS" in result:
        return "", True  # Signal fallback to the route handler

    return result, False


def generate_summary(
    files: list[FilePayload],
    length: str,
    style: str,
) -> dict:
    """
    The main summary service function, called by the route handler.

    Returns a dict matching the SummaryResponse schema.
    """

    collection_id = _get_collection_id(files)

    # Get all stored chunks for this collection
    all_chunks = retrieve_all_chunks(collection_id)

    if not all_chunks:
        raise ValueError("No content found. Please re-upload your files.")

    # Combined mode 
    if style == "combined" and len(files) > 1:
        summary_text, fallback = _summarise_combined(all_chunks, length)

        if fallback:
            # AI said docs are unrelated — fall back to doc-by-doc
            style = "doc-by-doc"
        else:
            return {
                "collection_id": collection_id,
                "style": "combined",
                "summaries": [SingleSummary(doc_name="Combined Summary", summary=summary_text)],
                "fallback": False,
            }

    # Doc-by-doc mode (and fallback from combined)
    if style in ("doc-by-doc", "default") or len(files) == 1:
        summaries = []
        fell_back_from_combined = style == "doc-by-doc" and len(files) > 1

        # Group chunks by document
        chunks_by_doc: dict[str, list[dict]] = {}
        for chunk in all_chunks:
            name = chunk["doc_name"]
            if name not in chunks_by_doc:
                chunks_by_doc[name] = []
            chunks_by_doc[name].append(chunk)

        # Summarise each document separately
        for doc_name, doc_chunks in chunks_by_doc.items():
            print(f"Summarising {doc_name}...")
            summary_text = _summarise_single_doc(doc_chunks, length, doc_name)
            summaries.append(SingleSummary(doc_name=doc_name, summary=summary_text))

        # Determine the response style:
        # - Single doc always returns "default" (not "doc-by-doc")
        # - Multi-doc returns whatever style was used
        response_style = "doc-by-doc" if len(files) > 1 else "default"

        return {
            "collection_id": collection_id,
            "style": response_style,
            "summaries": summaries,
            # fallback is only True when we fell back from a combined request
            "fallback": fell_back_from_combined,
        }

    raise ValueError(f"Unknown summary style: {style}")
