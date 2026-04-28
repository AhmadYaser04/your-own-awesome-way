"""Extract text + tables from PDF transcripts using pdfplumber."""
from typing import IO


def extract_text_from_pdf(stream: IO[bytes]) -> str:
    import pdfplumber

    chunks = []
    with pdfplumber.open(stream) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            chunks.append(text)
            # Also extract any tables and append as TSV-like text
            for table in page.extract_tables() or []:
                for row in table:
                    cells = [(c or "").strip() for c in row]
                    if any(cells):
                        chunks.append("\t".join(cells))
    return "\n".join(chunks)
