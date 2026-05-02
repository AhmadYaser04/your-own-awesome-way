"""
FastAPI entrypoint.
Endpoints:
  GET  /api/health
  POST /api/extract        — OCR/PDF -> list of courses
  POST /api/match          — semantic match: student courses -> AUT courses
  POST /api/suggest-merges — N->1 merge suggestions
"""
from typing import List, Optional
import io

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import config
from services.ocr_service import extract_text_from_image
from services.pdf_extractor import extract_text_from_pdf
from services.table_parser import parse_courses_from_text
from services.matcher import match_courses, suggest_merges
from app.routers import auth as auth_router

app = FastAPI(
    title="AUT Equivalency AI Backend",
    description="Local AI server for course equivalency — graduation project",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router (register / login / me)
app.include_router(auth_router.router)

# ---------- Schemas ----------

class StudentCourse(BaseModel):
    name: str
    code: Optional[str] = ""
    credits: float = 3
    grade: Optional[str] = ""

class AutCourse(BaseModel):
    id: str
    code: str
    name_ar: str
    name_en: Optional[str] = ""
    credits: int = 3
    description_ar: Optional[str] = ""

class MatchRequest(BaseModel):
    student_courses: List[StudentCourse]
    aut_courses: List[AutCourse]
    top_k: int = Field(3, ge=1, le=10)

class MatchSuggestion(BaseModel):
    aut_course_id: str
    aut_code: str
    aut_name: str
    similarity: float

class StudentMatchResult(BaseModel):
    student_course: StudentCourse
    suggestions: List[MatchSuggestion]

class MergeRequest(BaseModel):
    student_courses: List[StudentCourse]
    aut_courses: List[AutCourse]

class MergeSuggestion(BaseModel):
    student_course_indices: List[int]
    aut_course_id: str
    aut_code: str
    aut_name: str
    total_student_credits: float
    aut_credits: int
    avg_similarity: float
    reason: str

# ---------- Endpoints ----------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "aut-equivalency-ai-backend", "version": "1.0.0"}

@app.post("/api/extract")
async def extract(file: UploadFile = File(...)):
    """Extract courses from a transcript image or PDF using OCR."""
    content = await file.read()
    filename = (file.filename or "").lower()
    try:
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(io.BytesIO(content))
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp", ".bmp")):
            text = extract_text_from_image(content)
        else:
            raise HTTPException(400, "Unsupported file type. Use PDF or image.")
    except Exception as e:
        raise HTTPException(500, f"Extraction failed: {e}")

    courses = parse_courses_from_text(text)
    return {"raw_text": text[:4000], "courses": courses, "count": len(courses)}

@app.post("/api/match", response_model=List[StudentMatchResult])
def match(req: MatchRequest):
    """Semantic match each student course to top-K AUT courses."""
    if not req.aut_courses:
        raise HTTPException(400, "aut_courses is empty")
    results = match_courses(
        [c.model_dump() for c in req.student_courses],
        [c.model_dump() for c in req.aut_courses],
        top_k=req.top_k,
    )
    return results

@app.post("/api/suggest-merges", response_model=List[MergeSuggestion])
def merges(req: MergeRequest):
    """Suggest N->1 merges (e.g. two student 1.5h courses -> one AUT 3h)."""
    if not req.aut_courses:
        raise HTTPException(400, "aut_courses is empty")
    suggestions = suggest_merges(
        [c.model_dump() for c in req.student_courses],
        [c.model_dump() for c in req.aut_courses],
    )
    return suggestions
