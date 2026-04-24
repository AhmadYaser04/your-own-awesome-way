import { Link } from "react-router-dom";
import { Brain, Sparkles, Target, Zap, BookOpen, Search, ArrowLeft, ArrowRight, GraduationCap, ScrollText, FileSearch, CheckCircle2, ShieldCheck, LogIn, Lightbulb, Rocket, Heart } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLang } from "@/i18n/LanguageProvider";
import heroBg from "@/assets/aut-campus-bright.png";

export default function Home() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const stats = [
    { icon: GraduationCap, value: "1", label: t("home.stat.spec"), color: "text-primary", bg: "bg-primary/10" },
    { icon: BookOpen, value: "+15", label: t("home.stat.courses"), color: "text-secondary", bg: "bg-secondary/10" },
    { icon: Target, value: "AI", label: t("home.stat.engine"), color: "text-success", bg: "bg-success/10" },
    { icon: Zap, value: "<10", label: t("home.stat.speed"), color: "text-gold", bg: "bg-gold/15" },
  ];

  const steps = [
    { icon: ScrollText, title: t("home.step1.t"), desc: t("home.step1.d") },
    { icon: FileSearch, title: t("home.step2.t"), desc: t("home.step2.d") },
    { icon: CheckCircle2, title: t("home.step3.t"), desc: t("home.step3.d") },
  ];

  return (
    <SiteLayout>
      {/* Hero with AUT campus — image takes center stage */}
      <section className="relative bg-gradient-to-b from-accent/40 via-background to-background pt-8 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8 space-y-3">
            <span className="inline-flex items-center gap-2 bg-gold/20 border border-gold/40 text-gold-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full animate-fade-up">
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.badge")}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-foreground animate-fade-up leading-tight">
              {t("home.title")}
            </h1>
            <p className="text-muted-foreground text-base md:text-xl max-w-3xl mx-auto font-heading animate-fade-up">
              {t("home.tagline")}
            </p>
          </div>

          {/* Big bright campus showcase */}
          <div className="relative rounded-3xl overflow-hidden shadow-elegant border-4 border-card animate-fade-up">
            <img
              src={heroBg}
              alt={t("header.title")}
              className="w-full h-[280px] md:h-[460px] object-cover"
              width={1920}
              height={1080}
            />
            {/* Light gradient only at bottom for text legibility */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/85 via-primary/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
              <p className="text-white text-sm md:text-lg font-heading mb-4 max-w-2xl drop-shadow-lg">
                {t("home.subtagline")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold gap-2 shadow-warm">
                  <Link to="/equivalency">
                    <Search className="h-5 w-5" />
                    {t("home.cta.start")}
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-white/95 text-primary hover:bg-white font-bold gap-2 backdrop-blur-md">
                  <Link to="/college">
                    <Brain className="h-5 w-5" />
                    {t("home.cta.explore")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="text-center mb-10 space-y-2">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t("home.how")}</h2>
          <p className="text-muted-foreground font-heading">{t("home.howSub")}</p>
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

      {/* CTA: AI specialization */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <Card className="p-8 md:p-10 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-gold/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-5 rounded-2xl shrink-0">
              <Brain className="h-14 w-14" />
            </div>
            <div className="flex-1 space-y-3">
              <span className="inline-block text-xs font-bold bg-gold text-gold-foreground px-3 py-1 rounded-full">
                {t("home.collegeBadge")}
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{t("home.collegeTitle")}</h2>
              <p className="text-primary-foreground/85 leading-relaxed">{t("home.collegeDesc")}</p>
              <Button asChild variant="secondary" className="gap-2 mt-2">
                <Link to="/college">
                  {t("home.collegeBtn")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Admin / Committee portal entry */}
      <section className="container mx-auto px-4 pb-2 max-w-4xl">
        <Card className="p-7 md:p-9 bg-gradient-to-br from-secondary/95 via-secondary to-primary/90 text-primary-foreground border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-primary-foreground/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
            <div className="bg-gold text-gold-foreground p-5 rounded-2xl shrink-0 shadow-elegant">
              <ShieldCheck className="h-14 w-14" />
            </div>
            <div className="flex-1 space-y-3">
              <span className="inline-block text-xs font-bold bg-primary-foreground/20 backdrop-blur-md text-primary-foreground px-3 py-1 rounded-full">
                {t("home.admin.badge")}
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-bold">{t("home.admin.title")}</h2>
              <p className="text-primary-foreground/90 leading-relaxed text-sm md:text-base">
                {t("home.admin.desc")}
              </p>
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold gap-2 mt-2">
                <Link to="/admin">
                  <LogIn className="h-5 w-5" />
                  {t("home.admin.cta")}
                  <Arrow className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-center font-heading text-2xl font-bold text-foreground mb-8">{t("home.statsTitle")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {stats.map((s, i) => (
            <Card
              key={s.label}
              className="p-5 text-center hover:shadow-elegant transition-all hover:-translate-y-1 animate-fade-up border-2"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${s.bg} rounded-2xl w-14 h-14 mx-auto flex items-center justify-center mb-3`}>
                <s.icon className={`h-7 w-7 ${s.color}`} />
              </div>
              <div className="font-heading font-bold text-2xl text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground font-heading mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Vibrant student-friendly perks strip */}
      <section className="container mx-auto px-4 pb-14 max-w-5xl">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-2xl p-5 text-white shadow-elegant" style={{ background: "var(--gradient-student)" }}>
            <Lightbulb className="h-7 w-7 mb-2" />
            <div className="font-heading font-bold">{dir === "rtl" ? "نتيجة فورية" : "Instant result"}</div>
            <div className="text-xs opacity-90 mt-1">{dir === "rtl" ? "أقل من 10 ثوانٍ لكل معادلة." : "Less than 10s per request."}</div>
          </div>
          <div className="rounded-2xl p-5 text-white shadow-elegant" style={{ background: "var(--gradient-vibrant)" }}>
            <Rocket className="h-7 w-7 mb-2" />
            <div className="font-heading font-bold">{dir === "rtl" ? "ادعم بـ 3 صيغ" : "3 input modes"}</div>
            <div className="text-xs opacity-90 mt-1">{dir === "rtl" ? "نص، PDF، أو صورة من الهاتف." : "Text, PDF, or phone photo."}</div>
          </div>
          <div className="rounded-2xl p-5 text-white shadow-elegant" style={{ background: "var(--gradient-success)" }}>
            <Heart className="h-7 w-7 mb-2" />
            <div className="font-heading font-bold">{dir === "rtl" ? "موثوق ورسمي" : "Official & trusted"}</div>
            <div className="text-xs opacity-90 mt-1">{dir === "rtl" ? "ختم لجنة المعادلات وتقرير PDF." : "Committee seal & PDF report."}</div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
