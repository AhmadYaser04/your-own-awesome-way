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

      {/* Project team — supervisor & students */}
      <section className="container mx-auto px-4 pt-10 max-w-5xl">
        <div className="text-center mb-8 space-y-2">
          <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full">
            <Users className="h-3.5 w-3.5" />
            {dir === "rtl" ? "فريق مشروع التخرج" : "Graduation Project Team"}
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {dir === "rtl" ? "القائمون على المشروع" : "Project Contributors"}
          </h2>
        </div>

        {/* Supervisor */}
        <Card className="p-6 md:p-8 mb-5 bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-gold/30 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gold p-[3px] shadow-warm">
                <img
                  src={teamDrYazan}
                  alt={dir === "rtl" ? "د. يزن الوقفي" : "Dr. Yazan Al-Waqfi"}
                  className="w-full h-full rounded-2xl object-cover bg-card"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
              <div className="absolute -bottom-2 -end-2 bg-gold text-gold-foreground p-1.5 rounded-full shadow-warm">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <span className="inline-block text-[11px] font-bold bg-primary-foreground/20 backdrop-blur-md px-3 py-1 rounded-full">
                {dir === "rtl" ? "المشرف على المشروع" : "Project Supervisor"}
              </span>
              <h3 className="font-heading text-2xl md:text-3xl font-bold">
                {dir === "rtl" ? "د. يزن الوقفي" : "Dr. Yazan Al-Waqfi"}
              </h3>
              <p className="text-primary-foreground/85 text-sm">
                {dir === "rtl"
                  ? "قسم الذكاء الاصطناعي وعلم البيانات — جامعة العقبة للتكنولوجيا"
                  : "Department of AI & Data Science — Aqaba University of Technology"}
              </p>
            </div>
          </div>
        </Card>

        {/* Students */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: dir === "rtl" ? "م. أحمد ياسر" : "Eng. Ahmad Yasser", photo: teamAhmadYasser },
            { name: dir === "rtl" ? "م. أحمد بهلول" : "Eng. Ahmad Bahloul", photo: teamAhmadBahloul },
            { name: dir === "rtl" ? "م. زيد زبدة" : "Eng. Zaid Zubdeh", photo: teamZaidZubdeh },
            { name: dir === "rtl" ? "م. عبدالرحمن عطيوة" : "Eng. Abdulrahman Atiweh", photo: teamAbdulrahmanAtiweh },
          ].map((s, i) => (
            <Card
              key={s.name}
              className="p-5 text-center bg-gradient-to-b from-card to-accent/30 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative w-20 h-20 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary to-primary p-[3px] shadow-elegant">
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="w-full h-full rounded-full object-cover bg-card"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              </div>
              <div className="font-heading font-bold text-foreground">{s.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dir === "rtl" ? "عضو فريق المشروع" : "Project Team Member"}
              </div>
            </Card>
          ))}
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
            المُستهدَفة. تأخذ هذه العملية أسابيع، وقد تتأثر بالعامل البشري. الطلاب المنتقلون من جامعات أو كليات أو دبلومات
            إلى تخصص الذكاء الاصطناعي في AUT يحتاجون أداة سريعة تعطيهم تصوراً أولياً لفرص معادلة موادهم.
          </p>
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-gold" />
            الحل المقترح
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            نظام ويب يستخدم نماذج اللغة الكبيرة (LLM) لمقارنة وصف المادة المُحوَّلة دلالياً مع كامل خطة بكالوريوس الذكاء
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
              <p className="text-primary-foreground/85 text-sm">الصق وصف مادة من ميثاق جامعتك السابقة واحصل على معادلة فورية.</p>
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
