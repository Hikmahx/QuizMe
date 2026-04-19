from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import get_settings

settings = get_settings()


def chunk_text(text: str, doc_name: str) -> list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,       # max characters per chunk
        chunk_overlap=settings.CHUNK_OVERLAP, # characters shared between adjacent chunks
        length_function=len,                  # use character count (not token count)
        separators=["\n\n", "\n", " ", ""],   # try these separators in order
    )

    # split_text returns a list of strings
    raw_chunks: list[str] = splitter.split_text(text)

    # Enrich each chunk with metadata
    chunks = [
        {
            "content": chunk,
            "doc_name": doc_name,
            "chunk_index": index,
        }
        for index, chunk in enumerate(raw_chunks)
    ]

    return chunks