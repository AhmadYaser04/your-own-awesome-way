import { Link } from "react-router-dom";
import {
  Brain, Target, Sparkles, Database, ShieldCheck, ArrowLeft,
  Users, Award, GraduationCap, Lightbulb, Zap, BookOpen, Cpu, FileSearch, CheckCircle2,
} from "lucide-react";
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
  const isAr = dir === "rtl";

  return (
    <SiteLayout>
      {/* ============ HERO ============ */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground py-16 overflow-hidden">
        <div className="absolute -top-24 -start-24 w-72 h-72 bg-gold/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -end-32 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 max-w-5xl text-center relative z-10">
          <Badge className="bg-gold text-gold-foreground border-0 mb-4 px-4 py-1.5">{t("about.badge")}</Badge>
          <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4 leading-tight">
            {t("about.title")}
          </h1>
          <p className="text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed text-base md:text-lg">
            {t("about.subtitle")}
          </p>
        </div>
      </section>

      {/* ============ TIMELINE: كيف يعمل النظام ============ */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10 space-y-2">
          <span className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/30 text-secondary text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full">
            <Lightbulb className="h-3.5 w-3.5" />
            {isAr ? "آلية العمل" : "How it works"}
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {isAr ? "رحلة المعادلة في أربع خطوات" : "Equivalency journey in 4 steps"}
          </h2>
        </div>

        <div className="relative">
          {/* الخط العمودي */}
          <div className="absolute top-0 bottom-0 start-6 md:start-1/2 w-0.5 bg-gradient-to-b from-primary via-secondary to-gold" />

          {[
            {
              icon: FileSearch,
              color: "bg-primary",
              title: isAr ? "1. رفع كشف العلامات" : "1. Upload transcript",
              desc: isAr ? "يرفع الطالب كشف علامات جامعته السابقة، ويستخرج النظام أسماء المواد وساعاتها تلقائياً." : "Student uploads their transcript and the system extracts courses automatically.",
            },
            {
              icon: Cpu,
              color: "bg-secondary",
              title: isAr ? "2. تحليل دلالي" : "2. Semantic analysis",
              desc: isAr ? "يقارن نموذج الذكاء الاصطناعي مواد الطالب دلالياً مع خطة بكالوريوس AI في AUT." : "AI model semantically compares student courses with the AUT AI plan.",
            },
            {
              icon: Brain,
              color: "bg-gold text-gold-foreground",
              title: isAr ? "3. اقتراح المعادلات" : "3. Equivalency suggestions",
              desc: isAr ? "يقترح النظام المواد المعادِلة الأقرب مع نسبة تطابق وإمكانية دمج N→1." : "The system suggests the closest matches with similarity and N→1 merge support.",
            },
            {
              icon: ShieldCheck,
              color: "bg-success",
              title: isAr ? "4. اعتماد المرشد" : "4. Advisor approval",
              desc: isAr ? "يراجع المرشد الأكاديمي القرارات يدوياً ويعتمد المعادلات النهائية للطالب." : "Academic advisor reviews and finalises decisions for the student.",
            },
          ].map((step, i) => {
            const Icon = step.icon;
            const isEven = i % 2 === 0;
            return (
              <div key={i} className={`relative flex items-start gap-4 mb-6 md:mb-8 ${isEven ? "md:flex-row-reverse" : ""} md:justify-between`}>
                {/* النقطة على الخط */}
                <div className={`absolute start-6 md:start-1/2 -translate-x-1/2 ${dir === "rtl" ? "translate-x-1/2" : ""} ${step.color} rounded-full p-2 shadow-elegant z-10 mt-1`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                {/* الكارد */}
                <Card className="ms-16 md:ms-0 md:w-[44%] p-5 hover:shadow-elegant transition-all hover:-translate-y-1">
                  <h3 className="font-heading font-bold text-foreground mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </Card>
                <div className="hidden md:block md:w-[44%]" />
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ بطاقات بأشكال متنوعة ============ */}
      <section className="container mx-auto px-4 pb-12 max-w-6xl">
        <div className="grid md:grid-cols-12 gap-5">
          {/* مشكلة - بطاقة كبيرة عمودية */}
          <Card className="md:col-span-5 p-7 bg-gradient-to-br from-card to-destructive/5 border-2 border-destructive/20 relative overflow-hidden">
            <div className="absolute top-0 end-0 w-32 h-32 bg-destructive/10 rounded-bl-full" />
            <div className="relative">
              <div className="bg-destructive/15 text-destructive w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                <Target className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                {isAr ? "المشكلة" : "The Problem"}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isAr
                  ? "معادلة المواد بين الجامعات عملية يدوية بطيئة، تحتاج خبيراً أكاديمياً لمراجعة كل مادة وفحص توافقها مع الخطة المُستهدَفة. تأخذ هذه العملية أسابيع، وقد تتأثر بالعامل البشري."
                  : "Course equivalency is a slow manual process needing an academic expert to review each course. It takes weeks and is prone to human error."}
              </p>
            </div>
          </Card>

          {/* حل - بطاقة كبيرة بخلفية مدرجة */}
          <Card className="md:col-span-7 p-7 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground border-0 relative overflow-hidden">
            <div className="absolute -bottom-12 -end-12 w-44 h-44 bg-gold/30 rounded-full blur-2xl" />
            <div className="relative">
              <div className="bg-primary-foreground/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-gold" />
              </div>
              <h2 className="font-heading text-xl font-bold mb-3">
                {isAr ? "الحل المقترح" : "Our Solution"}
              </h2>
              <p className="text-sm text-primary-foreground/90 leading-relaxed mb-4">
                {isAr
                  ? "نظام ويب يستخدم نماذج اللغة الكبيرة (LLM) لمقارنة وصف المادة دلالياً مع كامل خطة بكالوريوس الذكاء الاصطناعي في AUT، ويرجع: نسبة تطابق دقيقة، أفضل المواد المعادِلة، وتبريراً واضحاً."
                  : "A web system using LLMs to semantically compare course descriptions with the full AUT AI plan, returning precise similarity, best matches, and clear justification."}
              </p>
              <Button asChild variant="secondary" size="sm">
                <Link to="/equivalency" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isAr ? "جرّب النظام الآن" : "Try it now"}
                </Link>
              </Button>
            </div>
          </Card>

          {/* منهجية - دائرية أيقونية */}
          <Card className="md:col-span-4 p-6 hover:shadow-elegant transition-all">
            <div className="bg-secondary/15 text-secondary w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              {isAr ? "منهجية المعادلة" : "Methodology"}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              {(isAr
                ? ["تحليل دلالي (Semantic Similarity)", "تقاطع المخرجات التعليمية", "مقارنة المواضيع وعمق التغطية", "اعتبار الساعات المعتمدة", "تبرير قابل للقراءة بالعربية"]
                : ["Semantic similarity", "Learning outcomes overlap", "Topic depth comparison", "Credit hours weighting", "Arabic-readable rationale"]
              ).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* أمن - شريط أفقي بشكل مختلف */}
          <Card className="md:col-span-4 p-6 bg-gradient-to-b from-success/5 to-card border-success/20 hover:shadow-elegant transition-all">
            <div className="bg-success/15 text-success w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              {isAr ? "الأمن والخصوصية" : "Security & Privacy"}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              {(isAr
                ? ["مفتاح AI لا يصل للعميل أبداً", "تحقق صارم من المدخلات", "معالجة حدود الطلبات بسلاسة", "لا تخزين دائم لمحتوى المواد"]
                : ["AI key never reaches the client", "Strict input validation", "Smooth rate-limit handling", "No persistent course storage"]
              ).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* مرجع - بطاقة بشكل مختلف */}
          <Card className="md:col-span-4 p-6 bg-gradient-to-br from-gold/10 to-card border-gold/30 hover:shadow-elegant transition-all">
            <div className="bg-gold/20 text-gold-foreground w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-3">
              {isAr ? "المرجع الأكاديمي" : "Academic Reference"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {isAr
                ? "قاعدة المواد المرجعية مأخوذة من خطة بكالوريوس الذكاء الاصطناعي في كلية تكنولوجيا المعلومات بجامعة العقبة للتكنولوجيا (تأسس البرنامج عام 2019)."
                : "Reference course base is the BSc AI plan at AUT's College of IT (program founded 2019)."}
            </p>
            <Button asChild variant="link" size="sm" className="px-0">
              <a href="https://www.aut.edu.jo/college/7/ar" target="_blank" rel="noopener noreferrer" className="gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                {isAr ? "صفحة الكلية الرسمية ↗" : "Official college page ↗"}
              </a>
            </Button>
          </Card>
        </div>
      </section>

      {/* ============ فريق المشروع ============ */}
      <section className="bg-muted/30 py-14">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10 space-y-2">
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full">
              <Users className="h-3.5 w-3.5" />
              {isAr ? "فريق مشروع التخرج" : "Graduation Project Team"}
            </span>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              {isAr ? "القائمون على المشروع" : "Project Contributors"}
            </h2>
          </div>

          {/* المشرف — تصميم بانوراما */}
          <Card className="p-6 md:p-8 mb-6 bg-gradient-to-br from-primary via-primary to-primary/85 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
            <div className="absolute -top-12 -end-12 w-44 h-44 bg-gold/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -start-12 w-44 h-44 bg-secondary/30 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gold p-[3px] shadow-warm">
                  <img
                    src={teamDrYazan}
                    alt={isAr ? "د. يزن الوقفي" : "Dr. Yazan Al-Waqfi"}
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
              <div className="flex-1 space-y-1.5">
                <span className="inline-block text-[11px] font-bold bg-primary-foreground/20 backdrop-blur-md px-3 py-1 rounded-full">
                  {isAr ? "المشرف على المشروع" : "Project Supervisor"}
                </span>
                <h3 className="font-heading text-2xl md:text-3xl font-bold">
                  {isAr ? "د. يزن الوقفي" : "Dr. Yazan Al-Waqfi"}
                </h3>
                <p className="text-primary-foreground/85 text-sm">
                  {isAr
                    ? "قسم الذكاء الاصطناعي وعلم البيانات — جامعة العقبة للتكنولوجيا"
                    : "Department of AI & Data Science — Aqaba University of Technology"}
                </p>
              </div>
            </div>
          </Card>

          {/* الطلاب — أشكال متنوعة (دائري + مربع + مدرَّج) */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: isAr ? "م. أحمد ياسر" : "Eng. Ahmad Yasser", photo: teamAhmadYasser, shape: "circle", accent: "secondary" },
              { name: isAr ? "م. أحمد بهلول" : "Eng. Ahmad Bahloul", photo: teamAhmadBahloul, shape: "rounded", accent: "primary" },
              { name: isAr ? "م. زيد زبدة" : "Eng. Zaid Zubdeh", photo: teamZaidZubdeh, shape: "hex", accent: "gold" },
              { name: isAr ? "م. عبدالرحمن عطيوة" : "Eng. Abdulrahman Atiweh", photo: teamAbdulrahmanAtiweh, shape: "circle", accent: "success" },
            ].map((s, i) => {
              const accentRing =
                s.accent === "primary" ? "from-primary to-primary/70"
                : s.accent === "secondary" ? "from-secondary to-secondary/70"
                : s.accent === "gold" ? "from-gold to-gold/70"
                : "from-success to-success/70";
              const photoShape =
                s.shape === "circle" ? "rounded-full"
                : s.shape === "rounded" ? "rounded-2xl"
                : "rounded-[30%]"; // pseudo-hex feel
              return (
                <Card
                  key={s.name}
                  className="p-5 text-center bg-gradient-to-b from-card to-accent/30 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <div className={`absolute inset-0 ${photoShape} bg-gradient-to-br ${accentRing} p-[3px] shadow-elegant`}>
                      <img
                        src={s.photo}
                        alt={s.name}
                        className={`w-full h-full ${photoShape} object-cover bg-card`}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                      />
                    </div>
                  </div>
                  <div className="font-heading font-bold text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <GraduationCap className="h-3 w-3 inline-block me-1" />
                    {isAr ? "عضو فريق المشروع" : "Project Team Member"}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA نهائي ============ */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="p-8 md:p-10 bg-gradient-to-br from-secondary via-primary to-primary text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-16 -end-16 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-start">
            <div className="bg-primary-foreground/20 backdrop-blur-md w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-xl md:text-2xl mb-1">
                {isAr ? "جاهز لتجربة النظام؟" : "Ready to try it?"}
              </h3>
              <p className="text-primary-foreground/85 text-sm">
                {isAr
                  ? "ارفع كشف علاماتك أو الصق وصف مادة من ميثاق جامعتك السابقة، واحصل على معادلة فورية."
                  : "Upload your transcript or paste a course description from your previous university and get an instant equivalency."}
              </p>
            </div>
            <Button asChild variant="secondary" size="lg" className="gap-2 shrink-0">
              <Link to="/equivalency">
                {isAr ? "ابدأ الآن" : "Start now"}
                <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "" : "rotate-180"}`} />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
