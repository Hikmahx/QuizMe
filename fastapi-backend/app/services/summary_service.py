from app.rag.retriever import retrieve_all_chunks
from app.rag.vectordb import make_collection_id, collection_exists, touch_collection
from app.services.upload_service import index_files
from app.schemas.summary import FilePayload, SingleSummary
from app.core.config import get_settings
from app.llm.router import get_llm_response

settings = get_settings()

LENGTH_INSTRUCTIONS = {
    "short":  "Write a concise summary in 3-5 sentences (approximately 80-120 words).",
    "medium": "Write a clear summary in 2-3 short paragraphs (approximately 200-300 words).",
    "long":   "Write a detailed summary in 4-6 paragraphs (approximately 400-600 words).",
}


def _get_collection_id(files: list[FilePayload]) -> str:
    """
    Ensures files are indexed before use.
    If the collection already exists, just touch it. If not, index first.
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
    Summarise a single document's chunks via the LLM router (with fallback).
    We use ALL chunks — not top-k — because we're summarising the whole doc.
    """
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

    return get_llm_response(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=settings.LLM_MAX_TOKENS,
    ).strip()


def _summarise_combined(all_chunks: list[dict], length: str) -> tuple[str, bool]:
    """
    Summarise multiple documents as one unified summary.
    Returns (summary_text, fallback_triggered).

    fallback_triggered = True means the AI detected the docs are unrelated
    and the frontend should switch to doc-by-doc view.
    """
    docs_context: dict[str, list[str]] = {}
    for chunk in all_chunks:
        name = chunk["doc_name"]
        if name not in docs_context:
            docs_context[name] = []
        docs_context[name].append(chunk["content"])

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

    result = get_llm_response(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=settings.LLM_MAX_TOKENS,
    ).strip()

    if "UNRELATED_DOCUMENTS" in result:
        return "", True

    return result, False


def generate_summary(
    files: list[FilePayload],
    length: str,
    style: str,
) -> dict:
    """
    Main summary service function, called by the route handler.
    Returns a dict matching the SummaryResponse schema.
    """
    collection_id = _get_collection_id(files)
    all_chunks = retrieve_all_chunks(collection_id)

    if not all_chunks:
        raise ValueError("No content found. Please re-upload your files.")

    # Combined mode
    if style == "combined" and len(files) > 1:
        summary_text, fallback = _summarise_combined(all_chunks, length)
        if fallback:
            style = "doc-by-doc"  # fall through to doc-by-doc below
        else:
            return {
                "collection_id": collection_id,
                "style": "combined",
                "summaries": [SingleSummary(doc_name="Combined Summary", summary=summary_text)],
                "fallback": False,
            }

    # Doc-by-doc mode (and fallback from combined)
    if style in ("doc-by-doc", "default") or len(files) == 1:
        fell_back_from_combined = style == "doc-by-doc" and len(files) > 1

        chunks_by_doc: dict[str, list[dict]] = {}
        for chunk in all_chunks:
            name = chunk["doc_name"]
            if name not in chunks_by_doc:
                chunks_by_doc[name] = []
            chunks_by_doc[name].append(chunk)

        summaries = []
        for doc_name, doc_chunks in chunks_by_doc.items():
            summary_text = _summarise_single_doc(doc_chunks, length, doc_name)
            summaries.append(SingleSummary(doc_name=doc_name, summary=summary_text))

        return {
            "collection_id": collection_id,
            "style": "doc-by-doc" if len(files) > 1 else "default",
            "summaries": summaries,
            "fallback": fell_back_from_combined,
        }

    raise ValueError(f"Unknown summary style: {style}")
