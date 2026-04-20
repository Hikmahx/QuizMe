"""
Voice service orchestration for Voice RAG. Handles all voice AI logic for QuizMe.
Keeps the RAG answer generation logic and delegates STT/TTS to app.voice.

Three responsibilities:
  1. transcribe(audio_bytes) → text          (STT: AssemblyAI or faster-whisper)
  2. answer_from_docs(question, id) → text   (RAG: pgvector + Groq)
  3. speak(text) → audio_bytes               (TTS: Cartesia or Edge TTS)
"""
import logging

from app.core.config import get_settings
from app.rag.retriever import retrieve_chunks
from app.voice.stt import transcribe as stt_transcribe
from app.voice.tts import synthesize as tts_synthesize
from groq import Groq

logger = logging.getLogger(__name__)
settings = get_settings()


# SECTION 1: Speech-to-Text (STT)

def transcribe(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    # mime_type is kept for compatibility with current API usage.
    _ = mime_type
    return stt_transcribe(audio_bytes)


# SECTION 2: RAG-powered Answer Generation

def answer_from_docs(question: str, collection_id: str) -> str:
    """
    Given a spoken question and a collection of uploaded documents,
    retrieve the most relevant chunks and ask Groq to answer.

    RAG pipeline:
      1. Embed the question
      2. Find the closest document chunks in pgvector
      3. Build a prompt with those chunks as context
      4. Send to Groq (llama-3.3-70b)
      5. Return the answer text
    """
    chunks = retrieve_chunks(collection_id, question)

    if not chunks:
        return (
            "I couldn't find relevant information in your documents "
            "to answer that question. Could you try rephrasing it?"
        )

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(
            f"[Source {i}: {chunk['doc_name']}]\n{chunk['content']}"
        )
    context = "\n\n".join(context_parts)

    client = Groq(api_key=settings.GROQ_API_KEY)

    system_prompt = """You are a helpful study assistant.
Answer the student's question using ONLY the document context provided below.
Keep your answer clear, concise, and spoken-friendly — avoid bullet points or
markdown formatting since your answer will be read aloud.
If the context doesn't contain enough information, say so honestly."""

    user_prompt = f"""Document context:
{context}

Student's question: {question}

Answer:"""

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=400,
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()


# SECTION 3: Text-to-Speech (TTS)

def speak(text: str) -> tuple[bytes, str]:
    """
    Convert text into audio bytes.

    Tries Cartesia first (if API key is configured).
    Falls back to Edge TTS if:
      - No API key is set, OR
      - Cartesia fails at runtime (expired trial, quota exceeded, network error)

    Edge TTS is Microsoft's neural TTS — same engine as Azure Cognitive Services,
    offered free with no API key. Requires internet but sounds excellent.
    """
    
    return tts_synthesize(text)
