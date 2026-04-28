"""
(Optional) Sync results back to the project database.
Configure SUPABASE_URL and SUPABASE_SERVICE_KEY in .env to enable.
"""
from typing import List, Dict
import config


def get_client():
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    from supabase import create_client
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def fetch_aut_courses() -> List[Dict]:
    client = get_client()
    res = client.table("aut_courses").select(
        "id, course_code, course_name_ar, course_name_en, credits, category, description_ar"
    ).eq("is_active", True).execute()
    rows = res.data or []
    return [{
        "id": r["id"],
        "code": r["course_code"],
        "name_ar": r["course_name_ar"],
        "name_en": r.get("course_name_en") or "",
        "credits": r.get("credits") or 3,
        "description_ar": r.get("description_ar") or "",
    } for r in rows]


def insert_match(request_id: str, aut_course_id: str, source_item_ids: List[str],
                 total_source_credits: float, aut_credits: int, similarity: float):
    client = get_client()
    return client.table("equivalency_matches").insert({
        "request_id": request_id,
        "aut_course_id": aut_course_id,
        "source_item_ids": source_item_ids,
        "total_source_credits": total_source_credits,
        "aut_credits": aut_credits,
        "similarity": similarity,
        "verdict": "pending",
        "is_manual": False,
    }).execute()
