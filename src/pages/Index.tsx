import { Brain, Code, HeartPulse, GraduationCap, BookOpen, Target, Zap, Moon, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/logo.png";

const specialties = [
  {
    icon: Brain,
    title: "الذكاء الاصطناعي",
    en: "Artificial Intelligence",
    variant: "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
  },
  {
    icon: Code,
    title: "هندسة البرمجيات",
    en: "Software Engineering",
    variant: "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90",
  },
  {
    icon: HeartPulse,
    title: "العلاج الطبيعي",
    en: "Physical Therapy",
    variant: "bg-accent text-accent-foreground border-accent hover:bg-accent/90",
  },
];

const stats = [
  { icon: GraduationCap, value: "+3", label: "تخصصات", color: "text-primary" },
  { icon: BookOpen, value: "+150", label: "مادة دراسية", color: "text-secondary" },
  { icon: Target, value: "95%", label: "دقة المعادلة", color: "text-success" },
  { icon: Zap, value: "<10", label: "ثانية للتحليل", color: "text-accent" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-primary py-4 px-4 md:px-6 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="https://www.aut.edu.jo/home/ar"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 hover:scale-105 transition-transform"
              title="جامعة العقبة للتكنولوجيا"
            >
              <img
                src={logo}
                alt="شعار جامعة العقبة للتكنولوجيا"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-card object-contain"
              />
            </a>
            <a href="/" className="text-primary-foreground min-w-0">
              <h1 className="font-heading text-base md:text-lg font-bold leading-tight truncate">
                جامعة العقبة للتكنولوجيا
              </h1>
              <p className="text-xs opacity-80 truncate">نظام معادلة المواد الذكي</p>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <a className="px-3 py-2 rounded-md text-sm font-heading font-medium bg-primary-foreground/15 text-primary-foreground" href="/">
              الرئيسية
            </a>
            <a className="px-3 py-2 rounded-md text-sm font-heading font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors" href="#">
              الكليات
            </a>
            <a className="px-3 py-2 rounded-md text-sm font-heading font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors" href="#">
              حول المشروع
            </a>
            <a className="px-3 py-2 rounded-md text-sm font-heading font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors" href="#">
              الأسئلة الشائعة
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="toggle theme"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5"
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-bold">English</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={heroBg}
          alt="حرم جامعة العقبة للتكنولوجيا"
          className="absolute inset-0 w-full h-full object-cover"
          width={1536}
          height={768}
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <span className="inline-block bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/30 text-primary-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full mb-4 animate-fade-up">
            🎓 مشروع تخرج | جامعة العقبة للتكنولوجيا
          </span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-3 animate-fade-up">
            نظام معادلة المواد الذكي
          </h2>
          <p className="text-primary-foreground/85 text-base md:text-lg max-w-2xl font-heading animate-fade-up">
            قارن وصف المواد الدراسية باستخدام الذكاء الاصطناعي واحصل على نتيجة فورية
          </p>
        </div>
      </section>

      <main className="flex-1">
        {/* Specialties */}
        <section className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-10 space-y-3 animate-fade-up">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              اختر التخصص للمعادلة
            </h2>
            <p className="text-muted-foreground font-heading text-sm md:text-base">
              اضغط على التخصص الذي تريد معادلة موادك إليه في جامعة العقبة للتكنولوجيا
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {specialties.map((s) => (
              <button
                key={s.title}
                className={`${s.variant} rounded-xl p-8 shadow-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center gap-4 cursor-pointer animate-fade-up`}
              >
                <div className="bg-white/20 rounded-full p-4">
                  <s.icon className="h-10 w-10" />
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-heading text-xl font-bold">{s.title}</h3>
                  <p className="text-sm opacity-80">{s.en}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-center font-heading text-2xl font-bold text-foreground mb-8">
            إحصائيات النظام
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow animate-fade-up"
              >
                <s.icon className={`h-8 w-8 mx-auto mb-2 ${s.color}`} />
                <div className="font-heading font-bold text-2xl text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground font-heading mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-primary-foreground/80 text-sm font-heading space-y-1">
          <p>© 2026 جامعة العقبة للتكنولوجيا - جميع الحقوق محفوظة</p>
          <p className="text-xs opacity-70">نظام معادلة المواد الذكي - مشروع جامعي</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
