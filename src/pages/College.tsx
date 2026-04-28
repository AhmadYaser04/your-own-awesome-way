import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brain, Award, Users, Target, BookOpen, Sparkles, Loader2,
  GraduationCap, Layers, BookMarked, Wrench, RefreshCw, Briefcase,
  ChevronDown, ChevronUp,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageProvider";

type Category =
  | "university_required"
  | "university_elective"
  | "department_required"
  | "department_elective"
  | "supporting"
  | "remedial"
  | "training";

interface AutCourse {
  id: string;
  course_code: string;
  course_name_ar: string;
  course_name_en: string | null;
  credits: number;
  category: Category;
  description_ar: string | null;
  description_en: string | null;
  prerequisites: string[] | null;
}

const CATEGORY_META: Record<Category, { ar: string; en: string; icon: typeof Brain; color: string; bg: string; ring: string }> = {
  university_required:  { ar: "متطلبات الجامعة الإجبارية", en: "University Required",   icon: GraduationCap, color: "text-primary",          bg: "bg-primary/10",     ring: "ring-primary/30" },
  university_elective:  { ar: "متطلبات الجامعة الاختيارية", en: "University Electives",  icon: Layers,        color: "text-secondary",        bg: "bg-secondary/10",   ring: "ring-secondary/30" },
  department_required:  { ar: "متطلبات التخصص الإجبارية",  en: "Department Required",   icon: Brain,         color: "text-primary",          bg: "bg-primary/10",     ring: "ring-primary/40" },
  department_elective:  { ar: "متطلبات التخصص الاختيارية", en: "Department Electives",  icon: BookMarked,    color: "text-gold",             bg: "bg-gold/15",        ring: "ring-gold/40" },
  supporting:           { ar: "المواد المساندة",            en: "Supporting",            icon: Wrench,        color: "text-success",          bg: "bg-success/10",     ring: "ring-success/30" },
  remedial:             { ar: "المواد الاستدراكية",         en: "Remedial",              icon: RefreshCw,     color: "text-muted-foreground", bg: "bg-muted",          ring: "ring-muted-foreground/20" },
  training:             { ar: "التدريب العملي / المشروع",   en: "Training / Project",    icon: Briefcase,     color: "text-secondary",        bg: "bg-secondary/15",   ring: "ring-secondary/40" },
};

const CATEGORY_ORDER: Category[] = [
  "department_required",
  "department_elective",
  "university_required",
  "university_elective",
  "supporting",
  "training",
  "remedial",
];

export default function College() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<AutCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Category>("department_required");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("aut_courses")
        .select("id, course_code, course_name_ar, course_name_en, credits, category, description_ar, description_en, prerequisites")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("course_code", { ascending: true });
      if (!error && data) setCourses(data as AutCourse[]);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<Category, AutCourse[]>();
    for (const c of courses) {
      const arr = m.get(c.category) ?? [];
      arr.push(c);
      m.set(c.category, arr);
    }
    return m;
  }, [courses]);

  const totalCredits = useMemo(() => courses.reduce((s, c) => s + (c.credits || 0), 0), [courses]);

  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

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
              <h1 className="font-heading text-3xl md:text-4xl font-bold">{t("college.title")}</h1>
              <p className="text-primary-foreground/85 max-w-3xl leading-relaxed">{t("college.intro")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container mx-auto px-4 py-10 max-w-5xl grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Award, label: t("college.founded"), value: "2019" },
          { icon: BookOpen, label: t("college.totalCourses"), value: loading ? "…" : courses.length },
          { icon: Sparkles, label: t("college.totalCredits"), value: loading ? "…" : totalCredits },
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
          <p className="text-sm text-muted-foreground leading-relaxed">{t("college.visionTxt")}</p>
        </Card>
        <Card className="p-6 border-r-4 border-r-gold">
          <h3 className="font-heading text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
            <Award className="h-5 w-5 text-gold" />
            {t("college.mission")}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{t("college.missionTxt")}</p>
        </Card>
      </section>

      {/* Curriculum */}
      <section className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8 space-y-2">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{t("college.plan")}</h2>
          <p className="text-muted-foreground text-sm">{t("college.planSub")}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            {lang === "ar" ? "جارٍ تحميل الخطة..." : "Loading curriculum..."}
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            {lang === "ar" ? "لا توجد مواد محمّلة بعد." : "No courses available yet."}
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Category)}>
            <TabsList className="flex flex-wrap h-auto justify-center gap-1 bg-accent/40 p-1.5 mb-6">
              {CATEGORY_ORDER.filter((cat) => (grouped.get(cat)?.length ?? 0) > 0).map((cat) => {
                const meta = CATEGORY_META[cat];
                const list = grouped.get(cat) ?? [];
                const credits = list.reduce((s, c) => s + c.credits, 0);
                const Icon = meta.icon;
                return (
                  <TabsTrigger key={cat} value={cat} className="gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs md:text-sm">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    <span>{lang === "ar" ? meta.ar : meta.en}</span>
                    <Badge variant="outline" className="ml-1 text-[10px]">{list.length} · {credits}{lang === "ar" ? "س" : "h"}</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {CATEGORY_ORDER.map((cat) => {
              const list = grouped.get(cat) ?? [];
              if (!list.length) return null;
              return (
                <TabsContent key={cat} value={cat} className="mt-0">
                  <div className="grid md:grid-cols-2 gap-4">
                    {list.map((c) => {
                      const isOpen = expanded.has(c.id);
                      const desc = lang === "ar" ? (c.description_ar || c.description_en) : (c.description_en || c.description_ar);
                      const name = lang === "ar" ? c.course_name_ar : (c.course_name_en || c.course_name_ar);
                      return (
                        <Card key={c.id} className="p-5 hover:shadow-elegant transition-all hover:border-primary/40">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-heading font-bold text-foreground">{name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] font-mono">{c.course_code}</Badge>
                                <span>{c.credits} {t("college.creditsLabel")}</span>
                                {c.prerequisites && c.prerequisites.length > 0 && (
                                  <span className="text-[10px]">
                                    · {lang === "ar" ? "متطلب سابق" : "Prereq"}: {c.prerequisites.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {desc && (
                            <>
                              <p className={`text-sm text-muted-foreground leading-relaxed ${isOpen ? "" : "line-clamp-3"}`}>{desc}</p>
                              {desc.length > 140 && (
                                <button
                                  onClick={() => toggle(c.id)}
                                  className="mt-2 text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                                >
                                  {isOpen
                                    ? (<>{lang === "ar" ? "إخفاء" : "Hide"} <ChevronUp className="h-3 w-3" /></>)
                                    : (<>{lang === "ar" ? "المزيد" : "More"} <ChevronDown className="h-3 w-3" /></>)}
                                </button>
                              )}
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

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
