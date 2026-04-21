import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Filter, FileText, User as UserIcon, Building2, BookOpen, Calendar, Eye, MessageSquare } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import campus from "@/assets/aut-campus.png";

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
    // fetch all related profiles
    const ids = Array.from(new Set((reqs ?? []).map((r) => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id, full_name, email, saudi_university").in("id", ids);
    const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
    setRows(((reqs ?? []) as ReqRow[]).map((r) => ({ ...r, profile: map.get(r.user_id) ?? undefined })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const approved = rows.filter((r) => r.status === "approved").length;
    const rejected = rows.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, rejected };
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
          r.profile?.email?.toLowerCase().includes(s)
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
    load();
  };

  const statusBadge = (s: Status) => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {t("admin.statusApproved")}</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {t("admin.statusRejected")}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {t("admin.statusPending")}</Badge>;
  };

  return (
    <SiteLayout>
      {/* HERO with campus image */}
      <section className="relative overflow-hidden text-primary-foreground">
        <div className="absolute inset-0">
          <img src={campus} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/70" />
        </div>
        <div className="relative container mx-auto px-4 py-12 max-w-6xl">
          <Link to="/" className="inline-block text-primary-foreground/80 hover:text-primary-foreground text-sm mb-3">
            {t("eq.back")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl shadow-elegant">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <Badge className="bg-gold text-gold-foreground border-0 mb-2">{t("admin.badge")}</Badge>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{t("admin.title")}</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1 max-w-2xl">{t("admin.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={t("admin.statTotal")} value={stats.total} icon={FileText} tone="primary" />
          <StatCard label={t("admin.statPending")} value={stats.pending} icon={Clock} tone="gold" />
          <StatCard label={t("admin.statApproved")} value={stats.approved} icon={CheckCircle2} tone="success" />
          <StatCard label={t("admin.statRejected")} value={stats.rejected} icon={XCircle} tone="destructive" />
        </div>

        {/* Filters */}
        <Card className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="pending" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> {t("admin.statusPending")}</TabsTrigger>
                <TabsTrigger value="approved" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.statusApproved")}</TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="h-3.5 w-3.5" /> {t("admin.statusRejected")}</TabsTrigger>
                <TabsTrigger value="all" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> {t("admin.all")}</TabsTrigger>
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
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setActive(r); setNotes(r.admin_notes || ""); }}>
                      <Eye className="h-4 w-4" /> {t("admin.review")}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Review dialog */}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setNotes(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
          <DialogHeader>
            <DialogTitle className="font-heading">{t("admin.reviewTitle")}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoCell label={t("admin.student")} value={active.profile?.full_name || "—"} />
                <InfoCell label={t("admin.email")} value={active.profile?.email || "—"} />
                <InfoCell label={t("auth.saudiUni")} value={active.profile?.saudi_university || "—"} />
                <InfoCell label={t("admin.submitted")} value={new Date(active.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")} />
              </div>

              <div>
                <div className="font-heading font-bold text-sm mb-1.5">{t("admin.saudiDesc")}</div>
                <div className="bg-accent/40 p-3 rounded-md text-sm whitespace-pre-line max-h-40 overflow-y-auto border">
                  {active.saudi_course_description || "—"}
                </div>
              </div>

              {active.matched_aut_name && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-2">
                  <div className="text-xs text-muted-foreground font-heading">{t("admin.aiVerdict")}</div>
                  <div className="font-heading font-bold text-foreground">
                    → {active.matched_aut_name} <span className="text-xs text-muted-foreground">({active.matched_aut_code})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={Number(active.similarity ?? 0)} className="h-2 flex-1" />
                    <span className="font-heading font-bold text-primary text-sm">{Math.round(Number(active.similarity ?? 0))}%</span>
                  </div>
                  {active.verdict && <Badge variant="outline" className="text-xs">{active.verdict}</Badge>}
                </div>
              )}

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

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "gold" | "success" | "destructive";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  }[tone];
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`p-3 rounded-xl ${toneCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground font-heading">{label}</div>
        <div className="font-heading font-bold text-2xl text-foreground leading-none">{value}</div>
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
