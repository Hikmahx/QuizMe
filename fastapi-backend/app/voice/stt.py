"""
Speech-to-text providers for Voice RAG.
"""

from __future__ import annotations

import io
import logging
import os
import tempfile

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
_whisper_model = None


def transcribe(audio_bytes: bytes) -> str:
    """
    Convert audio bytes into text.
    Uses AssemblyAI first when configured, otherwise faster-whisper.
    """
    """
    Convert audio bytes into a text transcript.

    Tries AssemblyAI first (if API key is configured).
    Falls back to faster-whisper if:
      - No API key is set, OR
      - AssemblyAI fails at runtime (expired trial, quota exceeded, network error)
    """
    if settings.ASSEMBLYAI_API_KEY:
        try:
            logger.info("STT provider: AssemblyAI")
            return _transcribe_with_assemblyai(audio_bytes)
        except Exception as exc:
            logger.warning("AssemblyAI failed, falling back to faster-whisper: %s", exc)

    logger.info("STT provider: faster-whisper")
    return _transcribe_with_whisper(audio_bytes)


def _transcribe_with_assemblyai(audio_bytes: bytes) -> str:
    """
    AssemblyAI STT — sends audio to their cloud API.

    AssemblyAI needs a URL, not raw bytes. So we:
    1. Upload the audio bytes to their servers to get a URL
    2. Submit a transcription job with that URL
    3. Poll until done and return the transcript
    """
    
    import assemblyai as aai

    aai.settings.api_key = settings.ASSEMBLYAI_API_KEY
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "recording.webm"

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_file)
    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI transcription failed: {transcript.error}")
    return (transcript.text or "").strip()


def _transcribe_with_whisper(audio_bytes: bytes) -> str:
    """
    faster-whisper STT — runs the Whisper model locally on your machine.

    No API key needed. The model is downloaded on first run and cached.
    compute_type="int8" is CPU-friendly. Use "float16" if you have a GPU.
    """
    
    model = _get_whisper_model()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, _ = model.transcribe(tmp_path, language="en")
        return " ".join(seg.text.strip() for seg in segments).strip()
    finally:
        os.unlink(tmp_path)


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel

        logger.info("Loading faster-whisper model: %s", settings.WHISPER_MODEL_SIZE)
        _whisper_model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device="cpu",
            compute_type="int8",
        )
    return _whisper_model
