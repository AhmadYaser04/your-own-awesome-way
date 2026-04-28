"""OCR for transcript images using PaddleOCR (Arabic + English)."""
from typing import Optional
import io
from PIL import Image
import numpy as np

import config

_ocr_instances = {}

def _get_ocr(lang: str = "arabic"):
    """Lazy-load PaddleOCR for a given language."""
    global _ocr_instances
    if lang not in _ocr_instances:
        from paddleocr import PaddleOCR
        _ocr_instances[lang] = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    return _ocr_instances[lang]


def extract_text_from_image(image_bytes: bytes) -> str:
    """Run OCR over the image with all configured languages and merge results."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(img)

    pieces = []
    for lang in config.OCR_LANGS:
        try:
            ocr = _get_ocr(lang)
            result = ocr.ocr(arr, cls=True)
            if not result:
                continue
            # PaddleOCR returns list[list[ [bbox, (text, conf)] ]]
            for page in result:
                if not page:
                    continue
                for line in page:
                    try:
                        text = line[1][0]
                        if text and text.strip():
                            pieces.append(text.strip())
                    except (IndexError, TypeError):
                        continue
        except Exception as e:
            print(f"[OCR:{lang}] failed: {e}")

    # De-duplicate while preserving order
    seen = set()
    out = []
    for p in pieces:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return "\n".join(out)
