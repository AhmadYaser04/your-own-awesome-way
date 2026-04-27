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
  MessagesSquare,
  GraduationCap,
  Clock,
  FileText,
  Wallet,
  ScrollText,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Users,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

// Real student-oriented questions — no technical jargon
const FAQ = [
  {
    icon: GraduationCap,
    q: "أنا طالب في جامعة سعودية وأرغب بالتحويل إلى جامعة العقبة للتكنولوجيا، كيف يساعدني هذا النظام؟",
    a: "النظام مصمّم خصيصاً لك. كل ما عليك فعله هو لصق وصف المادة من خطتك الدراسية السعودية، أو رفع ملف PDF أو حتى صورة من الكاميرا للوصف، ثم النظام سيخبرك خلال ثوانٍ: هل هذه المادة تُعادَل بمادة في جامعة العقبة؟ ما هي المادة المقابلة؟ وكم نسبة التطابق بينهما؟",
  },
  {
    icon: ScrollText,
    q: "هل قرار النظام رسمي ومُعتمَد من الجامعة؟",
    a: "لا، النظام يعطيك رأياً أولياً واسترشادياً فقط ليساعدك على تكوين فكرة سريعة عن فرصك. القرار الرسمي والنهائي يبقى دائماً بيد لجنة المعادلات الأكاديمية في جامعة العقبة للتكنولوجيا. لكن إن كانت نتيجة النظام إيجابية، فهذا مؤشر جيد جداً لك قبل تقديم طلبك الرسمي.",
  },
  {
    icon: Clock,
    q: "كم تستغرق عملية معادلة المادة؟",
    a: "أقل من 10 ثوانٍ لكل مادة. مقارنةً بالطريقة التقليدية التي قد تستغرق أسابيع من المراجعة اليدوية في لجان المعادلات، النظام يوفر عليك وقتاً كبيراً ويمنحك صورة فورية عن وضعك الأكاديمي.",
  },
  {
    icon: FileText,
    q: "ما هي التخصصات التي يدعمها النظام حالياً؟",
    a: "النظام مخصّص حالياً لتخصص بكالوريوس الذكاء الاصطناعي في كلية تكنولوجيا المعلومات بجامعة العقبة للتكنولوجيا فقط. إذا كنت طالباً في تخصص علم الحاسوب أو الذكاء الاصطناعي في جامعة سعودية وترغب بالتحويل لهذا التخصص تحديداً، النظام مناسب لك تماماً.",
  },
  {
    icon: Users,
    q: "هل أحتاج لإنشاء حساب لاستخدام النظام؟",
    a: "لا، يمكنك تجربة معادلة المواد مباشرة دون تسجيل دخول. الحساب مفيد فقط إذا أردت حفظ سجل المعادلات السابقة والرجوع إليها لاحقاً، أو لمتابعة طلباتك الرسمية مع لجنة المعادلات.",
  },
  {
    icon: HelpCircle,
    q: "ماذا أفعل إذا كانت نتيجة المعادلة غير دقيقة أو غير متوقعة؟",
    a: "تأكد أولاً من أن وصف المادة الذي أدخلته كامل وواضح ويحتوي على: اسم المادة، عدد الساعات المعتمدة، المخرجات التعليمية، والمواضيع التي تغطيها. كلما كان الوصف أدق، كانت النتيجة أقرب للواقع. وإذا بقيت النتيجة غريبة، يمكنك التواصل مع لجنة المعادلات مباشرة لمراجعة الحالة.",
  },
];

