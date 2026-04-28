"""
Matching engine:
  match_courses     — top-K AUT match per student course (by semantic similarity)
  suggest_merges    — propose N->1 merges where 2-3 student courses combined match one AUT course
"""
from typing import List, Dict
from itertools import combinations
import numpy as np

import config
from services.embedding_service import embed, cosine_sim


def _aut_text(c: Dict) -> str:
    parts = [c.get("name_ar", ""), c.get("name_en", ""), c.get("description_ar", "")]
    return " — ".join(p for p in parts if p)


def _student_text(c: Dict) -> str:
    return c.get("name", "")


def match_courses(student: List[Dict], aut: List[Dict], top_k: int = 3) -> List[Dict]:
    if not student or not aut:
        return []

    s_texts = [_student_text(c) for c in student]
    a_texts = [_aut_text(c) for c in aut]

    s_vec = embed(s_texts)
    a_vec = embed(a_texts)
    sim = cosine_sim(s_vec, a_vec)  # shape: [n_student, n_aut]

    results = []
    for i, sc in enumerate(student):
        scores = sim[i]
        order = np.argsort(-scores)[:top_k]
        suggestions = []
        for j in order:
            score = float(scores[j])
            if score < config.MIN_SIMILARITY:
                continue
            ac = aut[int(j)]
            suggestions.append({
                "aut_course_id": ac["id"],
                "aut_code": ac["code"],
                "aut_name": ac.get("name_ar") or ac.get("name_en", ""),
                "similarity": round(score, 4),
            })
        results.append({
            "student_course": sc,
            "suggestions": suggestions,
        })
    return results


def suggest_merges(student: List[Dict], aut: List[Dict]) -> List[Dict]:
    """
    Brute-force search over pairs and triples of student courses.
    For each combination, embed the concatenated text and compare against each AUT course.
    Propose a merge when:
      - cosine similarity >= MIN_SIMILARITY
      - sum of credits is within MERGE_CREDIT_TOLERANCE of AUT credits
    """
    if len(student) < 2 or not aut:
        return []

    a_texts = [_aut_text(c) for c in aut]
    a_vec = embed(a_texts)

    suggestions = []

    for size in (2, 3):
        if len(student) < size:
            continue
        for combo in combinations(range(len(student)), size):
            sub = [student[i] for i in combo]
            total_credits = sum(float(c.get("credits", 0) or 0) for c in sub)
            combined_text = " + ".join(_student_text(c) for c in sub)
            s_vec = embed([combined_text])
            sim_row = cosine_sim(s_vec, a_vec)[0]

            best_j = int(np.argmax(sim_row))
            best_score = float(sim_row[best_j])
            ac = aut[best_j]
            aut_credits = float(ac.get("credits", 0) or 0)

            if best_score < config.MIN_SIMILARITY:
                continue
            if abs(total_credits - aut_credits) > config.MERGE_CREDIT_TOLERANCE:
                continue

            # Also, check that the combo is meaningfully better than any single course alone
            single_best = 0.0
            for i in combo:
                sv = embed([_student_text(student[i])])
                ss = float(cosine_sim(sv, a_vec)[0][best_j])
                if ss > single_best:
                    single_best = ss
            if best_score - single_best < 0.03:
                continue  # combining didn't really help

            suggestions.append({
                "student_course_indices": list(combo),
                "aut_course_id": ac["id"],
                "aut_code": ac["code"],
                "aut_name": ac.get("name_ar") or ac.get("name_en", ""),
                "total_student_credits": round(total_credits, 2),
                "aut_credits": int(aut_credits),
                "avg_similarity": round(best_score, 4),
                "reason": f"دمج {size} مواد طالب ({total_credits} ساعة) ↔ مادة AUT واحدة ({int(aut_credits)} ساعة) بتشابه {round(best_score*100)}٪",
            })

    # Keep best suggestions only — sort by similarity, drop overlapping combos
    suggestions.sort(key=lambda s: -s["avg_similarity"])
    used: set = set()
    final = []
    for s in suggestions:
        if any(i in used for i in s["student_course_indices"]):
            continue
        final.append(s)
        for i in s["student_course_indices"]:
            used.add(i)
    return final
