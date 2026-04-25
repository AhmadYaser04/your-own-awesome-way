import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Brain,
  ArrowLeft, ArrowRight, FileText, Upload, Image as ImageIcon, FileType2, X, Save, LogIn, Download,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";
import { exportPreliminaryPdf } from "@/lib/exportPreliminaryPdf";

interface Match {
  aut_code: string;
  aut_name: string;
  similarity: number;
  reasoning: string;
}
interface CourseResult {
  saudi_course_name: string;
  extracted_course?: string;
  matches: Match[];
  verdict: "تُعادَل" | "تُعادَل بشروط" | "لا تُعادَل";
  overall_similarity: number;
  summary: string;
}
interface Result {
  // legacy (مادة واحدة)
  matches: Match[];
  verdict: "تُعادَل" | "تُعادَل بشروط" | "لا تُعادَل";
  overall_similarity: number;
  summary: string;
  extracted_course?: string;
  // batch
  is_batch?: boolean;
  courses: CourseResult[];
}

const SAMPLE = `اسم المادة: مقدمة في الذكاء الاصطناعي
الساعات المعتمدة: 3
المخرجات التعليمية: يتعرف الطالب على المفاهيم الأساسية للذكاء الاصطناعي وتاريخه وتطبيقاته. يتقن خوارزميات البحث (BFS, DFS, A*). يفهم تمثيل المعرفة والاستدلال المنطقي. يطبق المفاهيم في حل مسائل عملية باستخدام بايثون.
المواضيع: تعريف الذكاء الاصطناعي، الوكلاء الذكية، البحث العمياء والمستنير، تمثيل المعرفة بمنطق الإسناد، أنظمة الخبراء، مقدمة في تعلم الآلة.`;

