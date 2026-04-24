import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, ShieldCheck, CheckCircle2, XCircle, Clock, Search, Filter, FileText,
  User as UserIcon, Building2, BookOpen, Calendar, Eye, MessageSquare,
  RefreshCw, Download, TrendingUp, Award, Hash, Sparkles, ChevronDown, ChevronUp,
  Copy, Trash2, Printer, ArrowUpDown, Activity, BarChart3, GraduationCap,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";
import { exportDecisionPdf } from "@/lib/exportDecisionPdf";
import campus from "@/assets/aut-campus-bright.png";
import logo from "@/assets/aut-logo-full.jpg";

type Status = "pending" | "approved" | "rejected";
type SortKey = "newest" | "oldest" | "simHigh" | "simLow";

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
  const [sort, setSort] = useState<SortKey>("newest");
  const [active, setActive] = useState<ReqRow | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[] } | null>(null);

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
    setSelected(new Set());
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
    const sims = rows.map((r) => Number(r.similarity ?? 0)).filter((n) => n > 0);
    const avgSim = sims.length ? Math.round(sims.reduce((a, b) => a + b, 0) / sims.length) : 0;
    const lastReview = rows
      .filter((r) => r.reviewed_at)
      .sort((a, b) => new Date(b.reviewed_at!).getTime() - new Date(a.reviewed_at!).getTime())[0]
      ?.reviewed_at;
    return { total, pending, approved, rejected, approvalRate, lastReview, avgSim };
  }, [rows]);

  // Charts: status pie (as bar), 14-day activity, top universities
  const charts = useMemo(() => {
    const pie = [
      { name: t("admin.statusPending"), value: stats.pending, color: "hsl(var(--gold))" },
      { name: t("admin.statusApproved"), value: stats.approved, color: "hsl(var(--success))" },
      { name: t("admin.statusRejected"), value: stats.rejected, color: "hsl(var(--destructive))" },
    ];
    // 14-day activity
    const days: { day: string; submitted: number; decided: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const key = d.toISOString().slice(5, 10);
      const submitted = rows.filter((r) => {
        const c = new Date(r.created_at); return c >= d && c < next;
      }).length;
      const decided = rows.filter((r) => {
        if (!r.reviewed_at) return false;
        const c = new Date(r.reviewed_at); return c >= d && c < next;
      }).length;
      days.push({ day: key, submitted, decided });
    }
    // Top unis
    const uniCounts: Record<string, number> = {};
    for (const r of rows) {
      const u = r.profile?.saudi_university?.trim() || "—";
      uniCounts[u] = (uniCounts[u] || 0) + 1;
    }
    const topUnis = Object.entries(uniCounts)
      .map(([name, value]) => ({ name: name.length > 24 ? name.slice(0, 22) + "…" : name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 5);
    return { pie, days, topUnis };
  }, [rows, stats, t]);

  const filtered = useMemo(() => {
    const f = rows
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
          r.saudi_course_name?.toLowerCase().includes(s) ||
          r.matched_aut_name?.toLowerCase().includes(s) ||
          r.profile?.full_name?.toLowerCase().includes(s) ||
          r.profile?.email?.toLowerCase().includes(s) ||
          r.profile?.saudi_university?.toLowerCase().includes(s) ||
          r.id.toLowerCase().includes(s)
        );
      });
    return [...f].sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      const sa = Number(a.similarity ?? 0), sb = Number(b.similarity ?? 0);
      return sort === "simHigh" ? sb - sa : sa - sb;
    });
  }, [rows, filter, search, sort]);

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
    // refresh active row in-place so the print PDF can use latest values
    const refreshed: ReqRow = { ...active, status, admin_notes: notes.trim() || null, reviewed_at: new Date().toISOString() };
    setActive(refreshed);
    load();
  };

  const printPdf = (r: ReqRow) => {
    exportDecisionPdf({
      requestId: r.id,
      studentName: r.profile?.full_name || "—",
      studentEmail: r.profile?.email || "—",
      saudiUniversity: r.profile?.saudi_university || "—",
      saudiCourseName: r.saudi_course_name || "(unnamed)",
      saudiCourseDescription: r.saudi_course_description || "",
      inputMode: r.input_mode,
      matchedCode: r.matched_aut_code || "—",
      matchedName: r.matched_aut_name || "—",
      similarity: Number(r.similarity ?? 0),
      verdict: r.verdict || "—",
      status: r.status,
      adminNotes: r.admin_notes || "",
      reviewerEmail: user?.email || "—",
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toLocaleString("en-US") : "—",
      submittedAt: new Date(r.created_at).toLocaleString("en-US"),
    });
  };

  const exportCsv = () => {
    const header = ["id", "student", "email", "saudi_university", "course", "matched", "code", "similarity", "status", "verdict", "submitted", "reviewed"];
    const lines = filtered.map((r) => [
      r.id, r.profile?.full_name ?? "", r.profile?.email ?? "", r.profile?.saudi_university ?? "",
      r.saudi_course_name ?? "", r.matched_aut_name ?? "", r.matched_aut_code ?? "",
      r.similarity ?? "", r.status, r.verdict ?? "", r.created_at, r.reviewed_at ?? "",
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

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };
  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.id)));
  };

  const bulkUpdate = async (status: Status) => {
    if (!user || selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("equivalency_requests")
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: t("admin.bulkOk").replace("{n}", String(ids.length)) });
    load();
  };

  const doDelete = async (ids: string[]) => {
    const { error } = await supabase.from("equivalency_requests").delete().in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: t("admin.deletedToast") });
    setConfirmDelete(null);
    if (active && ids.includes(active.id)) setActive(null);
    load();
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: t("admin.copied"), description: id });
  };

  const statusBadge = (s: Status) => {
    if (s === "approved") return <Badge className="bg-success text-white gap-1"><CheckCircle2 className="h-3 w-3" /> {t("admin.statusApproved")}</Badge>;
    if (s === "rejected") return <Badge className="bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" /> {t("admin.statusRejected")}</Badge>;
    return <Badge className="bg-gold text-gold-foreground gap-1"><Clock className="h-3 w-3" /> {t("admin.statusPending")}</Badge>;
  };

  return (
    <SiteLayout>
      {/* HERO */}
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
            <div className="bg-card p-3 rounded-2xl shadow-elegant shrink-0 self-start md:self-auto">
              <img src={logo} alt="AUT" className="h-20 w-auto object-contain" />
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
              <h1 className="font-heading text-2xl md:text-3xl font-bold leading-tight">{t("admin.title")}</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1.5">{t("admin.heroTagline")}</p>
              {user?.email && (
                <p className="text-primary-foreground/70 text-xs mt-2">
                  {t("admin.welcome")} <span className="font-bold text-gold">{user.email}</span>
                </p>
              )}
            </div>

            <div className="flex md:flex-col gap-2 shrink-0">
              <Button size="sm" onClick={load} className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground gap-1.5 backdrop-blur">
                <RefreshCw className="h-3.5 w-3.5" /> {t("admin.refresh")}
              </Button>
              <Button size="sm" onClick={exportCsv} className="bg-gold hover:bg-gold/90 text-gold-foreground gap-1.5">
                <Download className="h-3.5 w-3.5" /> {t("admin.exportCsv")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          <StatCard label={t("admin.statTotal")} value={stats.total} icon={FileText} tone="primary" />
          <StatCard label={t("admin.statPending")} value={stats.pending} icon={Clock} tone="gold" />
          <StatCard label={t("admin.statApproved")} value={stats.approved} icon={CheckCircle2} tone="success" />
          <StatCard label={t("admin.statRejected")} value={stats.rejected} icon={XCircle} tone="destructive" />
          <StatCard label={t("admin.approvalRate")} value={`${stats.approvalRate}%`} icon={TrendingUp} tone="primary" />
          <StatCard label={t("admin.avgSimilarity")} value={`${stats.avgSim}%`} icon={Activity} tone="highlight" />
          <StatCard
            label={t("admin.lastReview")}
            value={stats.lastReview ? new Date(stats.lastReview).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : t("admin.never")}
            icon={Award} tone="gold" small
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm">{t("admin.chartDaily")}</h3>
            </div>
            <div className="h-[200px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="submitted" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={{ r: 3 }} name={t("admin.submitted")} />
                  <Line type="monotone" dataKey="decided" stroke="hsl(var(--gold))" strokeWidth={2.5} dot={{ r: 3 }} name={t("admin.reviewedAt")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm">{t("admin.chartTitle")}</h3>
            </div>
            <div className="h-[200px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.pie}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {charts.pie.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {charts.topUnis.length > 0 && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm">{t("admin.topUnis")}</h3>
            </div>
            <div className="h-[180px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topUnis} layout="vertical" margin={{ left: 90 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={120} />
                  <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Filters / Sort / Bulk */}
        <Card className="p-4 md:p-5 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList>
                <TabsTrigger value="pending" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> {t("admin.statusPending")} ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.statusApproved")} ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="h-3.5 w-3.5" /> {t("admin.statusRejected")} ({stats.rejected})</TabsTrigger>
                <TabsTrigger value="all" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> {t("admin.all")} ({stats.total})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2 items-center">
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-[170px] h-9 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 me-1" />
                  <SelectValue placeholder={t("admin.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("admin.sortNewest")}</SelectItem>
                  <SelectItem value="oldest">{t("admin.sortOldest")}</SelectItem>
                  <SelectItem value="simHigh">{t("admin.sortSimilarityHigh")}</SelectItem>
                  <SelectItem value="simLow">{t("admin.sortSimilarityLow")}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-64">
                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${dir === "rtl" ? "right-3" : "left-3"}`} />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.searchPh")} className={dir === "rtl" ? "pr-9" : "pl-9"} />
              </div>
            </div>
          </div>

          {/* Bulk actions bar */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleSelectAll}
                />
                {t("admin.selectAll")}
              </label>
              {selected.size > 0 && (
                <>
                  <Badge variant="outline" className="gap-1">{selected.size} {t("admin.selected")}</Badge>
                  <Button size="sm" className="bg-success hover:bg-success/90 text-white gap-1 h-8" onClick={() => bulkUpdate("approved")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("admin.bulkApprove")}
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1 h-8" onClick={() => bulkUpdate("rejected")}>
                    <XCircle className="h-3.5 w-3.5" /> {t("admin.bulkReject")}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 h-8 text-destructive border-destructive/50" onClick={() => setConfirmDelete({ ids: Array.from(selected) })}>
                    <Trash2 className="h-3.5 w-3.5" /> {t("admin.bulkDelete")}
                  </Button>
                </>
              )}
            </div>
          )}
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
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={selected.has(r.id)}
                      onCheckedChange={() => toggleSelect(r.id)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {statusBadge(r.status)}
                        <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" /> {r.input_mode.toUpperCase()}</Badge>
                        <button
                          type="button"
                          onClick={() => copyId(r.id)}
                          className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                          title={t("admin.copyId")}
                        >
                          <Hash className="h-3 w-3" /> {r.id.slice(0, 8)} <Copy className="h-3 w-3" />
                        </button>
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
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {r.similarity !== null && (
                      <div className={dir === "rtl" ? "text-left" : "text-right"}>
                        <div className="font-heading font-bold text-2xl text-primary leading-none">{Math.round(Number(r.similarity))}%</div>
                        <div className="text-[10px] text-muted-foreground">{t("admin.aiSimilarity")}</div>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="gap-1 border-gold/50 text-gold-foreground bg-gold/15 hover:bg-gold/25" onClick={() => printPdf(r)}>
                      <Printer className="h-4 w-4" /> PDF
                    </Button>
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

      {/* Review dialog */}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setNotes(""); setDescExpanded(false); } }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0" dir={dir}>
          {active && (
            <>
              <div className="bg-primary text-primary-foreground p-5 rounded-t-lg flex items-center gap-3">
                <img src={logo} alt="AUT" className="h-12 w-auto bg-card rounded-md p-1.5 object-contain" />
                <div className="flex-1 min-w-0">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-primary-foreground text-lg">
                      {t("admin.reviewTitle")}
                    </DialogTitle>
                  </DialogHeader>
                  <button onClick={() => copyId(active.id)} className="text-xs text-primary-foreground/75 hover:text-primary-foreground flex items-center gap-1.5 mt-0.5">
                    <Hash className="h-3 w-3" /> {active.id} <Copy className="h-3 w-3" />
                  </button>
                </div>
                {statusBadge(active.status)}
              </div>

              <div className="p-5 space-y-5">
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> {t("admin.saudiDesc")}
                    </div>
                    {(active.saudi_course_description?.length ?? 0) > 300 && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs gap-1" onClick={() => setDescExpanded((v) => !v)}>
                        {descExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {t("admin.viewFullDesc")}
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
                    <Clock className="h-4 w-4" /> {t("admin.markPending")}
                  </Button>
                </div>

                {/* PDF + Delete — PDF always available */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => printPdf(active)}
                    className="bg-gold hover:bg-gold/90 text-gold-foreground gap-2 flex-1 font-bold shadow-warm"
                  >
                    <Printer className="h-4 w-4" /> {t("admin.printPdf")}
                  </Button>
                  <Button onClick={() => setConfirmDelete({ ids: [active.id] })} variant="outline" className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" /> {t("admin.delete")}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground border-t pt-3">
                  <ShieldCheck className="h-3 w-3 text-gold" />
                  <span className="font-heading">{t("admin.committeeSeal")} · {t("footer.uni")}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.ids.length} {t("admin.selected")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.markPending")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmDelete && doDelete(confirmDelete.ids)}>
              <Trash2 className="h-4 w-4 me-1" /> {t("admin.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SiteLayout>
  );
}

function StatCard({
  label, value, icon: Icon, tone, small,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "gold" | "success" | "destructive" | "highlight";
  small?: boolean;
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    gold: "bg-gold/15 text-gold",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    highlight: "bg-highlight/15 text-highlight",
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
