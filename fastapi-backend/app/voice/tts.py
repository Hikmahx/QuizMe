"""
Text-to-speech providers for Voice RAG.
"""

from __future__ import annotations

import asyncio
import logging
import struct

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def synthesize(text: str) -> tuple[bytes, str]:
    """
    Convert text into audio bytes and return (bytes, mime_type).
    Uses Cartesia first when configured, otherwise Edge TTS.
    """
    if settings.CARTESIA_API_KEY:
        try:
            logger.info("TTS provider: Cartesia")
            return _synthesize_with_cartesia(text)
        except Exception as exc:
            logger.warning("Cartesia failed, falling back to Edge TTS: %s", exc)

    logger.info("TTS provider: Edge TTS")
    return _synthesize_with_edge(text)


def _synthesize_with_cartesia(text: str) -> tuple[bytes, str]:
    """
    Cartesia TTS — sends text to their cloud API, gets back high-quality audio.
    Returns raw PCM bytes wrapped into a WAV file.
    """
    
    from cartesia import Cartesia

    client = Cartesia(api_key=settings.CARTESIA_API_KEY)
    pcm_bytes = client.tts.bytes(
        model_id="sonic-2",
        transcript=text,
        voice_id=settings.CARTESIA_VOICE_ID,
        output_format={
            "container": "raw",
            "encoding": "pcm_f32le",
            "sample_rate": 44100,
        },
    )
    wav_bytes = _pcm_to_wav(pcm_bytes, sample_rate=44100, channels=1, sampwidth=4)
    return wav_bytes, "audio/wav"


def _synthesize_with_edge(text: str) -> tuple[bytes, str]:
    """
    Edge TTS — Microsoft's free neural TTS. No API key needed.

    Uses the same neural engine as Azure Cognitive Services.
    Requires internet. Returns an MP3 file directly (no conversion needed).

    Voice options (set EDGE_TTS_VOICE in config):
      "en-US-JennyNeural"    — warm, natural female voice (default)
      "en-US-GuyNeural"      — natural male voice
      "en-GB-SoniaNeural"    — British female
      "en-GB-RyanNeural"     — British male
      Full list: run `edge-tts --list-voices` in terminal
    """
    
    import edge_tts

    async def _run() -> bytes:
        communicate = edge_tts.Communicate(text, voice=settings.EDGE_TTS_VOICE)
        chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        return b"".join(chunks)

    try:
        audio_bytes = asyncio.run(_run())
    except RuntimeError:
        import concurrent.futures

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            audio_bytes = pool.submit(asyncio.run, _run()).result()

    return audio_bytes, "audio/mpeg"


def _pcm_to_wav(pcm_bytes: bytes, sample_rate: int, channels: int, sampwidth: int) -> bytes:
    """Wraps raw PCM bytes into a WAV file by prepending the 44-byte header."""
    
    data_size = len(pcm_bytes)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        data_size + 36,
        b"WAVE",
        b"fmt ",
        16,
        3,
        channels,
        sample_rate,
        sample_rate * channels * sampwidth,
        channels * sampwidth,
        sampwidth * 8,
        b"data",
        data_size,
    )
    return header + pcm_bytes
