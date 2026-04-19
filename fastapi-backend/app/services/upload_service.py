from app.schemas.summary import FilePayload
from app.utils.pdf import extract_text_from_pdf
from app.utils.docx import extract_text_from_docx, extract_text_from_txt
from app.rag.chunker import chunk_text
from app.rag.embedder import embed_chunks
from app.rag.vectordb import (
    make_collection_id,
    collection_exists,
    touch_collection,
    register_collection,
    store_chunks,
)
from app.core.config import get_settings

settings = get_settings()


def extract_text(file: FilePayload) -> str:
    """
    Routes a file to the correct text extractor based on its MIME type.

    This is the text extraction layer — it converts any supported file
    format into a plain string that the rest of the pipeline can use.
    """
    mime = file.type.lower()

    if mime == "application/pdf":
        return extract_text_from_pdf(file.dataUrl)

    elif mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return extract_text_from_docx(file.dataUrl)

    elif mime in ("text/plain", "text/markdown"):
        return extract_text_from_txt(file.dataUrl)

    else:
        raise ValueError(
            f"Unsupported file type: {mime}. "
            f"Accepted: PDF, DOCX, TXT, MD"
        )


def index_files(files: list[FilePayload]) -> dict:
    """
    The main pipeline: takes uploaded files and stores them in the vector DB.

    Full pipeline:
        files → extract text → chunk → embed → store in pgvector

    Returns a dict with the collection_id and stats.

    This function is idempotent — calling it twice with the same files
    is safe because collection_exists() short-circuits on the second call.
    "Idempotent" means: the result is the same no matter how many times you call it.
    """

    # Step 1: Generate a deterministic ID for this set of files.
    # If the user sends the same files again, we get the same ID.
    collection_id = make_collection_id(
        [{"name": f.name, "dataUrl": f.dataUrl} for f in files]
    )

    # Step 2: Check if we've already indexed these files.
    # If yes, just reset the TTL timer and return early.
    # This is a significant optimisation — re-embedding is expensive.
    if collection_exists(collection_id):
        touch_collection(collection_id)
        print(f"Collection {collection_id} already exists — skipping re-indexing")
        return {"collection_id": collection_id, "files_indexed": len(files), "total_chunks": 0, "cached": True}

    # Step 3: Process each file
    all_chunks = []
    for file in files:
        # 3a: Extract raw text
        print(f"Extracting text from {file.name}...")
        text = extract_text(file)

        # 3b: Split into chunks
        chunks = chunk_text(text, doc_name=file.name)
        print(f"{file.name} → {len(chunks)} chunks")

        all_chunks.extend(chunks)

    # Step 4: Embed all chunks in one batch (faster than per-file)
    print(f"Embedding {len(all_chunks)} chunks...")
    embedded_chunks = embed_chunks(all_chunks)

    # Step 5: Store in PostgreSQL / pgvector
    print(f"Storing in vector DB...")
    register_collection(collection_id, file_fingerprint=str(len(files)))
    store_chunks(collection_id, embedded_chunks)

    print(f"Indexed {len(files)} file(s) → {len(all_chunks)} chunks [{collection_id}]")

    return {
        "collection_id": collection_id,
        "files_indexed": len(files),
        "total_chunks": len(all_chunks),
        "cached": False,
    }