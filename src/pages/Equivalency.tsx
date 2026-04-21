import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Brain,
  ArrowLeft, ArrowRight, FileText, Upload, Image as ImageIcon, FileType2, X,
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

interface Match {
  aut_code: string;
  aut_name: string;
  similarity: number;
  reasoning: string;
}
interface Result {
  matches: Match[];
  verdict: "تُعادَل" | "تُعادَل بشروط" | "لا تُعادَل";
  overall_similarity: number;
  summary: string;
  extracted_course?: string;
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
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [mode, setMode] = useState<Mode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    let payload: Record<string, unknown> = { inputMode: mode };

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
      setResult(data as Result);
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

        {result && (
          <div className="space-y-5 animate-fade-up">
            {result.extracted_course && mode !== "text" && (
              <Card className="p-5 bg-accent/40 border-dashed">
                <div className="text-xs font-heading font-bold text-muted-foreground mb-2">
                  {dir === "rtl" ? "النص المُستخرَج من الملف" : "Extracted text from the file"}
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {result.extracted_course}
                </p>
              </Card>
            )}

            {/* Verdict */}
            <Card className="p-6 md:p-8 border-2 shadow-elegant">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-heading">{t("eq.verdictLabel")}</div>
                  {(() => {
                    const v = verdictConfig(result.verdict);
                    return (
                      <Badge className={`${v.color} hover:${v.color} text-base px-4 py-1.5 font-bold gap-2`}>
                        <v.icon className="h-4 w-4" />
                        {result.verdict}
                      </Badge>
                    );
                  })()}
                </div>
                <div className={dir === "rtl" ? "text-center md:text-left" : "text-center md:text-right"}>
                  <div className="text-xs text-muted-foreground font-heading mb-1">{t("eq.overall")}</div>
                  <div className="font-heading font-bold text-4xl text-primary">
                    {result.overall_similarity}%
                  </div>
                </div>
              </div>
              <Progress value={result.overall_similarity} className="h-3 mb-4" />
              <p className="text-sm text-foreground leading-relaxed bg-accent/40 p-4 rounded-lg">
                {result.summary}
              </p>
            </Card>

            <div>
              <h3 className="font-heading font-bold text-lg mb-3 text-foreground">
                {t("eq.bestMatches")} ({result.matches.length})
              </h3>
              <div className="space-y-3">
                {result.matches.map((m, i) => (
                  <Card key={i} className={`p-5 ${dir === "rtl" ? "border-r-4 border-r-secondary" : "border-l-4 border-l-secondary"} hover:shadow-elegant transition-all`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-heading font-bold text-foreground">{m.aut_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.aut_code}</div>
                      </div>
                      <div className={dir === "rtl" ? "text-left shrink-0" : "text-right shrink-0"}>
                        <div className="font-heading font-bold text-2xl text-primary">{m.similarity}%</div>
                        <div className="text-[10px] text-muted-foreground">{t("eq.matchPct")}</div>
                      </div>
                    </div>
                    <Progress value={m.similarity} className="h-2 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.reasoning}</p>
                  </Card>
                ))}
              </div>
            </div>

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
