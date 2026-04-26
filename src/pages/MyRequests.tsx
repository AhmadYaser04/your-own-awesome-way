import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, FileText, CheckCircle2, XCircle, Clock, Calendar, BookOpen, MessageSquare, Plus, ChevronDown, ChevronUp, FolderKanban, Download } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import { exportDecisionPdf } from "@/lib/exportDecisionPdf";
import { exportDecisionPdfArabic } from "@/lib/exportDecisionPdfArabic";

interface Row {
  id: string;
  saudi_course_name: string | null;
  saudi_course_description: string | null;
  matched_aut_name: string | null;
  matched_aut_code: string | null;
  similarity: number | null;
  verdict: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewer_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  ai_result?: unknown;
}

interface BatchCourse {
  saudi_course_name: string;
  verdict: string;
  overall_similarity: number;
  matches?: { aut_name: string; aut_code: string }[];
  decision?: { status: "pending" | "approved" | "rejected"; notes?: string };
}

function getBatchCourses(ai: unknown): BatchCourse[] {
  if (!ai || typeof ai !== "object" || !("courses" in ai)) return [];
  const courses = (ai as { courses?: BatchCourse[] }).courses;
  return Array.isArray(courses) && courses.length > 1 ? courses : [];
}

export default function MyRequests() {
  const { user } = useAuth();
  const { t, dir, lang } = useLang();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("equivalency_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      });
  }, [user]);

  const badge = (s: Row["status"]) => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {t("admin.statusApproved")}</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {t("admin.statusRejected")}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {t("admin.statusPending")}</Badge>;
  };

  const decisionBadge = (s: "pending" | "approved" | "rejected") => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1 text-[11px]"><CheckCircle2 className="h-3 w-3" /> مقبولة</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1 text-[11px]"><XCircle className="h-3 w-3" /> مرفوضة</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1 text-[11px]"><Clock className="h-3 w-3" /> قيد المراجعة</Badge>;
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            {t("eq.back")}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/15 backdrop-blur-md p-3 rounded-2xl"><FileText className="h-8 w-8" /></div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold">{t("myReq.title")}</h1>
                <p className="text-primary-foreground/85 text-sm mt-1">{t("myReq.subtitle")}</p>
              </div>
            </div>
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/equivalency"><Plus className="h-4 w-4" /> {t("myReq.new")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <p className="text-muted-foreground">{t("myReq.empty")}</p>
            <Button asChild><Link to="/equivalency">{t("myReq.startFirst")}</Link></Button>
          </Card>
        ) : (
          rows.map((r) => {
            const batchCourses = getBatchCourses(r.ai_result);
            const isBatch = batchCourses.length > 1;
            const approvedCount = batchCourses.filter((c) => c.decision?.status === "approved").length;
            const rejectedCount = batchCourses.filter((c) => c.decision?.status === "rejected").length;
            const pendingCount = batchCourses.length - approvedCount - rejectedCount;
            const isExpanded = expandedBatchId === r.id;
            return (
              <Card key={r.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {badge(r.status)}
                  {isBatch && <Badge variant="outline" className="gap-1"><FolderKanban className="h-3 w-3" /> طلب مجمّع</Badge>}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                  </span>
                </div>
                <div className="font-heading font-bold text-foreground">
                  {r.saudi_course_name || r.saudi_course_description?.slice(0, 100) || "—"}
                </div>

                {isBatch ? (
                  <div className="space-y-3 rounded-lg border bg-accent/20 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="text-sm font-heading font-bold text-primary">ملخص المواد داخل الطلب</div>
                        <div className="text-xs text-muted-foreground mt-1">يمكنك معرفة المقبول والمرفوض لكل مادة من نفس الملف.</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-success/15 text-success border-success/30">مقبولة: {approvedCount}</Badge>
                        <Badge className="bg-destructive/15 text-destructive border-destructive/30">مرفوضة: {rejectedCount}</Badge>
                        <Badge className="bg-gold text-gold-foreground">قيد المراجعة: {pendingCount}</Badge>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 w-full sm:w-auto"
                      onClick={() => setExpandedBatchId(isExpanded ? null : r.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? "إخفاء تفاصيل المواد" : "استعراض المقبول والمرفوض"}
                    </Button>

                    {isExpanded && (
                      <div className="space-y-2">
                        {batchCourses.map((course, index) => {
                          const topMatch = course.matches?.[0];
                          const courseStatus = course.decision?.status ?? "pending";
                          return (
                            <div key={`${r.id}-${index}`} className={`rounded-lg border p-3 ${dir === "rtl" ? "border-r-4" : "border-l-4"} ${
                              courseStatus === "approved"
                                ? dir === "rtl" ? "border-r-success" : "border-l-success"
                                : courseStatus === "rejected"
                                ? dir === "rtl" ? "border-r-destructive" : "border-l-destructive"
                                : dir === "rtl" ? "border-r-gold" : "border-l-gold"
                            }`}>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">مادة #{index + 1}</Badge>
                                    {decisionBadge(courseStatus)}
                                  </div>
                                  <div className="font-heading font-bold text-foreground truncate">{course.saudi_course_name}</div>
                                  {topMatch && (
                                    <div className="text-xs text-primary font-medium">
                                      {topMatch.aut_name} <span className="text-muted-foreground">({topMatch.aut_code})</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm font-heading font-bold text-primary">{Math.round(course.overall_similarity ?? 0)}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : r.matched_aut_name ? (
                  <div className="bg-accent/40 p-3 rounded-md space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <BookOpen className="h-4 w-4" />
                        {r.matched_aut_name} <span className="text-xs text-muted-foreground">({r.matched_aut_code})</span>
                      </div>
                      <span className="font-heading font-bold text-primary">{Math.round(Number(r.similarity ?? 0))}%</span>
                    </div>
                    <Progress value={Number(r.similarity ?? 0)} className="h-1.5" />
                  </div>
                ) : null}

                {(r.admin_notes || r.reviewer_name) && (
                  <div className={`flex gap-2 text-sm bg-primary/5 p-3 rounded-md ${dir === "rtl" ? "border-r-2" : "border-l-2"} border-primary`}>
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      {r.reviewer_name && (
                        <div className="text-xs">
                          <span className="text-muted-foreground font-heading">القرار صادر عن: </span>
                          <span className="font-heading font-bold text-primary">د. {r.reviewer_name}</span>
                        </div>
                      )}
                      {r.admin_notes && (
                        <>
                          <div className="text-xs text-muted-foreground font-heading">{t("myReq.adminNotes")}</div>
                          <div className="text-foreground">{r.admin_notes}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </section>
    </SiteLayout>
  );
}
