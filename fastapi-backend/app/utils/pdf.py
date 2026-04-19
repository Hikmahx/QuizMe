import base64
import io
import pdfplumber


def extract_text_from_pdf(data_url: str) -> str:

    if "," in data_url:
        base64_str = data_url.split(",", 1)[1]
    else:
        base64_str = data_url

    pdf_bytes = base64.b64decode(base64_str)
    pdf_file = io.BytesIO(pdf_bytes)


    extracted_pages = []
    with pdfplumber.open(pdf_file) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:  # some pages may be blank or image-only
                extracted_pages.append(text)

    full_text = "\n\n".join(extracted_pages)

    if not full_text.strip():
        raise ValueError(
            "No text could be extracted from this PDF. "
            "It may be a scanned image PDF without OCR."
        )

    return full_text