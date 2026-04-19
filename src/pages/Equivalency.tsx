import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Brain, ArrowLeft, FileText } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
}

const SAMPLE = `اسم المادة: مقدمة في الذكاء الاصطناعي
الساعات المعتمدة: 3
المخرجات التعليمية: يتعرف الطالب على المفاهيم الأساسية للذكاء الاصطناعي وتاريخه وتطبيقاته. يتقن خوارزميات البحث (BFS, DFS, A*). يفهم تمثيل المعرفة والاستدلال المنطقي. يطبق المفاهيم في حل مسائل عملية باستخدام بايثون.
المواضيع: تعريف الذكاء الاصطناعي، الوكلاء الذكية، البحث العمياء والمستنير، تمثيل المعرفة بمنطق الإسناد، أنظمة الخبراء، مقدمة في تعلم الآلة.`;

export default function Equivalency() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (input.trim().length < 20) {
      toast({
        title: "النص قصير جداً",
        description: "يرجى لصق وصف المادة كاملاً (20 حرفاً على الأقل).",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("equivalency", {
        body: { saudiCourse: input.trim() },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data as Result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "حدث خطأ غير معروف";
      setError(msg);
      toast({ title: "تعذّر إجراء المعادلة", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verdictConfig = (v: Result["verdict"]) => {
    if (v === "تُعادَل") return { color: "bg-success text-white", icon: CheckCircle2 };
    if (v === "تُعادَل بشروط") return { color: "bg-gold text-gold-foreground", icon: AlertTriangle };
    return { color: "bg-destructive text-destructive-foreground", icon: XCircle };
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            ← الرئيسية
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl">
              <Brain className="h-10 w-10" />
            </div>
            <div>
              <Badge className="bg-gold text-gold-foreground border-0 mb-2">تخصص الذكاء الاصطناعي</Badge>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">معادلة المواد الذكية</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1">
                من ميثاق جامعتك السعودية إلى ميثاق جامعة العقبة للتكنولوجيا
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
        <Card className="p-6 md:p-8 border-2">
          <div className="flex items-center justify-between mb-3">
            <label className="font-heading font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              وصف المادة من الميثاق السعودي
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setInput(SAMPLE)}
              disabled={loading}
            >
              تجربة مثال
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="الصق هنا وصف المادة كاملاً: اسم المادة، الساعات المعتمدة، المخرجات التعليمية، والمواضيع التي تغطيها..."
            className="min-h-[220px] text-sm leading-relaxed font-body resize-y"
            dir="rtl"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{input.length} حرف</span>
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="gap-2 shadow-elegant">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? "جارٍ التحليل..." : "حلّل وأعِد المعادلة"}
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-5 animate-fade-up">
            {/* Verdict */}
            <Card className="p-6 md:p-8 border-2 shadow-elegant">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-heading">القرار النهائي</div>
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
                <div className="text-center md:text-left">
                  <div className="text-xs text-muted-foreground font-heading mb-1">نسبة التطابق الإجمالية</div>
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

            {/* Matches */}
            <div>
              <h3 className="font-heading font-bold text-lg mb-3 text-foreground">
                أفضل المواد المُعادِلة في AUT ({result.matches.length})
              </h3>
              <div className="space-y-3">
                {result.matches.map((m, i) => (
                  <Card key={i} className="p-5 border-r-4 border-r-secondary hover:shadow-elegant transition-all">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-heading font-bold text-foreground">{m.aut_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.aut_code}</div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="font-heading font-bold text-2xl text-primary">{m.similarity}%</div>
                        <div className="text-[10px] text-muted-foreground">تطابق</div>
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
                  استكشف باقي مواد التخصص
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>كيف تحصل على أفضل نتيجة؟</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              الصق وصف المادة كاملاً من الخطة الدراسية لجامعتك السعودية، متضمناً: اسم المادة، الساعات المعتمدة،
              المخرجات التعليمية، والمواضيع التفصيلية. كلما كان الوصف أدق، كانت نتيجة المعادلة أعلى دقة.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </SiteLayout>
  );
}
