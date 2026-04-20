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
    Convert audio bytes into a text transcript.
    Tries AssemblyAI first, falls back to faster-whisper (if no API key, expired trial, quota exceeded, network error, etc).
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
    AssemblyAI STT.

    SDK >=0.62 requires speech_models (plural, List[str]).
    Valid values from the API: "universal-2", "universal-3-pro", "slam-1"
    "universal-2" is the recommended default — high accuracy, fast, cost-effective.
    """
    import assemblyai as aai

    aai.settings.api_key = settings.ASSEMBLYAI_API_KEY
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = "recording.webm"

    config = aai.TranscriptionConfig(speech_models=["universal-2"])
    transcriber = aai.Transcriber(config=config)
    transcript = transcriber.transcribe(audio_file)
    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI transcription failed: {transcript.error}")
    return (transcript.text or "").strip()


def _transcribe_with_whisper(audio_bytes: bytes) -> str:
    """
    faster-whisper STT — runs Whisper locally, no API key needed.
    Model is downloaded from HuggingFace on first run and cached locally.
    """
    model = _get_whisper_model()

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        segments, _ = model.transcribe(tmp_path, language="en")
        # consume the generator before the file is deleted
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
