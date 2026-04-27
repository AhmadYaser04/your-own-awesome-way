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
import {
  GraduationCap,
  Clock,
  ScrollText,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  HelpCircle,
  Users,
  CircleHelp,
  Search,
  Cpu,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import autFaqBg from "@/assets/aut-faq-bg.jpg";

// Visitor-focused FAQ — what someone landing on the site would actually wonder
const CATEGORIES = [
  {
    id: "general",
    icon: HelpCircle,
    titleAr: "نظرة عامة",
    titleEn: "Overview",
    color: "primary",
    questions: [
      {
        q: "ما هو هذا الموقع باختصار؟",
        a: "موقع يساعد الطلاب الراغبين بالتحويل إلى جامعة العقبة للتكنولوجيا — تخصص بكالوريوس الذكاء الاصطناعي — على معرفة أي من موادهم السابقة قابلة للمعادلة بمواد جامعة العقبة، خلال ثوانٍ وبدون انتظار لجان المعادلات.",
      },
      {
        q: "لمن هذا الموقع موجّه؟",
        a: "بشكل أساسي للطلاب القادمين من الجامعات السعودية الذين يدرسون علم الحاسوب أو الذكاء الاصطناعي ويرغبون بالتحويل إلى جامعة العقبة للتكنولوجيا. كذلك مفيد للمرشدين الأكاديميين ولأولياء الأمور لأخذ فكرة مبدئية قبل بدء إجراءات التحويل الرسمية.",
      },
      {
        q: "كيف أبدأ باستخدام الموقع؟",
        a: "اضغط على زر «ابدأ المعادلة» في الصفحة الرئيسية، ثم الصق وصف المادة من خطتك الدراسية أو ارفع ملف PDF أو صورة، وستظهر النتيجة فوراً. لا حاجة لإنشاء حساب لتجربة المعادلة.",
      },
    ],
  },
  {
    id: "transfer",
    icon: GraduationCap,
    titleAr: "التحويل والمعادلة",
    titleEn: "Transfer & Equivalency",
    color: "secondary",
    questions: [
      {
        q: "كيف يساعدني الموقع إذا كنت طالباً في جامعة سعودية؟",
        a: "كل ما عليك فعله هو لصق وصف المادة من خطتك الدراسية، أو رفع ملف PDF أو حتى صورة من الكاميرا للوصف، ثم النظام سيخبرك خلال ثوانٍ: هل هذه المادة تُعادَل بمادة في جامعة العقبة؟ ما هي المادة المقابلة؟ وكم نسبة التطابق بينهما؟",
      },
      {
        q: "هل قرار النظام رسمي ومُعتمَد من الجامعة؟",
        a: "لا، النظام يعطيك رأياً أولياً واسترشادياً فقط. القرار الرسمي والنهائي يبقى دائماً بيد لجنة المعادلات الأكاديمية في جامعة العقبة للتكنولوجيا. لكن إن كانت نتيجة النظام إيجابية، فهذا مؤشر جيد جداً قبل تقديم طلبك الرسمي.",
      },
      {
        q: "كم تستغرق عملية معادلة المادة؟",
        a: "أقل من 10 ثوانٍ لكل مادة. مقارنةً بالطريقة التقليدية التي قد تستغرق أسابيع من المراجعة اليدوية في لجان المعادلات، النظام يوفر عليك وقتاً كبيراً ويمنحك صورة فورية عن وضعك الأكاديمي.",
      },
    ],
  },
  {
    id: "account",
    icon: Users,
    titleAr: "الحساب والاستخدام",
    titleEn: "Account & Usage",
    color: "gold",
    questions: [
      {
        q: "هل أحتاج لإنشاء حساب لاستخدام الموقع؟",
        a: "لا، يمكنك تجربة معادلة المواد مباشرة دون تسجيل دخول. الحساب مفيد فقط إذا أردت حفظ سجل المعادلات السابقة والرجوع إليها لاحقاً، أو لمتابعة طلباتك الرسمية مع لجنة المعادلات.",
      },
      {
        q: "ماذا أفعل إذا كانت نتيجة المعادلة غير دقيقة أو غير متوقعة؟",
        a: "تأكد أولاً من أن وصف المادة كامل وواضح ويحتوي على: اسم المادة، عدد الساعات المعتمدة، المخرجات التعليمية، والمواضيع التي تغطيها. كلما كان الوصف أدق، كانت النتيجة أقرب للواقع. وإذا بقيت النتيجة غريبة، يمكنك التواصل مع لجنة المعادلات مباشرة.",
      },
    ],
  },
  {
    id: "technical",
    icon: Cpu,
    titleAr: "الجانب التقني",
    titleEn: "Technical Details",
    color: "secondary",
    questions: [
      {
        q: "ما هي التقنيات المستخدمة في بناء النظام؟",
        a: "الواجهة الأمامية مبنية باستخدام React 18 مع TypeScript و Tailwind CSS لضمان واجهة سريعة وتجربة مستخدم متجاوبة. الـ Backend يعتمد على Supabase الذي يوفر قاعدة بيانات PostgreSQL مع نظام مصادقة آمن وسياسات Row-Level Security (RLS) لحماية البيانات. أما محرّك المعادلة الذكي فيستخدم نموذج Google Gemini 2.5 Flash عبر Lovable AI Gateway لتحليل وصف المواد ومقارنتها دلالياً بمواد خطة جامعة العقبة، مما يتيح كشف التطابق حتى لو اختلفت أسماء المواد بين الجامعتين.",
      },
      {
        q: "كيف يحسب النظام نسبة التطابق بين المادتين؟",
        a: "العملية تمر بثلاث مراحل: (1) استخراج المعلومات الجوهرية من وصف المادة المُدخَلة كاسم المادة والمخرجات التعليمية والمواضيع وعدد الساعات، (2) مقارنة دلالية (Semantic Comparison) بين المادة المُدخلة وكل مواد خطة جامعة العقبة باستخدام نموذج Gemini الذي يفهم المعنى وليس فقط الكلمات المتطابقة، (3) إعطاء نسبة تطابق من 0 إلى 100% بناءً على معايير: تطابق المحتوى التعليمي، تطابق عدد الساعات، تطابق مستوى المادة (تأسيسية / متقدمة)، وتطابق التطبيقات العملية. تُعتمَد المادة كمعادَلة عند تجاوز نسبة 75% غالباً.",
      },
    ],
  },
];

const totalQuestions = CATEGORIES.reduce((acc, c) => acc + c.questions.length, 0);

export default function Faq() {
  const { dir } = useLang();
  const isRtl = dir === "rtl";

  return (
    <SiteLayout>
      {/* Hero — UNMISTAKABLY an FAQ page */}
      <section className="relative text-primary-foreground py-20 overflow-hidden">
        {/* University campus background image */}
        <img
          src={autFaqBg}
          alt={isRtl ? "جامعة العقبة للتكنولوجيا" : "Aqaba University of Technology"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        {/* Color overlay to keep text legible */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-secondary/55 via-secondary/40 to-primary/55" />
        {/* Bottom shade so text stays legible */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent" />
        {/* Big background ? marks for visual identity */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
          <div className="absolute top-8 right-12 font-heading font-black text-[180px] leading-none">?</div>
          <div className="absolute bottom-4 left-16 font-heading font-black text-[140px] leading-none">?</div>
          <div className="absolute top-1/2 left-1/3 font-heading font-black text-[100px] leading-none">?</div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center space-y-5">
            {/* Big circular question icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gold text-gold-foreground shadow-warm border-4 border-gold/30 mb-2">
              <CircleHelp className="h-11 w-11" strokeWidth={2.5} />
            </div>

            <span className="inline-flex items-center gap-2 bg-card/15 border border-card/30 text-primary-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full backdrop-blur-md">
              FAQ • {isRtl ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </span>

            <h1 className="font-heading text-4xl md:text-6xl font-black leading-tight">
              {isRtl ? (
                <>
                  أسئلة <span className="text-gold">يطرحها</span> زوّار الموقع
                </>
              ) : (
                <>
                  Questions <span className="text-gold">visitors</span> ask
                </>
              )}
            </h1>
            <p className="text-primary-foreground/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {isRtl
                ? `إجابات مباشرة على ${totalQuestions} من أكثر الأسئلة شيوعاً بين زوّار الموقع — من نظرة عامة، إلى التحويل، إلى الجانب التقني للنظام.`
                : `Direct answers to the ${totalQuestions} most common questions visitors ask — from overview, to transferring, to the technical side.`}
            </p>
          </div>
        </div>
      </section>

      {/* Category navigator — reinforces the FAQ structure */}
      <section className="container mx-auto px-4 -mt-10 max-w-5xl relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const colorClass =
              cat.color === "primary"
                ? "bg-primary/10 text-primary"
                : cat.color === "secondary"
                ? "bg-secondary/15 text-secondary"
                : "bg-gold/20 text-gold-foreground";
            return (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                className="group"
              >
                <Card className="p-5 border-2 hover:border-primary/50 hover:shadow-elegant transition-all hover:-translate-y-1 bg-card h-full">
                  <div className="flex items-center gap-3">
                    <div className={`${colorClass} w-12 h-12 rounded-2xl flex items-center justify-center shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-bold text-sm text-foreground leading-tight">
                        {isRtl ? cat.titleAr : cat.titleEn}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {cat.questions.length} {isRtl ? "أسئلة" : "questions"}
                      </div>
                    </div>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </section>

      {/* Sectioned questions — each block is clearly an FAQ category */}
      <section className="container mx-auto px-4 pt-14 pb-6 max-w-4xl space-y-10">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          const headerColor =
            cat.color === "primary"
              ? "text-primary"
              : cat.color === "secondary"
              ? "text-secondary"
              : "text-gold-foreground";
          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`${headerColor}`}>
                  <CatIcon className="h-6 w-6" />
                </div>
                <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                  {isRtl ? cat.titleAr : cat.titleEn}
                </h2>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-heading font-bold text-muted-foreground">
                  {cat.questions.length} {isRtl ? "أسئلة" : "Q's"}
                </span>
              </div>

              <Card className="p-2 md:p-4 border-2 shadow-elegant">
                <Accordion type="single" collapsible className="w-full">
                  {cat.questions.map((item, i) => {
                    const value = `${cat.id}-${i}`;
                    return (
                      <AccordionItem key={value} value={value}>
                        <AccordionTrigger className={`${isRtl ? "text-right" : "text-left"} hover:no-underline font-heading font-bold text-foreground py-4 px-2`}>
                          <span className="flex items-start gap-3 text-base md:text-lg w-full">
                            {/* Big Q badge — universal FAQ symbol */}
                            <span className="bg-primary text-primary-foreground font-heading font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-elegant">
                              Q
                            </span>
                            <span className="flex-1 leading-relaxed pt-1">{item.q}</span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className={`text-sm md:text-base text-muted-foreground leading-loose ${isRtl ? "pr-12" : "pl-12"} pb-4`}>
                          <div className="flex items-start gap-3">
                            <span className="bg-gold/20 text-gold-foreground font-heading font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                              A
                            </span>
                            <span className="flex-1 pt-1">{item.a}</span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </Card>
            </div>
          );
        })}
      </section>

      {/* Still have a question? */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/10 text-secondary mb-1">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {isRtl ? "سؤالك ليس هنا؟" : "Your question isn't here?"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? "تواصل مباشرة مع لجنة المعادلات في جامعة العقبة للتكنولوجيا للحصول على إجابة شخصية."
              : "Reach out to the equivalency committee directly for a personalized answer."}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="p-5 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 text-center">
            <div className="bg-primary/10 text-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Phone className="h-5 w-5" />
            </div>
            <div className="font-heading font-bold text-sm text-foreground mb-1">
              {isRtl ? "اتصال" : "Phone"}
            </div>
            <div className="text-xs text-muted-foreground font-mono" dir="ltr">
              +962 3 209 0500
            </div>
          </Card>
          <Card className="p-5 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 text-center">
            <div className="bg-secondary/10 text-secondary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail className="h-5 w-5" />
            </div>
            <div className="font-heading font-bold text-sm text-foreground mb-1">
              {isRtl ? "البريد الإلكتروني" : "Email"}
            </div>
            <div className="text-xs text-muted-foreground font-mono break-all" dir="ltr">
              admission@aut.edu.jo
            </div>
          </Card>
          <Card className="p-5 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 text-center">
            <div className="bg-gold/15 text-gold-foreground w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="font-heading font-bold text-sm text-foreground mb-1">
              {isRtl ? "الموقع" : "Location"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isRtl ? "العقبة، الأردن" : "Aqaba, Jordan"}
            </div>
          </Card>
        </div>
      </section>

      {/* University location map */}
      <section className="container mx-auto px-4 pb-10 max-w-5xl">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-1">
            <MapPin className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {isRtl ? "موقع الجامعة على الخريطة" : "University Location on Map"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {isRtl
              ? "جامعة العقبة للتكنولوجيا — العقبة، المملكة الأردنية الهاشمية"
              : "Aqaba University of Technology — Aqaba, Hashemite Kingdom of Jordan"}
          </p>
        </div>

        <Card className="overflow-hidden border-2 shadow-elegant">
          <div className="relative w-full aspect-[16/9] bg-muted">
            <iframe
              title={isRtl ? "خريطة جامعة العقبة للتكنولوجيا" : "Aqaba University of Technology Map"}
              src="https://www.google.com/maps?q=Aqaba+University+of+Technology,+Aqaba,+Jordan&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
            />
          </div>
          <div className="p-4 md:p-5 bg-card border-t flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gold/15 text-gold-foreground w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Navigation className="h-5 w-5" />
              </div>
              <div className={isRtl ? "text-right" : "text-left"}>
                <div className="font-heading font-bold text-sm text-foreground">
                  {isRtl ? "العنوان" : "Address"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isRtl
                    ? "جامعة العقبة للتكنولوجيا، العقبة، الأردن"
                    : "Aqaba University of Technology, Aqaba, Jordan"}
                </div>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 font-heading font-bold w-full sm:w-auto"
            >
              <a
                href="https://www.google.com/maps/search/?api=1&query=Aqaba+University+of+Technology+Jordan"
                target="_blank"
                rel="noopener noreferrer"
              >
                {isRtl ? "افتح في خرائط Google" : "Open in Google Maps"}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </Card>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-14 max-w-4xl">
        <Card className="p-7 md:p-9 bg-gradient-to-br from-gold via-gold to-gold/85 text-gold-foreground border-0 shadow-warm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-start">
            <div className="bg-primary text-primary-foreground p-4 rounded-2xl shrink-0 shadow-elegant">
              <HelpCircle className="h-12 w-12" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-heading text-xl md:text-2xl font-bold">
                {isRtl ? "هل قرأت الأسئلة وجاهز للتجربة؟" : "Read the FAQ and ready to try?"}
              </h3>
              <p className="text-gold-foreground/85 text-sm md:text-base leading-relaxed">
                {isRtl
                  ? "ابدأ بمعادلة مادة واحدة من خطتك الدراسية واحصل على نتيجة فورية."
                  : "Start by checking one course from your study plan and get an instant result."}
              </p>
            </div>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 shrink-0">
              <Link to="/equivalency">
                {isRtl ? "ابدأ المعادلة" : "Start Now"}
                <ArrowLeft className={isRtl ? "h-4 w-4" : "h-4 w-4 rotate-180"} />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