type Mode = "text" | "pdf" | "image";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function Equivalency() {
  const { t, dir } = useLang();
  const { user } = useAuth();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<Mode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const verdictConfig = (v: Result["verdict"]) => {
    if (v === "تُعادَل") return { color: "bg-success text-white", icon: CheckCircle2 };
    if (v === "تُعادَل بشروط") return { color: "bg-gold text-gold-foreground", icon: AlertTriangle };
    return { color: "bg-destructive text-destructive-foreground", icon: XCircle };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      toast({
        title: t("eq.error"),
        description: "Max 10MB",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const persistRequest = async (res: Result, descriptionText: string) => {
    if (!user) return;
    setSaving(true);
    const courses = res.courses ?? [];
    const isBatch = (res.is_batch ?? courses.length > 1) && courses.length > 1;
    const top = res.matches?.[0] ?? courses[0]?.matches?.[0];

    const headerName = isBatch
      ? `📚 دفعة من ${courses.length} مواد`
      : courses[0]?.saudi_course_name ||
        res.extracted_course?.split("\n")[0]?.slice(0, 200) ||
        descriptionText.split("\n")[0]?.slice(0, 200) ||
        null;

    const headerDesc = isBatch
      ? `طلب جماعي يحتوي على ${courses.length} مواد سعودية:\n` +
        courses
          .map(
            (c, i) =>
              `${i + 1}. ${c.saudi_course_name} → ${c.matches?.[0]?.aut_name ?? "—"} (${Math.round(
                c.overall_similarity ?? 0
              )}%) — ${c.verdict}`
          )
          .join("\n")
      : descriptionText.slice(0, 8000);

    const { data, error: dbErr } = await supabase
      .from("equivalency_requests")
      .insert([
        {
          user_id: user.id,
          saudi_course_name: headerName,
          saudi_course_description: headerDesc,
          input_mode: mode,
          ai_result: res as unknown as never,
          matched_aut_code: top?.aut_code ?? null,
          matched_aut_name: top?.aut_name ?? null,
          similarity: isBatch
            ? Math.round(
                courses.reduce((a, c) => a + (c.overall_similarity ?? 0), 0) / courses.length
              )
            : res.overall_similarity ?? null,
          verdict: isBatch ? `دفعة (${courses.length} مواد)` : res.verdict ?? null,
          status: "pending",
        },
      ])
      .select("id")
      .single();
    setSaving(false);
    if (dbErr) {
      toast({ title: t("eq.toast.failTitle"), description: dbErr.message, variant: "destructive" });
      return;
    }
    setSavedId(data?.id ?? null);
    toast({ title: t("eq.saved"), description: t("eq.savedDesc") });
  };

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    setSavedId(null);

    let payload: Record<string, unknown> = { inputMode: mode };
    let descriptionForDb = "";

    if (mode === "text") {
      if (input.trim().length < 20) {
        toast({
          title: t("eq.toast.shortTitle"),
          description: t("eq.toast.shortDesc"),
          variant: "destructive",
        });
        return;
      }
      payload.saudiCourse = input.trim();
      descriptionForDb = input.trim();
    } else {
      if (!file) {
        toast({
          title: t("eq.toast.noFileTitle"),
          description: t("eq.toast.noFileDesc"),
          variant: "destructive",
        });
        return;
      }
      setLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        payload.fileDataUrl = dataUrl;
        payload.fileName = file.name;
        descriptionForDb = `[${mode.toUpperCase()}] ${file.name}`;
      } catch (e) {
        setLoading(false);
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("equivalency", { body: payload });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const res = data as Result;
      setResult(res);
      // Auto-save if user is signed in
      const fullDesc = res.extracted_course
        ? `${descriptionForDb}\n---\n${res.extracted_course}`
        : descriptionForDb;
      await persistRequest(res, fullDesc);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast({ title: t("eq.toast.failTitle"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = mode === "text" ? input.trim().length >= 20 : !!file;

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            {t("eq.back")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl">
              <Brain className="h-10 w-10" />
            </div>
            <div>
              <Badge className="bg-gold text-gold-foreground border-0 mb-2">{t("eq.badge")}</Badge>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{t("eq.title")}</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1">{t("eq.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <Card className="p-6 md:p-8 border-2">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); setResult(null); setError(null); }}>
            <TabsList className="grid w-full grid-cols-3 mb-5">
              <TabsTrigger value="text" className="gap-2" disabled={loading}>
                <FileText className="h-4 w-4" />
                {t("eq.tab.text")}
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-2" disabled={loading}>
                <FileType2 className="h-4 w-4" />
                {t("eq.tab.pdf")}
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2" disabled={loading}>
                <ImageIcon className="h-4 w-4" />
                {t("eq.tab.image")}
              </TabsTrigger>
            </TabsList>

            {/* TEXT */}
            <TabsContent value="text" className="space-y-3 mt-0">
              <div className="flex items-center justify-between">
                <label className="font-heading font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t("eq.text.label")}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setInput(SAMPLE)}
                  disabled={loading}
                >
                  {t("eq.text.sample")}
                </Button>
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("eq.text.placeholder")}
                className="min-h-[220px] text-sm leading-relaxed font-body resize-y"
                dir={dir}
                disabled={loading}
              />
              <div className="text-xs text-muted-foreground">{input.length} {t("eq.text.charCount")}</div>
            </TabsContent>

            {/* PDF */}
            <TabsContent value="pdf" className="space-y-3 mt-0">
              <label className="font-heading font-bold text-foreground flex items-center gap-2">
                <FileType2 className="h-5 w-5 text-primary" />
                {t("eq.pdf.label")}
              </label>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
              {!file ? (
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={loading}
                  className="w-full border-2 border-dashed border-primary/40 rounded-xl p-10 text-center hover:bg-accent/40 hover:border-primary transition-colors flex flex-col items-center gap-3"
                >
                  <Upload className="h-10 w-10 text-primary" />
                  <span className="font-heading font-bold text-foreground">{t("eq.pdf.cta")}</span>
                  <span className="text-xs text-muted-foreground">{t("eq.pdf.hint")}</span>
                </button>
              ) : (
                <SelectedFile file={file} onRemove={() => setFile(null)} t={t} />
              )}
            </TabsContent>

            {/* IMAGE */}
            <TabsContent value="image" className="space-y-3 mt-0">
              <label className="font-heading font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                {t("eq.image.label")}
              </label>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
              {!file ? (
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  disabled={loading}
                  className="w-full border-2 border-dashed border-primary/40 rounded-xl p-10 text-center hover:bg-accent/40 hover:border-primary transition-colors flex flex-col items-center gap-3"
                >
                  <ImageIcon className="h-10 w-10 text-primary" />
                  <span className="font-heading font-bold text-foreground">{t("eq.image.cta")}</span>
                  <span className="text-xs text-muted-foreground">{t("eq.image.hint")}</span>
                </button>
              ) : (
                <SelectedFile file={file} onRemove={() => setFile(null)} t={t} preview />
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-5">
            <Button onClick={handleSubmit} disabled={loading || !canSubmit} size="lg" className="gap-2 shadow-elegant">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? (mode === "text" ? t("eq.analyzing") : t("eq.extracting")) : t("eq.analyze")}
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("eq.error")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (() => {
          const courses = result.courses ?? [];
          const isBatch = (result.is_batch ?? courses.length > 1) && courses.length > 1;
          return (
            <div className="space-y-5 animate-fade-up">
              {/* بانر الدفعة */}
              {isBatch && (
                <Alert className="border-2 border-secondary/40 bg-secondary/5">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  <AlertTitle className="text-secondary font-bold">
                    تم استخراج {courses.length} مواد دراسية من الملف
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    سيتم إرسال الطلب كحزمة واحدة. سيقوم المشرف الأكاديمي بمراجعة كل مادة على حدة، ويمكنه قبول أو رفض كل مادة بشكل منفصل.
                  </AlertDescription>
                </Alert>
              )}

              {result.extracted_course && mode !== "text" && !isBatch && (
                <Card className="p-5 bg-accent/40 border-dashed">
                  <div className="text-xs font-heading font-bold text-muted-foreground mb-2">
                    {dir === "rtl" ? "النص المُستخرَج من الملف" : "Extracted text from the file"}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {result.extracted_course}
                  </p>
                </Card>
              )}

              {/* عرض كل مادة */}
              {(isBatch ? courses : [
                {
                  saudi_course_name:
                    courses[0]?.saudi_course_name ||
                    result.extracted_course?.split("\n")[0]?.slice(0, 80) ||
                    "المادة المعروضة",
                  extracted_course: courses[0]?.extracted_course ?? result.extracted_course,
                  matches: result.matches,
                  verdict: result.verdict,
                  overall_similarity: result.overall_similarity,
                  summary: result.summary,
                } as CourseResult,
              ]).map((c, idx) => {
                const v = verdictConfig(c.verdict);
                return (
                  <Card key={idx} className="p-6 md:p-7 border-2 shadow-elegant">
                    {isBatch && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30 font-bold">
                          مادة #{idx + 1}
                        </Badge>
                        <span className="font-heading font-bold text-foreground truncate">
                          {c.saudi_course_name}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-heading">{t("eq.verdictLabel")}</div>
                        <Badge className={`${v.color} hover:${v.color} text-base px-4 py-1.5 font-bold gap-2`}>
                          <v.icon className="h-4 w-4" />
                          {c.verdict}
                        </Badge>
                      </div>
                      <div className={dir === "rtl" ? "text-center md:text-left" : "text-center md:text-right"}>
                        <div className="text-xs text-muted-foreground font-heading mb-1">{t("eq.overall")}</div>
                        <div className="font-heading font-bold text-3xl text-primary">{Math.round(c.overall_similarity)}%</div>
                      </div>
                    </div>
                    <Progress value={c.overall_similarity} className="h-3 mb-3" />
                    <p className="text-sm text-foreground leading-relaxed bg-accent/40 p-3 rounded-lg mb-4">
                      {c.summary}
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs font-heading font-bold text-muted-foreground">
                        {t("eq.bestMatches")} ({c.matches.length})
                      </div>
                      {c.matches.map((m, i) => (
                        <div key={i} className={`p-3 rounded-lg bg-card border ${dir === "rtl" ? "border-r-2 border-r-secondary" : "border-l-2 border-l-secondary"}`}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="font-heading font-bold text-sm text-foreground">{m.aut_name}</div>
                              <div className="text-xs text-muted-foreground">{m.aut_code}</div>
                            </div>
                            <div className="font-heading font-bold text-lg text-primary shrink-0">
                              {Math.round(m.similarity)}%
                            </div>
                          </div>
                          <Progress value={m.similarity} className="h-1.5 mb-2" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{m.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}

              {/* زر تنزيل التقرير الأولي PDF */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <Button
                  onClick={() =>
                    exportPreliminaryPdf({
                      studentName: user?.user_metadata?.full_name || user?.email || "—",
                      studentEmail: user?.email || "—",
                      saudiUniversity: (user?.user_metadata?.saudi_university as string) || "—",
                      inputMode: mode,
                      generatedAt: new Date().toISOString(),
                      courses: (isBatch ? courses : [{
                        saudi_course_name: courses[0]?.saudi_course_name || "المادة",
                        matches: result.matches,
                        verdict: result.verdict,
                        overall_similarity: result.overall_similarity,
                        summary: result.summary,
                        extracted_course: result.extracted_course,
                      } as CourseResult]).map((c) => ({
                        saudi_course: c.saudi_course_name + (c.extracted_course ? `\n${c.extracted_course}` : ""),
                        matches: c.matches,
                        verdict: c.verdict,
                        overall_similarity: c.overall_similarity,
                        summary: c.summary,
                      })),
                    })
                  }
                  size="lg"
                  className="bg-gold text-gold-foreground hover:bg-gold/90 gap-2 flex-1 font-bold shadow-warm"
                >
                  <Download className="h-5 w-5" />
                  {isBatch ? `تحميل تقرير ${courses.length} مواد PDF` : "تحميل التقرير الأولي PDF"}
                </Button>
              </div>

            {user && savedId && (
              <Alert className="border-success/40 bg-success/5">
                <Save className="h-4 w-4 text-success" />
                <AlertTitle className="text-success">{t("eq.saved")}</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
                  <span>{t("eq.savedDesc")}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/my-requests">{t("auth.myReqs")}</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!user && (
              <Alert>
                <LogIn className="h-4 w-4" />
                <AlertTitle>{t("eq.signinToSave")}</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
                  <span>{t("auth.subtitle")}</span>
                  <Button asChild size="sm">
                    <Link to="/auth">{t("auth.signin.cta")}</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {saving && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 justify-center">
                <Loader2 className="h-3 w-3 animate-spin" /> {t("eq.analyzing")}
              </div>
            )}

            <div className="text-center pt-4">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/college">
                  {t("eq.exploreMore")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>{t("eq.tip.title")}</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">{t("eq.tip.desc")}</AlertDescription>
          </Alert>
        )}
      </section>
    </SiteLayout>
  );
}

function SelectedFile({
  file, onRemove, preview, t,
}: { file: File; onRemove: () => void; preview?: boolean; t: (k: string) => string }) {
  const previewUrl = preview ? URL.createObjectURL(file) : null;
  const sizeKB = Math.round(file.size / 1024);
  return (
    <div className="border rounded-xl p-4 bg-accent/30 flex items-start gap-3">
      {preview && previewUrl ? (
        <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-md border" />
      ) : (
        <div className="h-20 w-20 rounded-md border bg-card flex items-center justify-center">
          <FileType2 className="h-8 w-8 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground font-heading mb-1">{t("eq.fileSelected")}</div>
        <div className="font-heading font-bold text-foreground text-sm truncate">{file.name}</div>
        <div className="text-xs text-muted-foreground">{sizeKB} KB</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive gap-1">
        <X className="h-4 w-4" /> {t("eq.remove")}
      </Button>
    </div>
  );
}