export default function Faq() {
  const { dir } = useLang();

  return (
    <SiteLayout>
      {/* Hero — friendly student-focused */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary/95 to-primary text-primary-foreground py-16 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/30 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-2 bg-gold/25 border border-gold/50 text-gold-foreground text-xs md:text-sm font-heading font-bold px-4 py-1.5 rounded-full backdrop-blur-md">
              <MessagesSquare className="h-3.5 w-3.5" />
              {dir === "rtl" ? "ركن الطالب" : "Student Corner"}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold leading-tight">
              {dir === "rtl" ? "كل ما يدور في بالك — مُجاب عليه هنا" : "All your questions — answered here"}
            </h1>
            <p className="text-primary-foreground/90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {dir === "rtl"
                ? "إجابات صريحة ومباشرة على أكثر الأسئلة التي يطرحها الطلاب الراغبون بمعادلة موادهم في جامعة العقبة للتكنولوجيا."
                : "Honest answers to the most common student questions about course equivalency at Aqaba University of Technology."}
            </p>
          </div>
        </div>
      </section>

      {/* Quick stats strip */}
      <section className="container mx-auto px-4 -mt-8 max-w-4xl relative z-20">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center bg-card border-2 shadow-elegant">
            <div className="font-heading font-bold text-2xl text-primary">6</div>
            <div className="text-[10px] md:text-xs text-muted-foreground font-heading mt-1">
              {dir === "rtl" ? "أسئلة شائعة" : "Common questions"}
            </div>
          </Card>
          <Card className="p-4 text-center bg-card border-2 shadow-elegant">
            <div className="font-heading font-bold text-2xl text-secondary">&lt;10s</div>
            <div className="text-[10px] md:text-xs text-muted-foreground font-heading mt-1">
              {dir === "rtl" ? "وقت المعادلة" : "Time per check"}
            </div>
          </Card>
          <Card className="p-4 text-center bg-card border-2 shadow-elegant">
            <div className="font-heading font-bold text-2xl text-gold">100%</div>
            <div className="text-[10px] md:text-xs text-muted-foreground font-heading mt-1">
              {dir === "rtl" ? "مجاني للطلاب" : "Free for students"}
            </div>
          </Card>
        </div>
      </section>

      {/* Questions */}
      <section className="container mx-auto px-4 pt-10 max-w-4xl">
        <Card className="p-4 md:p-6 border-2 shadow-elegant">
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
            {FAQ.map((item, i) => {
              const Icon = item.icon;
              return (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-right hover:no-underline font-heading font-bold text-foreground">
                    <span className="flex items-start gap-3 text-base md:text-lg">
                      <span className="bg-secondary/15 text-secondary p-2 rounded-xl shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 leading-relaxed">{item.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-muted-foreground leading-loose pr-14">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Card>
      </section>

      {/* Still have a question? Contact strip */}
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-5 space-y-1">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-foreground">
            {dir === "rtl" ? "لم تجد إجابتك؟" : "Didn't find your answer?"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {dir === "rtl"
              ? "تواصل مباشرة مع لجنة المعادلات في جامعة العقبة للتكنولوجيا"
              : "Reach out to the equivalency committee directly"}
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="p-5 border-2 hover:shadow-elegant transition-all hover:-translate-y-1 text-center">
            <div className="bg-primary/10 text-primary w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Phone className="h-5 w-5" />
            </div>
            <div className="font-heading font-bold text-sm text-foreground mb-1">
              {dir === "rtl" ? "اتصال" : "Phone"}
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
              {dir === "rtl" ? "البريد الإلكتروني" : "Email"}
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
              {dir === "rtl" ? "الموقع" : "Location"}
            </div>
            <div className="text-xs text-muted-foreground">
              {dir === "rtl" ? "العقبة، الأردن" : "Aqaba, Jordan"}
            </div>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-14 max-w-4xl">
        <Card className="p-7 md:p-9 bg-gradient-to-br from-gold via-gold to-gold/85 text-gold-foreground border-0 shadow-warm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-5 text-center md:text-start">
            <div className="bg-primary text-primary-foreground p-4 rounded-2xl shrink-0 shadow-elegant">
              <Sparkles className="h-12 w-12" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-heading text-xl md:text-2xl font-bold">
                {dir === "rtl" ? "جاهز لتعرف وضع موادك؟" : "Ready to check your courses?"}
              </h3>
              <p className="text-gold-foreground/85 text-sm md:text-base leading-relaxed">
                {dir === "rtl"
                  ? "خذ خطوتك الأولى نحو التحويل — جرّب معادلة مادة واحدة الآن مجاناً وبدون تسجيل."
                  : "Take the first step — try one equivalency right now, free and no signup needed."}
              </p>
            </div>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 shrink-0">
              <Link to="/equivalency">
                {dir === "rtl" ? "ابدأ المعادلة" : "Start Now"}
                <ArrowLeft className={dir === "rtl" ? "h-4 w-4" : "h-4 w-4 rotate-180"} />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
