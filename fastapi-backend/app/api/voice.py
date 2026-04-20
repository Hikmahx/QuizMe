"""
voice.py — FastAPI router for all voice-related endpoints.

Three endpoints:
  POST /api/voice/transcribe/  — audio bytes → transcript text
  POST /api/voice/answer/      — question + collection_id → answer text
  POST /api/voice/speak/       — answer text → audio bytes
"""

import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import Response

from app.schemas.voice import AnswerRequest, SpeakRequest
from app.services.voice_service import transcribe, answer_from_docs, speak

logger = logging.getLogger(__name__)
router = APIRouter()


# Endpoint 1: Transcribe

@router.post("/transcribe/")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Receives an audio file from the browser and returns a transcript.

    Request: multipart/form-data with field "audio" (audio file)
    Response: { "transcript": "what the user said" }
    """
    try:
        audio_bytes = await audio.read()

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        transcript = transcribe(audio_bytes, mime_type=audio.content_type)
        return {"transcript": transcript}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint 2: RAG Answer

@router.post("/answer/")
async def get_rag_answer(body: AnswerRequest):
    """
    Receives a question and document collection, runs RAG, returns an answer.

    Request:  { "question": "...", "collection_id": "abc123" }
    Response: { "answer": "According to your documents..." }
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not body.collection_id.strip():
        raise HTTPException(status_code=400, detail="collection_id is required")

    try:
        answer = answer_from_docs(body.question, body.collection_id)
        return {"answer": answer}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG answer error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Endpoint 3: Text-to-Speech

@router.post("/speak/")
async def synthesize_speech(body: SpeakRequest):
    """
    Receives text and returns audio bytes the browser can play.

    Request:  { "text": "According to your documents..." }
    Response: audio/wav bytes
    """
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        audio_bytes, mime_type = speak(body.text)
        return Response(
            content=audio_bytes,
            media_type=mime_type,
            headers={"Cache-Control": "no-cache"},
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
