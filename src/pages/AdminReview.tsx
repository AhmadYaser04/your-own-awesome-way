import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Loader2, ArrowLeft, ShieldCheck, GraduationCap, Search, Link2, Unlink,
  CheckCircle2, XCircle, Clock, AlertTriangle, Printer, FileCheck, FileX, FileText,
  Trash2, Save, Sparkles, Layers,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import { exportEquivalencyForm, type EquivalencyPrintData, type PrintMode } from "@/lib/exportEquivalencyForm";

type Verdict = "approved" | "rejected" | "pending";
type Status = "pending" | "approved" | "rejected";

interface ReqRow {
  id: string;
  user_id: string;
  student_full_name: string | null;
  student_id: string | null;
  student_college: string | null;
  student_major: string | null;
  previous_diploma_source: string | null;
  previous_university: string | null;
  previous_major_name: string | null;
  transfer_semester: string | null;
  transfer_type: string | null;
  cumulative_gpa: number | null;
  diploma_gpa: number | null;
  academic_year: string | null;
  semester: string | null;
  student_type: string;
  credits_cap: number;
  status: Status;
  admin_notes: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  uploaded_file_url: string | null;
}
interface ItemRow {
  id: string;
  request_id: string;
  source_course_name: string;
  source_course_code: string | null;
  source_credits: number;
  source_grade: string | null;
  display_order: number;
}
interface AutCourse {
  id: string;
  course_code: string;
  course_name_ar: string;
  course_name_en: string | null;
  credits: number;
  category: string;
  description_ar: string | null;
}
interface MatchRow {
  id: string;
  request_id: string;
  aut_course_id: string | null;
  source_item_ids: string[];
  total_source_credits: number;
  aut_credits: number;
  similarity: number | null;
  verdict: Verdict;
  is_manual: boolean;
  notes: string | null;
}

