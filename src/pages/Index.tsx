import { Link } from "react-router-dom";
import { Brain, Sparkles, Target, Zap, BookOpen, Search, ArrowLeft, ArrowRight, GraduationCap, ScrollText, FileSearch, CheckCircle2, ShieldCheck, LogIn } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLang } from "@/i18n/LanguageProvider";
import heroBg from "@/assets/aut-campus.png";

export default function Home() {
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const stats = [
    { icon: GraduationCap, value: "1", label: t("home.stat.spec"), color: "text-primary" },
    { icon: BookOpen, value: "+15", label: t("home.stat.courses"), color: "text-secondary" },
    { icon: Target, value: "AI", label: t("home.stat.engine"), color: "text-success" },
    { icon: Zap, value: "<10", label: t("home.stat.speed"), color: "text-gold" },
  ];

  const steps = [
    { icon: ScrollText, title: t("home.step1.t"), desc: t("home.step1.d") },
    { icon: FileSearch, title: t("home.step2.t"), desc: t("home.step2.d") },
    { icon: CheckCircle2, title: t("home.step3.t"), desc: t("home.step3.d") },
  ];

  return (
    <SiteLayout>
      {/* Hero with AUT campus */}
      <section className="relative overflow-hidden">
        <img
          src={heroBg}
          alt={t("header.title")}
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={900}
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)", opacity: 0.92 }} />
        <div className="relative z-10 container mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 bg-primary-foreground/15 backdrop-blur-md border border-primary-foreground/30 text-primary-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full mb-5 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.badge")}
          </span>
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-4 animate-fade-up leading-tight">
            {t("home.title")}
          </h1>
          <p className="text-primary-foreground/90 text-base md:text-xl max-w-3xl mx-auto font-heading mb-3 animate-fade-up">
            {t("home.tagline")}
          </p>
          <p className="text-primary-foreground/75 text-sm md:text-base max-w-2xl mx-auto mb-8 animate-fade-up">
            {t("home.subtagline")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold gap-2 shadow-elegant">
              <Link to="/equivalency">
                <Search className="h-5 w-5" />
                {t("home.cta.start")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/20 backdrop-blur-md gap-2">
              <Link to="/college">
                <Brain className="h-5 w-5" />
                {t("home.cta.explore")}
              </Link>
            </Button>
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
