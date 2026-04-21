import SiteLayout from "@/components/SiteLayout";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Brain } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";

const FAQ = [
  {
    q: "ما فكرة المشروع باختصار؟",
    a: "نظام ويب يستخدم الذكاء الاصطناعي (نماذج اللغة الكبيرة) لمعادلة وصف المواد الدراسية بين الجامعات السعودية وخطة بكالوريوس الذكاء الاصطناعي في جامعة العقبة للتكنولوجيا. الطالب يلصق وصف المادة فيحصل على نسبة تطابق دلالية، أفضل المواد المُعادِلة، وحكم نهائي.",
  },
  {
    q: "لماذا اخترت هذا الموضوع كمشروع تخرج؟",
    a: "لأن معادلة المواد عملية يدوية بطيئة ومُتحيزة بشكل بشري، وتأخذ أسابيع. كما أنها مشكلة حقيقية تواجه طلاب التحويل بين الجامعات. اخترت تخصص الذكاء الاصطناعي تحديداً لأنه تخصصي ولأن طبيعة المواد متغيرة بسرعة، فالحاجة إلى أداة ذكية أكثر إلحاحاً.",
  },
  {
    q: "ما التقنيات المستخدمة في المشروع؟",
    a: "Frontend: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui. Backend: Lovable Cloud (Supabase) — Edge Functions بـ Deno. AI Engine: Lovable AI Gateway مع نموذج Google Gemini 2.5 Flash. المعمارية: Serverless مع استدعاء آمن للـ AI من السيرفر فقط.",
  },
  {
    q: "كيف يعمل محرك المعادلة فعلياً؟",
    a: "1) الطالب يدخل وصف المادة السعودية. 2) الواجهة ترسل النص إلى Edge Function آمنة. 3) الـ Function تبني Prompt يحوي وصف المادة + كامل خطة AI في AUT. 4) Gemini يقارن النص دلالياً ويُرجع نتيجة منظّمة عبر Tool Calling (JSON صارم). 5) النتيجة تُعرض للمستخدم: نسبة، أفضل المواد، تبرير، وحكم.",
  },
  {
    q: "لماذا Tool Calling بدلاً من طلب JSON عادي؟",
    a: "Tool Calling يضمن أن النموذج يُرجع بيانات منظّمة تتبع Schema محدد، فلا يحدث Parsing Errors ولا حقول ناقصة. هذا أكثر موثوقية بكثير من طلب 'أرجع JSON' في النص الحر.",
  },
  {
    q: "كيف تحسب نسبة التطابق؟ هل هي مجرد تشابه نصي؟",
    a: "لا، إنها تشابه دلالي (Semantic Similarity) وليس Lexical. النموذج يفهم المعنى، فيعرف أن 'Backpropagation' و'الانتشار الخلفي' نفس المفهوم. كما يأخذ بعين الاعتبار: تقاطع المخرجات التعليمية، عمق التغطية، الساعات المعتمدة، والمواضيع المشتركة.",
  },
  {
    q: "ما حدود دقة النظام؟",
    a: "الدقة تعتمد على جودة وصف المادة المُدخل. إذا كان الوصف مختصراً جداً (سطرين فقط) فالنتيجة قد لا تكون موثوقة. كذلك النموذج قد يُبالغ أحياناً في تقدير التطابق. ولذلك جعلتُ الحكم تدرّجاً (تُعادَل / بشروط / لا تُعادَل) بدل قرار ثنائي حاد.",
  },
  {
    q: "كيف ضمنت أمن النظام؟",
    a: "1) مفتاح Lovable AI لا يُسرَّب للعميل أبداً، كل الاستدعاءات تتم من Edge Function. 2) CORS مضبوط. 3) Input Validation على طول النص. 4) معالجة Rate Limit (429) و Payment (402) مع رسائل واضحة. 5) لا يوجد تخزين دائم لمحتوى المواد المُدخَلة.",
  },
  {
    q: "لماذا اقتصرتَ على تخصص واحد فقط؟",
    a: "ركزتُ على تخصص الذكاء الاصطناعي حصراً لأنه تخصصي ولأن العمق أهم من الاتساع في مشروع تخرج. هذا سمح لي ببناء قاعدة مرجعية دقيقة (15+ مادة) وضبط الـ Prompt بدقة. التوسع لتخصصات أخرى ممكن مستقبلاً بإضافة Catalogs جديدة.",
  },
  {
    q: "هل يمكن للنظام أن يحل محل لجنة المعادلة في الجامعة؟",
    a: "لا، الهدف ليس استبدال اللجنة بل مساعدتها. النظام يُقدم رأياً أولياً سريعاً (خلال ثوانٍ) يساعد الطالب على معرفة فرصه، ويُقدم للجنة تحليلاً جاهزاً يختصر وقت المراجعة. القرار النهائي يبقى بيد اللجنة الأكاديمية المختصة.",
  },
  {
    q: "كيف اختبرت النظام؟",
    a: "اختبرتُه بـ: 1) مواد سعودية حقيقية من خطط جامعة الملك سعود وKAU. 2) حالات حدية (وصف قصير جداً، وصف غير متعلق بـ AI). 3) مقارنة نتائج النظام مع رأي أكاديمي بشري. 4) قياس الـ Latency والاتساق عبر استدعاءات متعددة لنفس المادة.",
  },
  {
    q: "ما التحديات التي واجهتك؟",
    a: "1) ضمان إخراج JSON منظّم — حُلَّت بـ Tool Calling. 2) دعم النص العربي RTL في كل واجهات shadcn — تطلّب تخصيصات. 3) ضبط Prompt يعطي تقييماً عادلاً وغير متسامح بزيادة. 4) الحصول على الخطة الدراسية الرسمية لـ AUT (الموقع لا يعرض المواد بـ HTML قابل للسحب).",
  },
  {
    q: "ما خطط التطوير المستقبلية؟",
    a: "1) إضافة بقية تخصصات AUT. 2) قاعدة بيانات بمعادلات سابقة موافَق عليها لتدريب نظام Fine-tuning. 3) دعم رفع PDF كامل لخطة دراسية ومعادلتها دفعة واحدة. 4) نظام مصادقة للجان الأكاديمية لتعديل القرارات. 5) تقارير قابلة للطباعة بختم رسمي.",
  },
];

export default function Faq() {
  const { t } = useLang();
  return (
    <SiteLayout>
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

      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <Card className="p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-right hover:no-underline font-heading font-bold text-foreground">
                  <span className="flex items-start gap-2 text-base">
                    <Brain className="h-4 w-4 text-primary shrink-0 mt-1" />
                    {item.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pr-6">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>
    </SiteLayout>
  );
}
