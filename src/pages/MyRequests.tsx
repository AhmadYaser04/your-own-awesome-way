import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, FileText, CheckCircle2, XCircle, Clock, Calendar, Plus,
  ChevronDown, ChevronUp, MessageSquare, GraduationCap, BookOpen,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";

interface ReqRow {
  id: string;
  user_id: string;
  student_full_name: string | null;
  previous_diploma_source: string | null;
  student_type: string;
  credits_cap: number;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  reviewer_name: string | null;
  created_at: string;
  reviewed_at: string | null;
  owner_email?: string | null;
  owner_name?: string | null;
}

interface ItemRow {
  id: string;
  request_id: string;
  source_course_name: string;
  source_course_code: string | null;
  source_credits: number;
  source_grade: string | null;
}

interface MatchRow {
  id: string;
  request_id: string;
  aut_course_id: string | null;
  source_item_ids: string[];
  total_source_credits: number;
  aut_credits: number;
  similarity: number | null;
  verdict: string;
  notes: string | null;
}

export default function MyRequests() {
  const { user, role } = useAuth();
  const { t, dir, lang } = useLang();
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [itemsByReq, setItemsByReq] = useState<Record<string, ItemRow[]>>({});
  const [matchesByReq, setMatchesByReq] = useState<Record<string, MatchRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const isAdmin = role === "admin";
      let query = supabase
        .from("equivalency_requests")
        .select("id, user_id, student_full_name, previous_diploma_source, student_type, credits_cap, status, admin_notes, reviewer_name, created_at, reviewed_at")
        .order("created_at", { ascending: false });
      if (!isAdmin) query = query.eq("user_id", user.id);
      const { data: reqs } = await query;
      const list = (reqs ?? []) as ReqRow[];

      // Enrich with owner profile when admin
      if (isAdmin && list.length) {
        const uids = Array.from(new Set(list.map((r) => r.user_id)));
        const { data: profs } = await supabase
          .from("profiles").select("id, full_name, email").in("id", uids);
        const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
        for (const r of list) {
          const p = pmap.get(r.user_id);
          r.owner_email = p?.email ?? null;
          r.owner_name = p?.full_name ?? null;
        }
      }
      setRows(list);

      if (list.length) {
        const ids = list.map((r) => r.id);
        const [itemsRes, matchesRes] = await Promise.all([
          supabase.from("equivalency_request_items").select("*").in("request_id", ids).order("display_order"),
          supabase.from("equivalency_matches").select("*").in("request_id", ids),
        ]);
        const itemsMap: Record<string, ItemRow[]> = {};
        (itemsRes.data ?? []).forEach((i: ItemRow) => {
          (itemsMap[i.request_id] ??= []).push(i);
        });
        const matchesMap: Record<string, MatchRow[]> = {};
        (matchesRes.data ?? []).forEach((m: MatchRow) => {
          (matchesMap[m.request_id] ??= []).push(m);
        });
        setItemsByReq(itemsMap);
        setMatchesByReq(matchesMap);
      }
      setLoading(false);
    })();
  }, [user, role]);

  const badge = (s: ReqRow["status"]) => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {t("admin.statusApproved")}</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {t("admin.statusRejected")}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {t("admin.statusPending")}</Badge>;
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            ← {lang === "ar" ? "الرئيسية" : "Home"}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="bg-primary-foreground/15 backdrop-blur-md p-3 rounded-2xl"><FileText className="h-8 w-8" /></div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  {role === "admin"
                    ? (lang === "ar" ? "كل طلبات المعادلة" : "All equivalency requests")
                    : t("myReq.title")}
                </h1>
                <p className="text-primary-foreground/85 text-sm mt-1">
                  {role === "admin"
                    ? (lang === "ar" ? "عرض جميع الطلبات المقدمة من الطلاب" : "View all student-submitted requests")
                    : t("myReq.subtitle")}
                </p>
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
            const items = itemsByReq[r.id] ?? [];
            const matches = matchesByReq[r.id] ?? [];
            const approvedCredits = matches
              .filter((m) => m.verdict === "approved")
              .reduce((s, m) => s + (Number(m.aut_credits) || 0), 0);
            const isOpen = openId === r.id;
            const totalSource = items.reduce((s, i) => s + (Number(i.source_credits) || 0), 0);

            return (
              <Card key={r.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {badge(r.status)}
                  <Badge variant="outline" className="gap-1">
                    {r.student_type === "same_major"
                      ? (lang === "ar" ? "نفس التخصص" : "Same major")
                      : (lang === "ar" ? "تخصص مختلف" : "Different major")}
                    {" · "}{lang === "ar" ? `سقف ${r.credits_cap}س` : `cap ${r.credits_cap}h`}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-heading font-bold text-foreground">{r.student_full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.previous_diploma_source || "—"}</div>
                    {role === "admin" && (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {lang === "ar" ? "مقدِّم الطلب: " : "Submitter: "}
                        <span className="font-bold">{r.owner_name || r.owner_email || r.user_id.slice(0, 8)}</span>
                      </div>
                    )}
                  </div>
                  {role === "admin" && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/review/${r.id}`}>{lang === "ar" ? "مراجعة" : "Review"}</Link>
                    </Button>
                  )}
                </div>

                {/* Credits cap progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {lang === "ar" ? "ساعات معتمَدة من المعادلة" : "Approved equivalent credits"}
                    </span>
                    <span className="font-bold">
                      {approvedCredits} / {r.credits_cap} {lang === "ar" ? "س" : "h"}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (approvedCredits / r.credits_cap) * 100)}
                    className={`h-2 ${approvedCredits > r.credits_cap ? "[&>div]:bg-destructive" : "[&>div]:bg-success"}`}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                >
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isOpen
                    ? (lang === "ar" ? "إخفاء التفاصيل" : "Hide details")
                    : (lang === "ar" ? `استعراض ${items.length} مادة (${totalSource}س)` : `View ${items.length} courses (${totalSource}h)`)}
                </Button>

                {isOpen && (
                  <div className="rounded-lg border bg-accent/20 p-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="text-xs text-muted-foreground">{lang === "ar" ? "لا مواد." : "No items."}</div>
                    ) : (
                      items.map((it) => {
                        const itMatch = matches.find((m) => (m.source_item_ids || []).includes(it.id));
                        return (
                          <div key={it.id} className="flex flex-wrap items-center justify-between gap-2 text-sm bg-card border rounded-md p-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-foreground truncate">{it.source_course_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {it.source_course_code || "—"} · {it.source_credits}{lang === "ar" ? "س" : "h"}
                                {it.source_grade && <> · {it.source_grade}</>}
                              </div>
                            </div>
                            {itMatch ? (
                              itMatch.verdict === "approved" ? (
                                <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {lang === "ar" ? "معادَلة" : "Equivalent"}</Badge>
                              ) : itMatch.verdict === "rejected" ? (
                                <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {lang === "ar" ? "غير معادَلة" : "Not equivalent"}</Badge>
                              ) : (
                                <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {lang === "ar" ? "قيد المراجعة" : "Pending"}</Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" /> {lang === "ar" ? "بانتظار المراجعة" : "Awaiting review"}</Badge>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {(r.admin_notes || r.reviewer_name) && (
                  <div className={`flex gap-2 text-sm bg-primary/5 p-3 rounded-md ${dir === "rtl" ? "border-r-2" : "border-l-2"} border-primary`}>
                    <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      {r.reviewer_name && (
                        <div className="text-xs">
                          <span className="text-muted-foreground font-heading">{lang === "ar" ? "القرار صادر عن: " : "Reviewed by: "}</span>
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