export default function AdminReview() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const { lang, dir } = useLang();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState<ReqRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [autCourses, setAutCourses] = useState<AutCourse[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);

  // Selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedAutId, setSelectedAutId] = useState<string | null>(null);
  const [autSearch, setAutSearch] = useState("");

  // Reviewer / overall notes
  const [reviewerName, setReviewerName] = useState("");
  const [overallNotes, setOverallNotes] = useState("");
  const [busy, setBusy] = useState(false);

  // Per-match note dialog state
  const [matchNotes, setMatchNotes] = useState<Record<string, string>>({});

  // True only on the very first load — prevents subsequent refreshes from
  // overwriting reviewer_name / admin_notes that the advisor is currently typing.
  const [initialized, setInitialized] = useState(false);

  const loadAll = async (opts: { preserveInputs?: boolean } = {}) => {
    if (!id) return;
    if (!opts.preserveInputs) setLoading(true);
    const [{ data: r }, { data: it }, { data: aut }, { data: ms }] = await Promise.all([
      supabase.from("equivalency_requests").select("*").eq("id", id).single(),
      supabase.from("equivalency_request_items").select("*").eq("request_id", id).order("display_order"),
      supabase.from("aut_courses").select("id, course_code, course_name_ar, course_name_en, credits, category, description_ar").eq("is_active", true).order("course_code"),
      supabase.from("equivalency_matches").select("*").eq("request_id", id),
    ]);
    if (r) {
      setReq(r as ReqRow);
      // Only seed reviewer/notes inputs on the FIRST load. Later refreshes must
      // not blow away what the advisor has typed (this is what was forcing them
      // to re-enter the name after every decision).
      if (!initialized && !opts.preserveInputs) {
        setReviewerName((r as ReqRow).reviewer_name || "");
        setOverallNotes((r as ReqRow).admin_notes || "");
      }
    }
    let itemsList = (it ?? []) as ItemRow[];

    // Backfill: legacy requests stored extracted courses inside ai_result.courses
    // (before the equivalency_request_items table existed). If we have none, migrate them now.
    if (itemsList.length === 0 && r) {
      const legacy = (r as any)?.ai_result?.courses;
      if (Array.isArray(legacy) && legacy.length > 0) {
        const toInsert = legacy.map((c: any, idx: number) => ({
          request_id: id,
          source_course_name:
            c.saudi_course_name?.toString().trim() ||
            c.source_course_name?.toString().trim() ||
            (c.extracted_course?.toString().split("\n")[0] || "").slice(0, 200) ||
            `مادة ${idx + 1}`,
          source_course_code: c.source_course_code?.toString().trim() || null,
          source_credits: Number(c.source_credits) || 3,
          source_grade: c.source_grade?.toString().trim() || null,
          source_semester: c.source_semester?.toString().trim() || null,
          display_order: idx,
        }));
        const { data: inserted, error: insErr } = await supabase
          .from("equivalency_request_items")
          .insert(toInsert)
          .select("*");
        if (!insErr && inserted) {
          itemsList = inserted as ItemRow[];
        } else if (insErr) {
          console.warn("[AdminReview] Backfill items failed:", insErr);
        }
      }
    }
    setItems(itemsList);
    setAutCourses((aut ?? []) as AutCourse[]);
    const mss = (ms ?? []) as MatchRow[];
    setMatches(mss);
    // Merge match notes — keep unsaved text the advisor is typing, only seed
    // notes for matches we haven't seen before.
    setMatchNotes((prev) => {
      const next = { ...prev };
      mss.forEach((m) => {
        if (!(m.id in next)) next[m.id] = m.notes || "";
      });
      return next;
    });
    if (!opts.preserveInputs) setLoading(false);
    setInitialized(true);
  };

  useEffect(() => { loadAll(); }, [id]);

  // Items already linked to any match (cannot be re-linked unless unlinked)
  const linkedItemIds = useMemo(() => {
    const s = new Set<string>();
    matches.forEach((m) => (m.source_item_ids || []).forEach((sid) => s.add(sid)));
    return s;
  }, [matches]);

  const filteredAut = useMemo(() => {
    const q = autSearch.trim().toLowerCase();
    if (!q) return autCourses;
    return autCourses.filter((c) =>
      c.course_code.toLowerCase().includes(q) ||
      c.course_name_ar.toLowerCase().includes(q) ||
      (c.course_name_en || "").toLowerCase().includes(q)
    );
  }, [autCourses, autSearch]);

  // Approved/rejected credits totals
  const approvedAutCredits = useMemo(
    () => matches.filter((m) => m.verdict === "approved").reduce((s, m) => s + (m.aut_credits || 0), 0),
    [matches]
  );
  const approvedSourceCredits = useMemo(
    () => matches.filter((m) => m.verdict === "approved").reduce((s, m) => s + (Number(m.total_source_credits) || 0), 0),
    [matches]
  );
  const cap = req?.credits_cap ?? 132;
  const capPct = Math.min(100, (approvedAutCredits / cap) * 100);
  const overCap = approvedAutCredits > cap;

  // === تتبع متطلبات الـ132 ساعة عبر 5 فئات ===
  // Keys MUST match aut_courses.category values stored in the DB.
  const CATEGORY_LIMITS: Record<string, { ar: string; en: string; max: number }> = {
    university_required: { ar: "متطلبات جامعة إجبارية", en: "University Required", max: 15 },
    university_elective: { ar: "متطلبات جامعة اختيارية", en: "University Elective", max: 12 },
    college_required:    { ar: "متطلبات كلية إجبارية",   en: "College Required",    max: 21 },
    department_required: { ar: "متطلبات تخصص إجبارية",   en: "Department Required", max: 72 },
    department_elective: { ar: "متطلبات تخصص اختيارية",  en: "Department Elective", max: 12 },
    remedial:            { ar: "مواد استدراكية",          en: "Remedial",            max: 9  },
  };
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {
      university_required: 0, university_elective: 0, college_required: 0,
      department_required: 0, department_elective: 0, remedial: 0,
    };
    const autById = new Map(autCourses.map((c) => [c.id, c] as const));
    matches.filter((m) => m.verdict === "approved").forEach((m) => {
      if (!m.aut_course_id) return;
      const aut = autById.get(m.aut_course_id);
      if (!aut) return;
      const key = (aut.category || "").trim();
      if (key in totals) totals[key] += aut.credits || 0;
    });
    return totals;
  }, [matches, autCourses]);

  const toggleItem = (itemId: string) => {
    if (linkedItemIds.has(itemId)) return; // ignore — already linked
    const next = new Set(selectedItemIds);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    setSelectedItemIds(next);
  };

  const handleLink = async () => {
    if (!id || !req) return;
    if (selectedItemIds.size === 0) {
      toast({ title: lang === "ar" ? "اختر مادة طالب أو أكثر أولاً" : "Select at least one student course", variant: "destructive" });
      return;
    }
    if (!selectedAutId) {
      toast({ title: lang === "ar" ? "اختر مادة AUT للربط" : "Select an AUT course", variant: "destructive" });
      return;
    }
    const aut = autCourses.find((c) => c.id === selectedAutId);
    if (!aut) return;
    const sourceItems = items.filter((it) => selectedItemIds.has(it.id));
    const totalSourceCredits = sourceItems.reduce((s, it) => s + (Number(it.source_credits) || 0), 0);

    setBusy(true);
    const { error } = await supabase.from("equivalency_matches").insert({
      request_id: id,
      aut_course_id: aut.id,
      source_item_ids: Array.from(selectedItemIds),
      total_source_credits: totalSourceCredits,
      aut_credits: aut.credits,
      similarity: null,
      verdict: "pending",
      is_manual: true,
      notes: null,
    });
    setBusy(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({
      title: selectedItemIds.size > 1
        ? (lang === "ar" ? `تم دمج ${selectedItemIds.size} مواد وربطها بمادة AUT` : `Merged ${selectedItemIds.size} courses to AUT`)
        : (lang === "ar" ? "تم الربط بنجاح" : "Linked successfully"),
    });
    setSelectedItemIds(new Set());
    setSelectedAutId(null);
    loadAll({ preserveInputs: true });
  };

  const setMatchVerdict = async (matchId: string, verdict: Verdict) => {
    if (!reviewerName.trim()) {
      toast({
        title: lang === "ar" ? "اسم المرشد مطلوب" : "Advisor name required",
        description: lang === "ar" ? "أدخل اسم المرشد قبل اعتماد القرار." : "Enter your name before deciding.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("equivalency_matches")
      .update({ verdict, notes: matchNotes[matchId] || null })
      .eq("id", matchId);
    setBusy(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    loadAll({ preserveInputs: true });
  };

  const handleAutoMatch = async () => {
    if (!id) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("auto-match", {
      body: { request_id: id },
    });
    setBusy(false);
    if (error) {
      toast({ title: "AI", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.error) {
      toast({ title: "AI", description: data.error, variant: "destructive" });
      return;
    }
    toast({
      title: lang === "ar" ? "تمت المعادلة التلقائية" : "Auto-match done",
      description: data?.created
        ? (lang === "ar" ? `تم اقتراح ${data.created} معادلة — راجعها واعتمد أو ارفض.` : `Created ${data.created} suggestion(s).`)
        : (data?.message || (lang === "ar" ? "لا توجد اقتراحات." : "No suggestions.")),
    });
    loadAll({ preserveInputs: true });
  };

  const removeMatch = async (matchId: string) => {
    setBusy(true);
    const { error } = await supabase.from("equivalency_matches").delete().eq("id", matchId);
    setBusy(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: lang === "ar" ? "تم فك الربط" : "Unlinked" });
    loadAll({ preserveInputs: true });
  };

  const finalizeRequest = async (status: Status) => {
    if (!id || !user) return;
    if (!reviewerName.trim()) {
      toast({
        title: lang === "ar" ? "اسم المرشد مطلوب" : "Advisor name required",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("equivalency_requests")
      .update({
        status,
        reviewer_name: reviewerName.trim(),
        admin_notes: overallNotes.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusy(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({
      title: status === "approved"
        ? (lang === "ar" ? "تم اعتماد الطلب" : "Request approved")
        : status === "rejected"
        ? (lang === "ar" ? "تم رفض الطلب" : "Request rejected")
        : (lang === "ar" ? "أعيد للمراجعة" : "Marked pending"),
    });
    loadAll({ preserveInputs: true });
  };

  const buildPrintData = (mode: PrintMode): EquivalencyPrintData | null => {
    if (!req) return null;
    const itemsById = new Map(items.map((i) => [i.id, i] as const));
    const autById = new Map(autCourses.map((c) => [c.id, c] as const));
    const filtered = matches.filter((m) =>
      mode === "approved" ? m.verdict === "approved"
      : mode === "rejected" ? m.verdict === "rejected"
      : true
    );
    return {
      mode,
      student: {
        fullName: req.student_full_name || "—",
        studentId: req.student_id || "—",
        college: req.student_college || "—",
        major: req.student_major || "—",
        previousDiplomaSource: req.previous_diploma_source || "—",
        cumulativeGpa: req.cumulative_gpa,
        diplomaGpa: req.diploma_gpa,
        academicYear: req.academic_year || "—",
        semester: req.semester || "—",
        studentType: req.student_type,
        creditsCap: req.credits_cap,
      },
      reviewerName: reviewerName || req.reviewer_name || "—",
      reviewedAt: req.reviewed_at || new Date().toISOString(),
      submittedAt: req.created_at,
      requestId: req.id,
      rows: filtered.map((m) => {
        const sourceItems = (m.source_item_ids || [])
          .map((sid) => itemsById.get(sid))
          .filter(Boolean) as ItemRow[];
        const aut = m.aut_course_id ? autById.get(m.aut_course_id) : undefined;
        return {
          sources: sourceItems.map((s) => ({
            name: s.source_course_name,
            code: s.source_course_code || "",
            credits: Number(s.source_credits) || 0,
            grade: s.source_grade || "",
          })),
          aut: aut
            ? { code: aut.course_code, name: aut.course_name_ar, credits: aut.credits }
            : undefined,
          verdict: m.verdict,
          notes: m.notes || "",
          merged: (m.source_item_ids?.length ?? 0) > 1,
        };
      }),
      // Unlinked items as "rejected by default" only in full mode
      unlinkedItems: mode === "full" || mode === "rejected"
        ? items.filter((it) => !linkedItemIds.has(it.id)).map((it) => ({
            name: it.source_course_name,
            code: it.source_course_code || "",
            credits: Number(it.source_credits) || 0,
            grade: it.source_grade || "",
          }))
        : [],
      totals: {
        approvedAutCredits,
        approvedSourceCredits,
        cap,
      },
    };
  };

  const handlePrint = (mode: PrintMode) => {
    const data = buildPrintData(mode);
    if (!data) return;
    exportEquivalencyForm(data);
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!req) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">{lang === "ar" ? "الطلب غير موجود." : "Request not found."}</p>
          <Button asChild className="mt-4"><Link to="/admin">{lang === "ar" ? "عودة للوحة" : "Back to admin"}</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const verdictBadge = (v: Verdict) => {
    if (v === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {lang === "ar" ? "معادَلة" : "Approved"}</Badge>;
    if (v === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {lang === "ar" ? "غير معادَلة" : "Rejected"}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {lang === "ar" ? "معلَّقة" : "Pending"}</Badge>;
  };

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground py-8 border-b-4 border-gold">
        <div className="container mx-auto px-4 max-w-7xl">
          <button onClick={() => nav("/admin")} className="inline-flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-sm mb-3">
            <ArrowLeft className="h-4 w-4" /> {lang === "ar" ? "عودة للوحة" : "Back to admin"}
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/15 backdrop-blur-md p-3 rounded-2xl"><ShieldCheck className="h-8 w-8" /></div>
              <div>
                <Badge className="bg-gold text-gold-foreground border-0 mb-1">
                  {lang === "ar" ? "مراجعة لجنة المعادلات" : "Equivalency Committee Review"}
                </Badge>
                <h1 className="font-heading text-xl md:text-2xl font-bold">{req.student_full_name || "—"}</h1>
                <p className="text-primary-foreground/85 text-xs md:text-sm mt-1">
                  {req.previous_diploma_source} · {req.student_type === "same_major" ? (lang === "ar" ? "نفس التخصص" : "Same major") : (lang === "ar" ? "تخصص مختلف" : "Different major")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 min-w-[300px] w-full md:w-auto">
              <div className="flex items-center justify-between text-xs">
                <span>{lang === "ar" ? "إجمالي الساعات المعتمَدة" : "Total approved credits"}</span>
                <span className="font-bold">{approvedAutCredits} / {cap} {lang === "ar" ? "س" : "h"}</span>
              </div>
              <Progress
                value={capPct}
                className={`h-2.5 bg-primary-foreground/20 ${overCap ? "[&>div]:bg-destructive" : capPct > 80 ? "[&>div]:bg-gold" : "[&>div]:bg-success"}`}
              />
              {overCap && (
                <div className="flex items-center gap-1 text-xs bg-destructive/30 backdrop-blur-md text-destructive-foreground px-2 py-1 rounded">
                  <AlertTriangle className="h-3 w-3" />
                  {lang === "ar" ? `تجاوز السقف بـ ${approvedAutCredits - cap} ساعة!` : `Over cap by ${approvedAutCredits - cap}h!`}
                </div>
              )}

              {/* ===== الأشرطة التفصيلية لكل فئة (قابلة للطي) ===== */}
              <Collapsible className="w-full">
                <CollapsibleTrigger className="flex items-center justify-between w-full text-xs bg-primary-foreground/10 hover:bg-primary-foreground/20 px-2 py-1.5 rounded transition-colors">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {lang === "ar" ? "تفاصيل الفئات الخمس" : "Category breakdown"}
                  </span>
                  <ChevronDown className="h-3 w-3 transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2 bg-primary-foreground/10 p-2 rounded">
                  {Object.entries(CATEGORY_LIMITS).map(([key, info]) => {
                    const used = categoryTotals[key] || 0;
                    const pct = Math.min(100, (used / info.max) * 100);
                    const over = used > info.max;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="truncate">{lang === "ar" ? info.ar : info.en}</span>
                          <span className={`font-bold ${over ? "text-destructive-foreground bg-destructive/40 px-1 rounded" : ""}`}>
                            {used} / {info.max}
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className={`h-1.5 bg-primary-foreground/20 ${over ? "[&>div]:bg-destructive" : pct >= 100 ? "[&>div]:bg-gold" : "[&>div]:bg-success"}`}
                        />
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 max-w-7xl space-y-5">

        {/* Reviewer & student summary */}
        <Card className="p-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Field label={lang === "ar" ? "الرقم الجامعي" : "Student ID"} value={req.student_id} />
              <Field label={lang === "ar" ? "الكلية" : "College"} value={req.student_college} />
              <Field label={lang === "ar" ? "التخصص" : "Major"} value={req.student_major} />
              <Field label={lang === "ar" ? "المعدل التراكمي" : "Cumulative GPA"} value={req.cumulative_gpa?.toString() ?? null} />
              <Field label={lang === "ar" ? "معدل الدبلوم" : "Diploma GPA"} value={req.diploma_gpa?.toString() ?? null} />
              <Field label={lang === "ar" ? "العام / الفصل" : "Year / Semester"} value={[req.academic_year, req.semester].filter(Boolean).join(" · ") || null} />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "اسم المرشد الأكاديمي *" : "Academic Advisor Name *"}</Label>
              <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder={lang === "ar" ? "د. ..." : "Dr. ..."} />
            </div>
          </div>

          {req.uploaded_file_url && (
            <div className="mt-3 text-xs">
              <a
                href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/equivalency-uploads/${req.uploaded_file_url}`}
                target="_blank" rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <FileText className="h-3 w-3" /> {lang === "ar" ? "عرض كشف العلامات المرفوع" : "View uploaded transcript"}
              </a>
            </div>
          )}
        </Card>

        {/* MAIN: Two columns */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* LEFT: Student courses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {lang === "ar" ? "مواد الطالب" : "Student courses"}
                <Badge variant="outline">{items.length}</Badge>
              </h2>
              {selectedItemIds.size > 0 && (
                <Badge className="bg-secondary text-primary-foreground gap-1">
                  <Layers className="h-3 w-3" />
                  {lang === "ar" ? `${selectedItemIds.size} محدَّدة` : `${selectedItemIds.size} selected`}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === "ar"
                ? "✅ ضع علامة على مادة واحدة أو أكثر، ثم اختر مادة AUT من العمود الآخر، ثم اضغط 'ربط'. لدمج N→1 حدّد عدة مواد قبل الربط."
                : "✅ Tick one or more courses, pick an AUT course on the other side, then click Link. To merge N→1 select multiple courses first."}
            </p>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">
                  {lang === "ar" ? "لا مواد." : "No items."}
                </div>
              ) : items.map((it) => {
                const linked = linkedItemIds.has(it.id);
                const checked = selectedItemIds.has(it.id);
                return (
                  <label
                    key={it.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      linked
                        ? "bg-success/5 border-success/30 cursor-not-allowed opacity-70"
                        : checked
                          ? "bg-secondary/10 border-secondary"
                          : "bg-card hover:bg-accent/40"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={linked}
                      onCheckedChange={() => toggleItem(it.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-foreground">{it.source_course_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {it.source_course_code && <Badge variant="outline" className="text-[10px] font-mono">{it.source_course_code}</Badge>}
                        <span>{it.source_credits}{lang === "ar" ? "س" : "h"}</span>
                        {it.source_grade && <span>· {it.source_grade}</span>}
                        {linked && <Badge className="bg-success text-white text-[10px]">{lang === "ar" ? "مربوطة" : "linked"}</Badge>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Card>

          {/* RIGHT: AUT courses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                {lang === "ar" ? "مواد جامعة AUT" : "AUT courses"}
                <Badge variant="outline">{autCourses.length}</Badge>
              </h2>
            </div>
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute top-2.5 start-2.5 text-muted-foreground" />
              <Input
                value={autSearch}
                onChange={(e) => setAutSearch(e.target.value)}
                placeholder={lang === "ar" ? "ابحث بالكود أو الاسم..." : "Search by code or name..."}
                className="ps-8"
              />
            </div>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredAut.map((c) => {
                const sel = selectedAutId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedAutId(sel ? null : c.id)}
                    className={`w-full text-start p-3 rounded-lg border transition-colors ${
                      sel ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{c.course_code}</Badge>
                      <Badge variant="outline" className="text-[10px]">{c.credits}{lang === "ar" ? "س" : "h"}</Badge>
                    </div>
                    <div className="text-sm font-bold text-foreground">{c.course_name_ar}</div>
                    {c.course_name_en && <div className="text-xs text-muted-foreground">{c.course_name_en}</div>}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* LINK BAR */}
        <Card className="p-4 border-2 border-primary/30 bg-primary/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-sm">
              {selectedItemIds.size === 0 && !selectedAutId && (
                <span className="text-muted-foreground">
                  {lang === "ar" ? "حدّد مواد طالب + مادة AUT ثم اضغط ربط." : "Select student courses + an AUT course, then link."}
                </span>
              )}
              {selectedItemIds.size > 0 && (
                <span>
                  <span className="font-bold">{selectedItemIds.size}</span> {lang === "ar" ? "مادة طالب محدَّدة" : "student course(s) selected"}
                  {selectedItemIds.size > 1 && <span className="text-secondary font-bold"> · {lang === "ar" ? "سيتم الدمج N→1" : "will merge N→1"}</span>}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleAutoMatch}
                disabled={busy || items.length === 0}
                className="gap-2"
                title={lang === "ar" ? "اقتراح معادلات تلقائية بالذكاء الاصطناعي" : "AI auto-match"}
              >
                <Sparkles className="h-4 w-4" />
                {lang === "ar" ? "معادلة تلقائية (AI)" : "Auto-match (AI)"}
              </Button>
              {(selectedItemIds.size > 0 || selectedAutId) && (
                <Button
                  variant="outline"
                  onClick={() => { setSelectedItemIds(new Set()); setSelectedAutId(null); }}
                  className="gap-1"
                >
                  <Unlink className="h-4 w-4" />
                  {lang === "ar" ? "مسح التحديد" : "Clear"}
                </Button>
              )}
              <Button
                onClick={handleLink}
                disabled={busy || selectedItemIds.size === 0 || !selectedAutId}
                className="gap-2 shadow-elegant"
              >
                <Link2 className="h-4 w-4" />
                {selectedItemIds.size > 1
                  ? (lang === "ar" ? `ربط (دمج ${selectedItemIds.size}) → AUT` : `Link (merge ${selectedItemIds.size}) → AUT`)
                  : (lang === "ar" ? "ربط بمادة AUT" : "Link to AUT course")}
              </Button>
            </div>
          </div>
        </Card>

        {/* CURRENT MATCHES */}
        <Card className="p-5">
          <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-success" />
            {lang === "ar" ? "المعادلات الحالية" : "Current matches"}
            <Badge variant="outline">{matches.length}</Badge>
          </h2>
          {matches.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {lang === "ar" ? "لم يتم إنشاء أي معادلة بعد." : "No matches created yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((m) => {
                const aut = autCourses.find((c) => c.id === m.aut_course_id);
                const sourceItems = items.filter((i) => (m.source_item_ids || []).includes(i.id));
                const merged = sourceItems.length > 1;
                const creditMismatch = Math.abs(m.total_source_credits - m.aut_credits) > 0;
                return (
                  <div key={m.id} className="p-4 rounded-lg border-2 bg-card space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          {/* Student side */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase">
                              {lang === "ar" ? "مواد الطالب" : "Student side"}
                              {merged && <Badge className="ms-2 bg-secondary text-primary-foreground text-[10px]">{lang === "ar" ? `دمج ${sourceItems.length}` : `merged ${sourceItems.length}`}</Badge>}
                            </div>
                            {sourceItems.map((s) => (
                              <div key={s.id} className="text-xs">
                                • <span className="font-bold">{s.source_course_name}</span>
                                <span className="text-muted-foreground"> ({s.source_credits}{lang === "ar" ? "س" : "h"})</span>
                              </div>
                            ))}
                            <div className="text-xs font-bold text-secondary pt-1">
                              Σ {m.total_source_credits}{lang === "ar" ? "س" : "h"}
                            </div>
                          </div>
                          {/* AUT side */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase">
                              {lang === "ar" ? "مادة AUT" : "AUT course"}
                            </div>
                            {aut ? (
                              <>
                                <div className="text-xs">
                                  <Badge variant="outline" className="text-[10px] font-mono me-1">{aut.course_code}</Badge>
                                  <span className="font-bold">{aut.course_name_ar}</span>
                                </div>
                                <div className="text-xs font-bold text-primary">
                                  Σ {m.aut_credits}{lang === "ar" ? "س" : "h"}
                                </div>
                              </>
                            ) : <div className="text-xs text-muted-foreground">—</div>}
                          </div>
                        </div>
                        {creditMismatch && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] bg-gold/15 text-gold-foreground border border-gold/40 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            {lang === "ar" ? `فرق ساعات: ${m.total_source_credits} ↔ ${m.aut_credits}` : `Credit mismatch: ${m.total_source_credits} ↔ ${m.aut_credits}`}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {verdictBadge(m.verdict)}
                        <Button variant="ghost" size="sm" onClick={() => removeMatch(m.id)} className="text-destructive gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          {lang === "ar" ? "فك الربط" : "Unlink"}
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={matchNotes[m.id] ?? ""}
                      onChange={(e) => setMatchNotes((prev) => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder={lang === "ar" ? "ملاحظات على هذه المعادلة (اختياري)" : "Notes on this match (optional)"}
                      className="text-sm min-h-[60px]"
                    />

                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setMatchVerdict(m.id, "pending")} disabled={busy} className="gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {lang === "ar" ? "معلَّقة" : "Pending"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setMatchVerdict(m.id, "rejected")} disabled={busy} className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                        <XCircle className="h-3.5 w-3.5" />
                        {lang === "ar" ? "غير معادَلة" : "Reject"}
                      </Button>
                      <Button size="sm" onClick={() => setMatchVerdict(m.id, "approved")} disabled={busy} className="gap-1 bg-success text-white hover:bg-success/90">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === "ar" ? "تُعادَل" : "Approve"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* OVERALL DECISION + PRINT */}
        <Card className="p-5 space-y-4 border-2 border-primary/40">
          <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {lang === "ar" ? "القرار النهائي للطلب" : "Final overall decision"}
          </h2>

          {overCap && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{lang === "ar" ? "تجاوز السقف" : "Cap exceeded"}</AlertTitle>
              <AlertDescription>
                {lang === "ar"
                  ? `الساعات المعتمَدة (${approvedAutCredits}) تتجاوز السقف المسموح (${cap}). راجع الاعتمادات قبل الإغلاق.`
                  : `Approved credits (${approvedAutCredits}) exceed the allowed cap (${cap}). Please review before closing.`}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>{lang === "ar" ? "ملاحظات عامة على الطلب" : "Overall notes"}</Label>
            <Textarea value={overallNotes} onChange={(e) => setOverallNotes(e.target.value)} className="min-h-[80px]" />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={() => finalizeRequest("pending")} disabled={busy} className="gap-1">
              <Clock className="h-4 w-4" /> {lang === "ar" ? "معلَّق" : "Pending"}
            </Button>
            <Button variant="outline" onClick={() => finalizeRequest("rejected")} disabled={busy} className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
              <XCircle className="h-4 w-4" /> {lang === "ar" ? "رفض الطلب" : "Reject request"}
            </Button>
            <Button onClick={() => finalizeRequest("approved")} disabled={busy} className="gap-1 bg-success text-white hover:bg-success/90">
              <Save className="h-4 w-4" /> {lang === "ar" ? "اعتماد الطلب" : "Approve request"}
            </Button>
          </div>

          {/* Print buttons */}
          <div className="border-t pt-4 mt-2">
            <h3 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              {lang === "ar" ? "طباعة النموذج الرسمي" : "Print official form"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => handlePrint("approved")} className="gap-2 border-success/40 text-success hover:bg-success/10">
                <FileCheck className="h-4 w-4" />
                {lang === "ar" ? "المعادَلة فقط" : "Approved only"}
              </Button>
              <Button variant="outline" onClick={() => handlePrint("rejected")} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <FileX className="h-4 w-4" />
                {lang === "ar" ? "المرفوضة فقط" : "Rejected only"}
              </Button>
              <Button onClick={() => handlePrint("full")} className="gap-2 bg-primary">
                <Printer className="h-4 w-4" />
                {lang === "ar" ? "النموذج الكامل" : "Full form"}
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground font-bold uppercase">{label}</div>
      <div className="text-sm text-foreground font-bold truncate">{value || "—"}</div>
    </div>
  );
}
