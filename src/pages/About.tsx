import { Link } from "react-router-dom";
import { Brain, Target, Sparkles, Code2, Database, Zap, ShieldCheck, ArrowLeft, Users, Award } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/i18n/LanguageProvider";
import teamAhmadYasser from "@/assets/team-ahmad-yasser.jpeg";
import teamAhmadBahloul from "@/assets/team-ahmad-bahloul.jpeg";
import teamZaidZubdeh from "@/assets/team-zaid-zubdeh.jpeg";
import teamAbdulrahmanAtiweh from "@/assets/team-abdulrahman-atiweh.jpeg";
import teamDrYazan from "@/assets/team-dr-yazan.jpeg";

export default function About() {
  const { t, dir } = useLang();
  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-14">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Badge className="bg-gold text-gold-foreground border-0 mb-4">{t("about.badge")}</Badge>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-3">{t("about.title")}</h1>
          <p className="text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-5xl space-y-6">
        <Card className="p-6 md:p-8">
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-secondary" />
            المشكلة
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            معادلة المواد بين الجامعات عملية يدوية بطيئة، تحتاج خبيراً أكاديمياً لمراجعة كل مادة وفحص توافقها مع الخطة
            المُستهدَفة. تأخذ هذه العملية أسابيع، وقد تتأثر بالعامل البشري. الطلاب الراغبون في التحويل من جامعات سعودية
            إلى تخصص الذكاء الاصطناعي في AUT يحتاجون أداة سريعة تعطيهم تصوراً أولياً لفرص معادلة موادهم.
          </p>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-gold" />
            الحل المقترح
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            نظام ويب يستخدم نماذج اللغة الكبيرة (LLM) لمقارنة وصف المادة السعودية دلالياً مع كامل خطة بكالوريوس الذكاء
            الاصطناعي في AUT، ويُرجع: نسبة تطابق دقيقة، أفضل المواد المُعادِلة، تبريراً واضحاً، وحكماً نهائياً (تُعادَل
            / تُعادَل بشروط / لا تُعادَل).
          </p>
          <Button asChild>
            <Link to="/equivalency" className="gap-2">
              <Sparkles className="h-4 w-4" />
              جرّب النظام الآن
            </Link>
          </Button>
        </Card>

        <div className="grid md:grid-cols-2 gap-5">
          <Card className="p-6">
            <Code2 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-bold text-foreground mb-2">المعمارية التقنية</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pr-5">
              <li>React 18 + TypeScript + Vite</li>
              <li>TailwindCSS + shadcn/ui</li>
              <li>Lovable Cloud (Supabase) Edge Functions</li>
              <li>Lovable AI Gateway — Google Gemini 2.5 Flash</li>
              <li>Tool Calling لإخراج JSON منظّم وموثوق</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Brain className="h-8 w-8 text-secondary mb-3" />
            <h3 className="font-heading font-bold text-foreground mb-2">منهجية المعادلة</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pr-5">
              <li>تحليل دلالي (Semantic Similarity)</li>
              <li>تقاطع المخرجات التعليمية</li>
              <li>مقارنة المواضيع وعمق التغطية</li>
              <li>اعتبار الساعات المعتمدة</li>
              <li>تبرير قابل للقراءة بالعربية</li>
            </ul>
          </Card>
          <Card className="p-6">
            <ShieldCheck className="h-8 w-8 text-success mb-3" />
            <h3 className="font-heading font-bold text-foreground mb-2">الأمن والخصوصية</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pr-5">
              <li>مفتاح AI لا يصل للعميل أبداً</li>
              <li>Validation على المدخلات</li>
              <li>معالجة Rate Limits بسلاسة</li>
              <li>لا تخزين دائم لمحتوى المواد</li>
            </ul>
          </Card>
          <Card className="p-6">
            <Database className="h-8 w-8 text-gold mb-3" />
            <h3 className="font-heading font-bold text-foreground mb-2">المرجع الأكاديمي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              قاعدة المواد المرجعية مأخوذة من خطة بكالوريوس الذكاء الاصطناعي في كلية تكنولوجيا المعلومات بجامعة العقبة
              للتكنولوجيا (تأسس البرنامج عام 2019).
            </p>
            <Button asChild variant="link" size="sm" className="px-0 mt-2">
              <a href="https://www.aut.edu.jo/college/7/ar" target="_blank" rel="noopener noreferrer">
                صفحة الكلية الرسمية ↗
              </a>
            </Button>
          </Card>
        </div>

        <Card className="p-6 md:p-8 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-right">
            <Zap className="h-12 w-12 shrink-0" />
            <div className="flex-1">
              <h3 className="font-heading font-bold text-lg mb-1">جاهز لتجربة النظام؟</h3>
              <p className="text-primary-foreground/85 text-sm">الصق وصف مادة من ميثاقك السعودي واحصل على معادلة فورية.</p>
            </div>
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/equivalency">
                ابدأ الآن
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
