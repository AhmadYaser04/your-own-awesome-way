"""
Heuristic parser: turn raw OCR/PDF text into a list of {name, code, credits, grade}.

Rules (best-effort):
- A line containing a course code pattern (e.g. CS101, 2312402, COMP-203) is a course row.
- Credits = small int (1-6) appearing at the end of the row, or the word 'ساعات/credits'.
- Grade = letter (A, B+...) or numeric grade (50-100) near the end.
"""
import re
from typing import List, Dict

CODE_RE = re.compile(r"\b([A-Z]{2,4}[\s\-]?\d{2,4}|\d{6,8})\b")
GRADE_LETTER_RE = re.compile(r"\b([ABCDF][+\-]?)\b")
GRADE_NUM_RE = re.compile(r"\b([5-9][0-9]|100)\b")
CREDITS_RE = re.compile(r"\b([1-6])\s*(?:ساعات|credits?|cr|ساعة)?\b", re.IGNORECASE)

ARABIC_NAME_HINTS = ("مقدمة", "تحليل", "خوارزميات", "حاسبات", "برمجة", "ذكاء", "شبكات", "تعلم", "بيانات", "رياضيات")


def _clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def parse_courses_from_text(text: str) -> List[Dict]:
    courses: List[Dict] = []
    for raw_line in text.split("\n"):
        line = _clean(raw_line)
        if len(line) < 6:
            continue

        code_match = CODE_RE.search(line)
        if not code_match:
            # Fallback: if line contains an arabic course-name hint AND a small number, count as course
            if not any(h in line for h in ARABIC_NAME_HINTS):
                continue

        code = code_match.group(1) if code_match else ""

        # Credits: take the LAST small int (1-6) on the line
        credits = 3
        for m in CREDITS_RE.finditer(line):
            try:
                credits = int(m.group(1))
            except ValueError:
                pass

        # Grade: prefer letter, else numeric
        grade = ""
        gm = GRADE_LETTER_RE.search(line)
        if gm:
            grade = gm.group(1)
        else:
            gn = GRADE_NUM_RE.search(line)
            if gn:
                grade = gn.group(1)

        # Name = whatever remains after stripping code/grade/digits
        name = line
        if code:
            name = name.replace(code, " ")
        if grade:
            name = re.sub(rf"\b{re.escape(grade)}\b", " ", name)
        name = re.sub(r"\b\d+\b", " ", name)
        name = _clean(name)

        if len(name) < 3:
            continue

        courses.append({
            "name": name,
            "code": code,
            "credits": credits,
            "grade": grade,
        })

    return courses
