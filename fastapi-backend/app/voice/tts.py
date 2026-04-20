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
    Cartesia TTS (SDK v3+).

    Breaking changes from v2:
      - voice_id= is gone; pass voice={"mode": "id", "id": "..."}
      - tts.bytes() returns an iterator of chunks, not a single bytes object
    """
    from cartesia import Cartesia

    client = Cartesia(api_key=settings.CARTESIA_API_KEY)
    chunks = client.tts.bytes(
        model_id="sonic-2",
        transcript=text,
        voice={"mode": "id", "id": settings.CARTESIA_VOICE_ID},
        output_format={
            "container": "raw",
            "encoding": "pcm_f32le",
            "sample_rate": 44100,
        },
    )
    pcm_bytes = b"".join(chunks)
    wav_bytes = _pcm_to_wav(pcm_bytes, sample_rate=44100, channels=1, sampwidth=4)
    return wav_bytes, "audio/wav"


def _synthesize_with_edge(text: str) -> tuple[bytes, str]:
    """
    Edge TTS — Microsoft's free neural TTS, no API key needed.

    Two known pitfalls that are both fixed here:

    1. asyncio conflict — uvicorn owns the event loop on its threads, so
       asyncio.run() raises 'cannot run nested event loop'. Fix: always
       dispatch to a ThreadPoolExecutor thread that creates its own fresh loop.

    2. edge-tts >=7.0.0 DRM token (Sec-MS-GEC) is rejected by Microsoft's
       servers with 403. Fix: pin to edge-tts==6.1.12 in requirements.txt,
       which uses the stable non-DRM auth flow. If you see 403 errors, run:
           pip install 'edge-tts==6.1.12'

    Voice options (set EDGE_TTS_VOICE in .env):
      "en-US-JennyNeural"    — warm, natural female (default)
      "en-US-GuyNeural"      — natural male
      "en-GB-SoniaNeural"    — British female
      "en-GB-RyanNeural"     — British male
      Full list: edge-tts --list-voices
    """
    import concurrent.futures
    import edge_tts

    async def _run() -> bytes:
        communicate = edge_tts.Communicate(text, voice=settings.EDGE_TTS_VOICE)
        chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        return b"".join(chunks)

    def _run_in_new_loop() -> bytes:
        # Isolated loop — no conflict with uvicorn's loop
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(_run())
        finally:
            loop.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        audio_bytes = pool.submit(_run_in_new_loop).result()

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
