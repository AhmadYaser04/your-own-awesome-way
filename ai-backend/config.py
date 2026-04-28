"""Configuration loaded from .env"""
import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",")]

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
OCR_LANGS = [l.strip() for l in os.getenv("OCR_LANGS", "arabic,en").split(",")]

MIN_SIMILARITY = float(os.getenv("MIN_SIMILARITY", "0.55"))
MERGE_CREDIT_TOLERANCE = float(os.getenv("MERGE_CREDIT_TOLERANCE", "1.5"))
