import { Link } from "react-router-dom";
import { Brain, Sparkles, Target, Zap, BookOpen, Search, ArrowLeft, GraduationCap, ScrollText, FileSearch, CheckCircle2 } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: GraduationCap, value: "1", label: "تخصص (الذكاء الاصطناعي)", color: "text-primary" },
  { icon: BookOpen, value: "+15", label: "مادة في الخطة الدراسية", color: "text-secondary" },
  { icon: Target, value: "AI", label: "محرك معادلة دلالي", color: "text-success" },
  { icon: Zap, value: "<10", label: "ثانية لكل معادلة", color: "text-gold" },
];

const steps = [
  {
    icon: ScrollText,
    title: "1 · أدخل وصف المادة السعودية",
    desc: "الصق وصف المادة من ميثاق جامعتك السعودية كاملاً (المخرجات التعليمية، المواضيع، الساعات).",
  },
  {
    icon: FileSearch,
    title: "2 · يقارنها الذكاء الاصطناعي",
    desc: "نموذج Gemini يحلل النص ويقارنه دلالياً مع كل مواد خطة الذكاء الاصطناعي في AUT.",
  },
  {
    icon: CheckCircle2,
    title: "3 · احصل على نتيجة فورية",
    desc: "نسبة تطابق دقيقة، أفضل المواد المُعادِلة في AUT، مع تبرير واضح وحكم نهائي.",
  },
];

export default function Home() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt="حرم جامعة العقبة للتكنولوجيا"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={900}
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)", opacity: 0.92 }} />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-md border border-primary-foreground/30 text-primary-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full mb-5 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            مشروع تخرج · تخصص الذكاء الاصطناعي · جامعة العقبة للتكنولوجيا
          </span>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-4 animate-fade-up leading-tight">
            نظام معادلة المواد الذكي
          </h1>
          <p className="text-primary-foreground/90 text-base md:text-xl max-w-3xl mx-auto font-heading mb-3 animate-fade-up">
            قارن وصف المواد الدراسية باستخدام الذكاء الاصطناعي واحصل على نتيجة فورية
          </p>
          <p className="text-primary-foreground/75 text-sm md:text-base max-w-2xl mx-auto mb-8 animate-fade-up">
            من ميثاق جامعتك السعودية إلى ميثاق جامعة العقبة للتكنولوجيا — لتخصص الذكاء الاصطناعي حصراً
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold gap-2 shadow-elegant">
              <Link to="/equivalency">
                <Search className="h-5 w-5" />
                ابدأ المعادلة الآن
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-md gap-2">
              <Link to="/college">
                <Brain className="h-5 w-5" />
                استكشف خطة التخصص
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Steps - كيف يعمل */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="text-center mb-10 space-y-2">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">كيف يعمل النظام؟</h2>
          <p className="text-muted-foreground font-heading">ثلاث خطوات بسيطة للحصول على معادلتك</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <Card
              key={s.title}
              className="p-6 text-center bg-gradient-to-b from-card to-accent/30 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="bg-primary text-primary-foreground rounded-2xl w-14 h-14 mx-auto flex items-center justify-center mb-4 shadow-elegant">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA: التخصص الوحيد */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <Card className="p-8 md:p-10 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gold/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-5 rounded-2xl shrink-0">
              <Brain className="h-14 w-14" />
            </div>
            <div className="flex-1 space-y-3">
              <span className="inline-block text-xs font-bold bg-gold text-gold-foreground px-3 py-1 rounded-full">
                التخصص المُعتمد للمعادلة
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">كلية الذكاء الاصطناعي</h2>
              <p className="text-primary-foreground/85 leading-relaxed">
                هذا النظام مخصص حصراً لمعادلة مواد طلاب علم الحاسوب/الذكاء الاصطناعي في الجامعات السعودية إلى خطة
                البكالوريوس في الذكاء الاصطناعي بكلية تكنولوجيا المعلومات في جامعة العقبة للتكنولوجيا (تأسس البرنامج
                عام 2019).
              </p>
              <Button asChild variant="secondary" className="gap-2 mt-2">
                <Link to="/college">
                  تصفح الخطة الدراسية الكاملة
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-center font-heading text-2xl font-bold text-foreground mb-8">إحصائيات النظام</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              className="p-5 text-center hover:shadow-elegant transition-all animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
              <div className="font-heading font-bold text-2xl text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground font-heading mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
