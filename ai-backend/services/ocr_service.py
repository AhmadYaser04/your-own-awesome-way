"""OCR for transcript images using EasyOCR (Arabic + English).

EasyOCR أسهل في التثبيت على Windows من PaddleOCR ولا يحتاج C++ build tools.
يدعم العربية والإنجليزية بنفس الدقة تقريباً.
"""
from typing import List
import io
from PIL import Image
import numpy as np

import config

_reader = None


def _get_reader():
    """Lazy-load EasyOCR reader once (heavy: downloads models on first run)."""
    global _reader
    if _reader is None:
        import easyocr
        # EasyOCR languages: 'ar' للعربية، 'en' للإنجليزية
        langs: List[str] = []
        for l in config.OCR_LANGS:
            l = l.strip().lower()
            if l in ("arabic", "ar"):
                langs.append("ar")
            elif l in ("english", "en"):
                langs.append("en")
        if not langs:
            langs = ["ar", "en"]
        # gpu=False — يعمل على CPU بدون CUDA
        _reader = easyocr.Reader(langs, gpu=False, verbose=False)
    return _reader


def extract_text_from_image(image_bytes: bytes) -> str:
    """Run EasyOCR over the image and return text line-by-line."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img)

    reader = _get_reader()
    try:
        # detail=0 يرجع نصوص فقط (بدون bounding boxes)
        # paragraph=False للحفاظ على كل سطر منفصل (مهم لجداول كشوف العلامات)
        results = reader.readtext(arr, detail=0, paragraph=False)
    except Exception as e:
        print(f"[EasyOCR] failed: {e}")
        return ""

    pieces = [str(t).strip() for t in results if t and str(t).strip()]

    # De-duplicate while preserving order
    seen = set()
    out = []
    for p in pieces:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return "\n".join(out)
