import { Link } from "react-router-dom";
import { Brain, Award, Users, Target, BookOpen, Code2, Database, Sparkles } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AI_COURSES } from "@/data/aiCourses";
import { useLang } from "@/i18n/LanguageProvider";

const totalCredits = AI_COURSES.reduce((s, c) => s + c.credits, 0);

export default function College() {
  const { t } = useLang();
  const groups = [
    { key: "تخصص" as const, label: t("college.group.major"), icon: Brain },
    { key: "متطلب كلية" as const, label: t("college.group.faculty"), icon: Code2 },
    { key: "رياضيات" as const, label: t("college.group.math"), icon: Database },
  ];
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(hsl(var(--secondary)) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-4">
            {t("college.back")}
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-5 rounded-3xl">
              <Brain className="h-14 w-14" />
            </div>
            <div className="flex-1 space-y-3">
              <Badge className="bg-gold text-gold-foreground hover:bg-gold/90 border-0">{t("college.facBadge")}</Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-bold">
                {t("college.title")}
              </h1>
              <p className="text-primary-foreground/85 max-w-3xl leading-relaxed">
                {t("college.intro")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-10 max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Award, label: t("college.founded"), value: "2019" },
          { icon: BookOpen, label: t("college.totalCourses"), value: AI_COURSES.length },
          { icon: Sparkles, label: t("college.totalCredits"), value: totalCredits },
          { icon: Users, label: t("college.faculty"), value: "PhD" },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center bg-gradient-to-b from-card to-accent/40">
            <s.icon className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </section>

      {/* Vision / Mission */}
      <section className="container mx-auto px-4 max-w-5xl grid md:grid-cols-2 gap-5 mb-12">
        <Card className="p-6 border-r-4 border-r-secondary">
          <h3 className="font-heading text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-secondary" />
            {t("college.vision")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("college.visionTxt")}
          </p>
        </Card>
        <Card className="p-6 border-r-4 border-r-gold">
          <h3 className="font-heading text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5 text-gold" />
            {t("college.mission")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("college.missionTxt")}
          </p>
        </Card>
      </section>

      {/* Curriculum */}
      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8 space-y-2">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t("college.plan")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("college.planSub")}
          </p>
        </div>

        <div className="space-y-8">
          {groups.map((g) => {
            const list = AI_COURSES.filter((c) => c.category === g.key);
            return (
              <div key={g.key}>
                <div className="flex items-center gap-2 mb-4">
                  <g.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-heading text-lg font-bold text-foreground">{g.label}</h3>
                  <Badge variant="secondary">{list.length} {t("college.courseCount")}</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {list.map((c) => (
                    <Card key={c.code} className="p-5 hover:shadow-elegant transition-all hover:border-primary/40">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <div className="font-heading font-bold text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.code} · {c.credits} {t("college.creditsLabel")}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="gap-2 shadow-elegant">
            <Link to="/equivalency">
              <Sparkles className="h-5 w-5" />
              {t("college.startCta")}
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
