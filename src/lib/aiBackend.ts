/**
 * طبقة الاتصال بـ خادم الذكاء الاصطناعي المحلي (ai-backend/)
 * ----------------------------------------------------------------
 * هذا الخادم يعمل على جهازك من VS Code (FastAPI على localhost:8000)
 * ويحتوي على نماذج OCR ومعادلة المواد التي برمجها الفريق.
 *
 * - لو ضُبط VITE_AI_BACKEND_URL: تُستخدم نماذجك المحلية مباشرة (مستقل تماماً عن لوفابل).
 * - لو لم يُضبط: تعود الواجهة لاستخدام Edge Functions (وضع الاستضافة على لوفابل).
 *
 * بهذا تستطيع تنزيل المشروع وتشغيله محلياً بـ:
 *   1) `cd ai-backend && uvicorn main:app --reload --port 8000`
 *   2) `npm run dev`
 * بدون أي اعتماد على خدمات سحابية مدفوعة.
 */

export const AI_BACKEND_URL: string =
  (import.meta.env.VITE_AI_BACKEND_URL as string | undefined)?.replace(/\/$/, "") || "";

export const isLocalAiBackendEnabled = () => AI_BACKEND_URL.length > 0;

export interface ExtractedCourseDTO {
  name: string;
  code?: string;
  credits: number;
  grade?: string;
  semester?: string;
}

export interface ExtractResponse {
  courses: ExtractedCourseDTO[];
  rawText: string;
  count: number;
  error?: string;
  errorCode?: string;
  allowManualEntry?: boolean;
}

/**
 * استخراج مواد الطالب من ملف (PDF أو صورة) باستخدام نموذج OCR المحلي.
 * يرسل الملف مباشرة كـ multipart/form-data إلى /api/extract.
 */
export async function extractCoursesLocal(file: File): Promise<ExtractResponse> {
  if (!isLocalAiBackendEnabled()) {
    throw new Error("الخادم المحلي غير مهيأ. اضبط VITE_AI_BACKEND_URL في .env");
  }
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${AI_BACKEND_URL}/api/extract`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`فشل الخادم المحلي (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return {
    courses: (data.courses ?? []).map((c: any) => ({
      name: String(c.name ?? "").trim(),
      code: String(c.code ?? "").trim(),
      credits: Number(c.credits ?? 3) || 3,
      grade: String(c.grade ?? "").trim(),
      semester: String(c.semester ?? "").trim(),
    })),
    rawText: String(data.raw_text ?? data.rawText ?? ""),
    count: Number(data.count ?? 0),
  };
}

export interface MatchSuggestionDTO {
  aut_course_id: string;
  aut_code: string;
  aut_name: string;
  similarity: number;
}

export interface StudentMatchResultDTO {
  student_course: { name: string; credits: number; code?: string; grade?: string };
  suggestions: MatchSuggestionDTO[];
}

/**
 * مطابقة دلالية: لكل مادة طالب نُعيد أفضل K مواد AUT بترتيب التشابه.
 * يستخدم نموذج sentence-transformers المحلي.
 */
export async function matchCoursesLocal(
  student: Array<{ name: string; credits: number; code?: string; grade?: string }>,
  aut: Array<{ id: string; code: string; name_ar: string; name_en?: string; credits: number; description_ar?: string }>,
  topK = 3,
): Promise<StudentMatchResultDTO[]> {
  if (!isLocalAiBackendEnabled()) {
    throw new Error("الخادم المحلي غير مهيأ.");
  }
  const res = await fetch(`${AI_BACKEND_URL}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_courses: student, aut_courses: aut, top_k: topK }),
  });
  if (!res.ok) throw new Error(`فشل /api/match (${res.status})`);
  return res.json();
}

/** اقتراح دمج N→1 (ترك للحدّ 3 كحد أعلى داخل الخادم). */
export async function suggestMergesLocal(
  student: Array<{ name: string; credits: number }>,
  aut: Array<{ id: string; code: string; name_ar: string; name_en?: string; credits: number; description_ar?: string }>,
) {
  if (!isLocalAiBackendEnabled()) throw new Error("الخادم المحلي غير مهيأ.");
  const res = await fetch(`${AI_BACKEND_URL}/api/suggest-merges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_courses: student, aut_courses: aut }),
  });
  if (!res.ok) throw new Error(`فشل /api/suggest-merges (${res.status})`);
  return res.json();
}

/** فحص جاهزية الخادم المحلي. */
export async function pingLocalBackend(timeoutMs = 1500): Promise<boolean> {
  if (!isLocalAiBackendEnabled()) return false;
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const res = await fetch(`${AI_BACKEND_URL}/api/health`, { signal: ctl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
