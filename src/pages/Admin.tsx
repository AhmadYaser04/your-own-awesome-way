import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Filter, FileText,
  User as UserIcon, Building2, BookOpen, Calendar, Eye, MessageSquare,
  RefreshCw, Download, TrendingUp, Award, Hash, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import campus from "@/assets/aut-campus.png";
import logo from "@/assets/aut-logo-full.jpg";

type Status = "pending" | "approved" | "rejected";

interface ReqRow {
  id: string;
  user_id: string;
  saudi_course_name: string | null;
  saudi_course_description: string | null;
  input_mode: string;
  matched_aut_code: string | null;
  matched_aut_name: string | null;
  similarity: number | null;
  verdict: string | null;
  status: Status;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  ai_result: unknown;
  profile?: { full_name: string | null; email: string | null; saudi_university: string | null };
}

export default function Admin() {
  const { t, dir, lang } = useLang();
  const { user } = useAuth();
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Status>("pending");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ReqRow | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: reqs, error } = await supabase
      .from("equivalency_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const ids = Array.from(new Set((reqs ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase
      .from("profiles").select("id, full_name, email, saudi_university").in("id", ids);
    const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
    setRows(((reqs ?? []) as ReqRow[]).map((r) => ({ ...r, profile: map.get(r.user_id) ?? undefined })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    const decided = approved + rejected;
    const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;
    const lastReview = rows
      .filter((r) => r.reviewed_at)
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime())[0]
      ?.reviewed_at;
    return { total, pending, approved, rejected, approvalRate, lastReview };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
          r.saudi_course_name?.toLowerCase().includes(s) ||
          r.matched_aut_name?.toLowerCase().includes(s) ||
          r.profile?.full_name?.toLowerCase().includes(s) ||
          r.profile?.email?.toLowerCase().includes(s) ||
          r.id.toLowerCase().includes(s)
        );
      });
  }, [rows, filter, search]);

  const decide = async (status: Status) => {
    if (!active || !user) return;
    setBusy(true);
    const { error } = await supabase
      .from("equivalency_requests")
      .update({
        status,
        admin_notes: notes.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", active.id);
    setBusy(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: status === "approved" ? t("admin.approvedToast") : t("admin.rejectedToast"),
    });
    setActive(null);
    setNotes("");
    setDescExpanded(false);
    load();
  };

  const exportCsv = () => {
    const header = ["id", "student", "email", "saudi_university", "course", "matched", "code", "similarity", "status", "verdict", "submitted", "reviewed"];
    const lines = filtered.map((r) => [
      r.id,
      r.profile?.full_name ?? "",
      r.profile?.email ?? "",
      r.profile?.saudi_university ?? "",
      r.saudi_course_name ?? "",
      r.matched_aut_name ?? "",
      r.matched_aut_code ?? "",
      r.similarity ?? "",
      r.status,
      r.verdict ?? "",
      r.created_at,
      r.reviewed_at ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equivalency-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s: Status) => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {t("admin.statusApproved")}</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {t("admin.statusRejected")}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {t("admin.statusPending")}</Badge>;
  };

  return (
    <SiteLayout>
      {/* HERO with logo + campus image — official committee portal */}
      <section className="relative overflow-hidden text-primary-foreground border-b-4 border-gold">
        <div className="absolute inset-0">
          <img src={campus} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/75" />
        </div>
        <div className="relative container mx-auto px-4 py-10 max-w-6xl">
          <Link to="/" className="inline-block text-primary-foreground/80 hover:text-primary-foreground text-sm mb-4">
            {t("eq.back")}
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Official seal: AUT logo */}
            <div className="bg-card p-3 rounded-2xl shadow-elegant shrink-0 self-start md:self-auto">
              <img
                src={logo}
                alt="AUT"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-gold text-gold-foreground border-0 gap-1">
                  <ShieldCheck className="h-3 w-3" /> {t("admin.officialBadge")}
                </Badge>
                <Badge variant="outline" className="border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10">
                  {t("admin.badge")}
                </Badge>
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight">
                {t("admin.title")}
              </h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1.5">
                {t("admin.heroTagline")}
              </p>
              {user?.email && (
                <p className="text-primary-foreground/70 text-xs mt-2">
                  {t("admin.welcome")} <span className="font-bold text-gold">{user.email}</span>
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex md:flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={load}
                className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground gap-1.5 backdrop-blur"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t("admin.refresh")}
              </Button>
              <Button
                size="sm"
                onClick={exportCsv}
                className="bg-gold hover:bg-gold/90 text-gold-foreground gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> {t("admin.exportCsv")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Stats — 6 cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label={t("admin.statTotal")} value={stats.total} icon={FileText} tone="primary" />
          <StatCard label={t("admin.statPending")} value={stats.pending} icon={Clock} tone="gold" />
          <StatCard label={t("admin.statApproved")} value={stats.approved} icon={CheckCircle2} tone="success" />
          <StatCard label={t("admin.statRejected")} value={stats.rejected} icon={XCircle} tone="destructive" />
          <StatCard label={t("admin.approvalRate")} value={`${stats.approvalRate}%`} icon={TrendingUp} tone="primary" />
          <StatCard
            label={t("admin.lastReview")}
            value={stats.lastReview ? new Date(stats.lastReview).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : t("admin.never")}
            icon={Award}
            tone="gold"
            small
          />
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="pending" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> {t("admin.statusPending")} ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.statusApproved")} ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="h-3.5 w-3.5" /> {t("admin.statusRejected")} ({stats.rejected})</TabsTrigger>
                <TabsTrigger value="all" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> {t("admin.all")} ({stats.total})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.searchPh")}
                className={dir === "rtl" ? "pr-9" : "pl-9"}
              />
            </div>
          </div>
        </Card>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">{t("admin.empty")}</Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className={`p-5 ${dir === "rtl" ? "border-r-4" : "border-l-4"} ${
                r.status === "approved" ? (dir === "rtl" ? "border-r-success" : "border-l-success")
                : r.status === "rejected" ? (dir === "rtl" ? "border-r-destructive" : "border-l-destructive")
                : (dir === "rtl" ? "border-r-gold" : "border-l-gold")
              } hover:shadow-elegant transition-all`}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(r.status)}
                      <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {r.input_mode.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {r.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                    <div className="font-heading font-bold text-foreground">
                      {r.saudi_course_name || r.saudi_course_description?.slice(0, 70) || t("admin.unnamed")}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {r.profile?.full_name || "—"}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {r.profile?.saudi_university || "—"}</span>
                      {r.matched_aut_name && (
                        <span className="flex items-center gap-1 text-primary font-bold">
                          <BookOpen className="h-3 w-3" /> → {r.matched_aut_name} ({r.matched_aut_code})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.similarity !== null && (
                      <div className={dir === "rtl" ? "text-left" : "text-right"}>
                        <div className="font-heading font-bold text-2xl text-primary leading-none">{Math.round(Number(r.similarity))}%</div>
                        <div className="text-[10px] text-muted-foreground">{t("admin.aiSimilarity")}</div>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setActive(r); setNotes(r.admin_notes || ""); setDescExpanded(false); }}>
                      <Eye className="h-4 w-4" /> {t("admin.review")}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Review dialog — official committee form */}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setNotes(""); setDescExpanded(false); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0" dir={dir}>
          {active && (
            <>
              {/* Official header inside dialog */}
              <div className="bg-primary text-primary-foreground p-5 rounded-t-lg flex items-center gap-3">
                <img src={logo} alt="AUT" className="h-12 w-auto bg-card rounded-md p-1.5 object-contain" />
                <div className="flex-1 min-w-0">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-primary-foreground text-lg">
                      {t("admin.reviewTitle")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="text-xs text-primary-foreground/75 flex items-center gap-1.5 mt-0.5">
                    <Hash className="h-3 w-3" /> {active.id}
                  </div>
                </div>
                {statusBadge(active.status)}
              </div>

              <div className="p-5 space-y-5">
                {/* Student block */}
                <div>
                  <div className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> {t("admin.student")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-accent/30 rounded-lg p-4 border">
                    <InfoCell label={t("admin.student")} value={active.profile?.full_name || "—"} />
                    <InfoCell label={t("admin.email")} value={active.profile?.email || "—"} />
                    <InfoCell label={t("auth.saudiUni")} value={active.profile?.saudi_university || "—"} />
                    <InfoCell label={t("admin.submitted")} value={new Date(active.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} />
                    <InfoCell label={t("admin.inputMode")} value={active.input_mode.toUpperCase()} />
                    {active.reviewed_at && (
                      <InfoCell label={t("admin.reviewedAt")} value={new Date(active.reviewed_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} />
                    )}
                  </div>
                </div>

                {/* Saudi course description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> {t("admin.saudiDesc")}
                    </div>
                    {(active.saudi_course_description?.length ?? 0) > 300 && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setDescExpanded((v) => !v)}>
                        {descExpanded ? <><ChevronUp className="h-3 w-3" /> {t("admin.viewFullDesc")}</> : <><ChevronDown className="h-3 w-3" /> {t("admin.viewFullDesc")}</>}
                      </Button>
                    )}
                  </div>
                  {active.saudi_course_name && (
                    <div className="font-heading font-bold mb-1.5">{active.saudi_course_name}</div>
                  )}
                  <div className={`bg-muted/50 p-3 rounded-md text-sm whitespace-pre-line border ${descExpanded ? "" : "max-h-40 overflow-y-auto"}`}>
                    {active.saudi_course_description || "—"}
                  </div>
                </div>

                {/* AI verdict */}
                {active.matched_aut_name && (
                  <div className="bg-gradient-to-br from-primary/5 to-gold/5 p-4 rounded-lg border border-primary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-heading font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> {t("admin.aiAnalysis")}
                      </div>
                      {active.verdict && <Badge variant="outline" className="text-xs">{active.verdict}</Badge>}
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground font-heading uppercase">{t("admin.aiCourseMatch")}</div>
                      <div className="font-heading font-bold text-foreground">
                        → {active.matched_aut_name}{" "}
                        <span className="text-xs text-muted-foreground">({active.matched_aut_code})</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{t("admin.confidence")}</span>
                        <span className="font-heading font-bold text-primary">{Math.round(Number(active.similarity ?? 0))}%</span>
                      </div>
                      <Progress value={Number(active.similarity ?? 0)} className="h-2" />
                    </div>
                  </div>
                )}

                <Separator />

                {/* Committee notes */}
                <div>
                  <div className="font-heading font-bold text-sm mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" /> {t("admin.notesLabel")}
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("admin.notesPh")}
                    className="min-h-[100px]"
                    dir={dir}
                  />
                </div>

                {/* Decision buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Button onClick={() => decide("approved")} disabled={busy} className="bg-success hover:bg-success/90 text-white gap-2 flex-1">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {t("admin.approve")}
                  </Button>
                  <Button onClick={() => decide("rejected")} disabled={busy} variant="destructive" className="gap-2 flex-1">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {t("admin.reject")}
                  </Button>
                  <Button onClick={() => decide("pending")} disabled={busy} variant="outline" className="gap-2">
                    <Clock className="h-4 w-4" />
                    {t("admin.markPending")}
                  </Button>
                </div>

                {/* Committee seal footer */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground border-t pt-3">
                  <ShieldCheck className="h-3 w-3 text-gold" />
                  <span className="font-heading">{t("admin.committeeSeal")} · {t("footer.uni")}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function StatCard({
  label, value, icon: Icon, tone, small,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "gold" | "success" | "destructive";
  small?: boolean;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <Card className="p-4 flex items-center gap-3 hover:shadow-elegant transition-shadow">
      <div className={`p-2.5 rounded-xl ${toneCls} shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-wide truncate">{label}</div>
        <div className={`font-heading font-bold text-foreground leading-tight truncate ${small ? "text-sm" : "text-2xl"}`}>{value}</div>
      </div>
    </Card>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground font-heading uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium text-foreground truncate">{value}</div>
    </div>
  );
}
