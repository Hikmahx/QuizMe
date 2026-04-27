import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.qa import (
    QAChatRequest, QAAnalyzeRequest,
    QADetectRequest, QADetectResponse,
)
from app.services.qa_service import stream_chat, analyze_mode, detect_mode
from app.rag.vectordb import collection_exists

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat/")
def qa_chat(body: QAChatRequest):
    """
    Streaming RAG-powered chat.

    The latest user message is used as the RAG query.
    Relevant document chunks are retrieved and injected as context.
    The full message history is passed to LLM for follow-up awareness.

    Returns a streaming text/plain response the frontend reads chunk-by-chunk.

    Special tokens the frontend handles:
      [QUIZ_CTA]      — shows a "Quiz Me" button after the message
      [QUIZ_REDIRECT] — shows a "Go to Quiz" button and navigates to the quiz
    """
    if not collection_exists(body.collection_id):
        raise HTTPException(
            status_code=404,
            detail="Collection not found. Please re-upload your documents.",
        )

    if not body.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    messages   = [{"role": m.role, "content": m.content} for m in body.messages]
    file_names = list({m.content.split("]")[0].lstrip("[From: ") for m in body.messages if "[From:" in m.content}) or []

    try:
        return StreamingResponse(
            stream_chat(
                collection_id=body.collection_id,
                mode=body.mode,
                messages=messages,
                file_names=file_names,
            ),
            media_type="text/plain; charset=utf-8",
        )
    except Exception as e:
        logger.error("qa_chat error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/")
def qa_analyze(body: QAAnalyzeRequest):
    """
    Run mode-specific analysis and return left-panel content.

    resume  → agentSteps  (skill gap findings, suggestions, cover letter status)
    compare → compareRows (structured comparison table, one column per document)
    glossary → glossaryEntries (technical terms + definitions, alphabetical)

    This is called when the user switches to a non-default mode, and again
    when the user changes their file selection.
    """
    if not collection_exists(body.collection_id):
        raise HTTPException(
            status_code=404,
            detail="Collection not found. Please re-upload your documents.",
        )

    try:
        result = analyze_mode(
            collection_id=body.collection_id,
            mode=body.mode,
            file_names=body.file_names,
        )
        return result
    except Exception as e:
        logger.error("qa_analyze error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect/", response_model=QADetectResponse)
def qa_detect(body: QADetectRequest):
    """
    Auto mode detection — called once on chat init.

    Reads all document chunks and determines whether the uploaded files suggest
    a specific mode (resume mode for resume+JD pairs, compare mode for similar docs).

    Returns a suggestion + reason that the frontend displays as a friendly
    "Would you like to switch to X mode?" message with yes/no buttons.

    Returns {"suggestion": null} if no strong signal is detected.
    """
    if not collection_exists(body.collection_id):
        # Not an error — just return no suggestion
        return QADetectResponse(suggestion=None, reason="")

    try:
        result = detect_mode(
            collection_id=body.collection_id,
            file_names=body.file_names,
        )
        return QADetectResponse(
            suggestion=result.get("suggestion"),
            reason=result.get("reason", ""),
        )
    except Exception as e:
        logger.error("qa_detect error: %s", e)
        return QADetectResponse(suggestion=None, reason="")