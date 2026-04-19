import base64
import io
from docx import Document


def extract_text_from_docx(data_url: str) -> str:
    if "," in data_url:
        base64_str = data_url.split(",", 1)[1]
    else:
        base64_str = data_url

    docx_bytes = base64.b64decode(base64_str)
    docx_file = io.BytesIO(docx_bytes)

    document = Document(docx_file)

    paragraphs = [
        para.text
        for para in document.paragraphs
        if para.text.strip()
    ]

    full_text = "\n\n".join(paragraphs)

    if not full_text.strip():
        raise ValueError("No text could be extracted from this Word document.")

    return full_text


def extract_text_from_txt(data_url: str) -> str:
    if "," in data_url:
        base64_str = data_url.split(",", 1)[1]
    else:
        base64_str = data_url

    text_bytes = base64.b64decode(base64_str)
    return text_bytes.decode("utf-8", errors="replace")