"""Configuration loaded from .env"""
import os
from dotenv import load_dotenv

load_dotenv()

# ===== Server =====
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:8080,http://localhost:3000"
).split(",")]

# ===== Database =====
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:123456@localhost:5432/aut_equivalency"
)

# ===== JWT =====
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# ===== AI Models =====
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
OCR_LANGS = [l.strip() for l in os.getenv("OCR_LANGS", "arabic,en").split(",")]

# ===== Matching thresholds =====
MIN_SIMILARITY = float(os.getenv("MIN_SIMILARITY", "0.55"))
MERGE_CREDIT_TOLERANCE = float(os.getenv("MERGE_CREDIT_TOLERANCE", "1.5"))
