"""
Sentence-Transformers wrapper.
Uses paraphrase-multilingual-MiniLM-L12-v2 (Arabic + English).
Caches the model after first load.
"""
from typing import List
import numpy as np
import config

_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        print(f"[embedding] Loading model: {config.EMBEDDING_MODEL} (one-time, cached)...")
        _model = SentenceTransformer(config.EMBEDDING_MODEL)
    return _model


def embed(texts: List[str]) -> np.ndarray:
    """Encode texts to L2-normalized embeddings (rows)."""
    model = get_model()
    vectors = model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False,
        convert_to_numpy=True,
    )
    return vectors


def cosine_sim(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Pairwise cosine similarity matrix between rows of a and b (already normalized)."""
    return a @ b.T
