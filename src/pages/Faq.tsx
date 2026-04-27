import { Link } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Brain, Sparkles, Code2, Database, ShieldCheck, Zap, ArrowLeft, Cpu, Layers, Target, BookOpen } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

// Top 5 essential questions for the project defense
const FAQ = [
  {
    icon: Target,
    q: "ما فكرة المشروع باختصار؟",
    a: "نظام ويب يستخدم الذكاء الاصطناعي (نماذج اللغة الكبيرة) لمعادلة وصف المواد الدراسية بين الجامعات السعودية وخطة بكالوريوس الذكاء الاصطناعي في جامعة العقبة للتكنولوجيا. الطالب يلصق وصف المادة فيحصل على نسبة تطابق دلالية، أفضل المواد المُعادِلة، وحكم نهائي خلال ثوانٍ.",
  },
  {
    icon: Cpu,
    q: "كيف يعمل محرك المعادلة فعلياً؟",
    a: "1) الطالب يدخل وصف المادة (نص / PDF / صورة). 2) الواجهة ترسل النص إلى Edge Function آمنة. 3) الـ Function تبني Prompt يحوي وصف المادة + كامل خطة AI في AUT. 4) Gemini يقارن دلالياً ويُرجع نتيجة منظّمة عبر Tool Calling (JSON صارم). 5) النتيجة تُعرض: نسبة، أفضل المواد، تبرير، وحكم نهائي.",
  },
  {
    icon: Brain,
    q: "كيف تحسب نسبة التطابق؟ هل هي مجرد تشابه نصي؟",
    a: "لا، إنها تشابه دلالي (Semantic Similarity) وليس نصي حرفي. النموذج يفهم المعنى، فيعرف أن 'Backpropagation' و'الانتشار الخلفي' نفس المفهوم. كما يأخذ بعين الاعتبار: تقاطع المخرجات التعليمية، عمق التغطية، الساعات المعتمدة، والمواضيع المشتركة.",
  },
  {
    icon: ShieldCheck,
    q: "كيف ضمنت أمن النظام؟",
    a: "1) مفتاح Lovable AI لا يُسرَّب للعميل أبداً، كل الاستدعاءات تتم من Edge Function. 2) RLS مفعّل على كل الجداول. 3) صلاحيات الإدمن في جدول منفصل (user_roles) لمنع هجمات تصعيد الصلاحية. 4) Input Validation عبر Zod. 5) معالجة Rate Limit (429) و Payment (402) برسائل واضحة.",
  },
  {
    icon: Sparkles,
    q: "هل يمكن للنظام أن يحل محل لجنة المعادلة في الجامعة؟",
    a: "لا، الهدف ليس استبدال اللجنة بل مساعدتها. النظام يُقدم رأياً أولياً سريعاً (خلال ثوانٍ) يساعد الطالب على معرفة فرصه، ويُقدم للجنة تحليلاً جاهزاً يختصر وقت المراجعة. القرار النهائي يبقى بيد اللجنة الأكاديمية المختصة، ولوحة الإدمن مصمّمة لاعتماد/رفض/تعديل القرارات.",
  },
];

const TECH_STACK = [
  { icon: Code2, label: "React 18 + TypeScript", color: "text-primary" },
  { icon: Layers, label: "TailwindCSS + shadcn/ui", color: "text-secondary" },
  { icon: Database, label: "Lovable Cloud (Supabase)", color: "text-success" },
  { icon: Brain, label: "Google Gemini 2.5 Flash", color: "text-gold" },
];

const HIGHLIGHTS = [
  {
    icon: Zap,
    title: "سرعة فائقة",
    desc: "أقل من 10 ثوانٍ لكل عملية معادلة كاملة، مع تحليل دلالي عميق.",
    color: "from-primary to-primary/80",
    iconColor: "text-gold",
  },
  {
    icon: ShieldCheck,
    title: "أمان متعدد الطبقات",
    desc: "RLS + جدول صلاحيات منفصل + Edge Functions + معالجة آمنة لمفاتيح API.",
    color: "from-secondary to-secondary/80",
    iconColor: "text-primary-foreground",
  },
  {
    icon: BookOpen,
    title: "خطة كاملة موثّقة",
    desc: "أكثر من 15 مادة من خطة AI الرسمية في AUT (تأسس البرنامج 2019).",
    color: "from-gold to-gold/80",
    iconColor: "text-primary",
  },
];

export default function Faq() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowLeft;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl">
              <HelpCircle className="h-10 w-10" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{t("faq.title")}</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1">
                {t("faq.subtitle")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top 5 essential questions */}
      <section className="container mx-auto px-4 pt-10 max-w-4xl">
        <div className="text-center mb-6 space-y-2">
          <span className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold-foreground text-xs font-heading font-bold px-4 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            أهم 5 أسئلة للمناقشة
          </span>
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            الأكثر تكراراً في مناقشة المشروع
          </h2>
        </div>

        <Card className="p-4 md:p-6 border-2 shadow-elegant">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {FAQ.map((item, i) => {
              const Icon = item.icon;
              return (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-right hover:no-underline font-heading font-bold text-foreground">
                    <span className="flex items-start gap-3 text-base md:text-lg">
                      <span className="bg-primary/10 text-primary p-1.5 rounded-lg shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{item.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pr-12">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      </section>

      {/* Highlights — 3 colored cards */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="text-center mb-6 space-y-1">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            ما يميّز هذا النظام؟
          </h2>
          <p className="text-sm text-muted-foreground">
            ثلاث ركائز أساسية تجعل النظام جاهزاً للاستخدام الأكاديمي الفعلي.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((h, i) => {
            const Icon = h.icon;
            return (
              <Card
                key={h.title}
                className={`p-6 text-center bg-gradient-to-br ${h.color} text-primary-foreground border-0 shadow-elegant hover:-translate-y-1 transition-all animate-fade-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="bg-primary-foreground/15 backdrop-blur-md w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3">
                  <Icon className={`h-7 w-7 ${h.iconColor}`} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-1">{h.title}</h3>
                <p className="text-xs opacity-90 leading-relaxed">{h.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tech stack ribbon */}
      <section className="container mx-auto px-4 pb-10 max-w-5xl">
        <Card className="p-6 md:p-7 border-2 bg-gradient-to-br from-card to-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">المعمارية التقنية</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TECH_STACK.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2.5 hover:shadow-elegant transition"
                >
                  <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
                  <span className="text-xs font-heading font-bold text-foreground truncate">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Final CTA — try it now */}
      <section className="container mx-auto px-4 pb-14 max-w-4xl">
        <Card className="p-7 md:p-9 bg-gradient-to-br from-primary via-primary to-secondary/90 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-start">
            <div className="bg-gold text-gold-foreground p-4 rounded-2xl shrink-0 shadow-warm">
              <Sparkles className="h-12 w-12" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-heading text-xl md:text-2xl font-bold">
                لديك سؤال آخر؟ جرّب النظام مباشرة
              </h3>
              <p className="text-primary-foreground/85 text-sm md:text-base leading-relaxed">
                أفضل طريقة لفهم المشروع هي تجربته بنفسك — ألصق وصف مادة من ميثاقك السعودي واحصل على معادلة فورية.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold gap-2">
                <Link to="/equivalency">
                  <Zap className="h-4 w-4" />
                  جرّب الآن
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link to="/about">
                  <BookOpen className="h-4 w-4" />
                  حول المشروع
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
