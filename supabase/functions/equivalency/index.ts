import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AutCourse {
  code: string;
  name: string;
  credits: number;
  description: string;
}

// Reference catalog: AUT — Computer Science / Artificial Intelligence (BSc)
// Note: synthesized from the official department charter (https://www.aut.edu.jo/college/7/ar)
const AUT_AI_COURSES: AutCourse[] = [
  { code: "AI101", name: "مقدمة في الذكاء الاصطناعي", credits: 3, description: "تعريف بمفاهيم الذكاء الاصطناعي، تاريخه، تطبيقاته، أنواع الوكلاء الذكية، البحث في فضاء الحالات، خوارزميات البحث غير المُعَلَّم والمُعَلَّم، تمثيل المعرفة، والاستدلال." },
  { code: "AI201", name: "تعلم الآلة", credits: 3, description: "خوارزميات التعلم المُشرَف وغير المُشرَف: الانحدار الخطي واللوجستي، أشجار القرار، الجيران الأقرب K-NN، التجميع K-Means، تقييم النماذج، Overfitting، التحقق المتقاطع." },
  { code: "AI202", name: "التعلم العميق", credits: 3, description: "الشبكات العصبية الاصطناعية، الانتشار الخلفي، الشبكات العصبية الالتفافية CNN، الشبكات المتكررة RNN/LSTM، Transformers، استخدام مكتبات TensorFlow و PyTorch." },
  { code: "AI301", name: "معالجة اللغات الطبيعية", credits: 3, description: "تحليل النصوص، Tokenization، Stemming، Word Embeddings، نماذج اللغة، تصنيف النصوص، تحليل المشاعر، الترجمة الآلية، نماذج Transformer مثل BERT." },
  { code: "AI302", name: "الرؤية الحاسوبية", credits: 3, description: "معالجة الصور الرقمية، استخراج الميزات، اكتشاف الحواف، تصنيف الصور، اكتشاف الكائنات YOLO، التجزئة الدلالية، تطبيقات OpenCV." },
  { code: "AI303", name: "علم البيانات والتحليل الضخم", credits: 3, description: "Pandas، NumPy، تنظيف البيانات، التحليل الاستكشافي EDA، التصور البياني، Hadoop، Spark، إدارة البيانات الضخمة." },
  { code: "AI304", name: "الروبوتات الذكية", credits: 3, description: "أنظمة الروبوتات، المستشعرات والمحركات، التخطيط الحركي، التموضع والملاحة SLAM، تكامل الذكاء الاصطناعي مع الروبوتات." },
  { code: "AI401", name: "أخلاقيات الذكاء الاصطناعي", credits: 3, description: "التحيز في الخوارزميات، العدالة، الشفافية، الخصوصية، التأثير الاجتماعي للذكاء الاصطناعي، الأنظمة المسؤولة، AI Governance." },
  { code: "CS101", name: "مقدمة في البرمجة (بايثون)", credits: 3, description: "أساسيات البرمجة، المتغيرات، التحكم بالتدفق، الدوال، الهياكل البيانية الأساسية، البرمجة الكائنية." },
  { code: "CS201", name: "هياكل البيانات والخوارزميات", credits: 3, description: "المصفوفات، القوائم المتصلة، الأكوام والطوابير، الأشجار، الجداول الهاشية، الرسوم البيانية، خوارزميات الفرز والبحث، تحليل التعقيد Big-O." },
  { code: "CS202", name: "قواعد البيانات", credits: 3, description: "نموذج العلاقة-الكيان ER، الجبر العلائقي، SQL، التطبيع، إدارة المعاملات، قواعد البيانات NoSQL." },
  { code: "MATH201", name: "الجبر الخطي", credits: 3, description: "المتجهات والمصفوفات، الأنظمة الخطية، القيم والمتجهات الذاتية، تحليل المصفوفات، تطبيقات في الذكاء الاصطناعي." },
  { code: "MATH202", name: "الاحتمالات والإحصاء", credits: 3, description: "الاحتمالات، التوزيعات، الإحصاء الوصفي والاستدلالي، اختبار الفرضيات، Bayes Theorem، تطبيقات في تعلم الآلة." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { saudiCourse } = await req.json();
    if (!saudiCourse || typeof saudiCourse !== "string" || saudiCourse.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "يرجى إدخال وصف مادة سعودية لا يقل عن 20 حرفاً." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY غير مهيّأ");

    const catalogText = AUT_AI_COURSES.map(
      (c) => `- ${c.code} | ${c.name} (${c.credits} س.م): ${c.description}`
    ).join("\n");

    const systemPrompt = `أنت خبير أكاديمي مختص في معادلة المواد الدراسية بين الجامعات السعودية وجامعة العقبة للتكنولوجيا (AUT) — تخصص علم الحاسوب/الذكاء الاصطناعي.

مهمتك: مقارنة وصف مادة دراسية من جامعة سعودية مع كل مواد الخطة الدراسية لتخصص الذكاء الاصطناعي في AUT أدناه، ثم تحديد:
1. أفضل مادة (أو مادتين كحد أقصى) في AUT تتطابق مع المادة السعودية.
2. نسبة التطابق الدلالي (0-100٪) بناءً على: تقاطع المخرجات التعليمية، المواضيع المشتركة، عمق التغطية، وعدد الساعات المعتمدة.
3. حكم نهائي: "تُعادَل" (≥75٪)، "تُعادَل بشروط" (60-74٪)، "لا تُعادَل" (<60٪).
4. مبررات قصيرة وواضحة بالعربية.

قائمة مواد AUT للذكاء الاصطناعي:
${catalogText}

أرجع نتيجة منظّمة فقط عبر استدعاء الدالة المُحددة.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_equivalency",
          description: "إرجاع نتيجة معادلة المادة بشكل منظم.",
          parameters: {
            type: "object",
            properties: {
              matches: {
                type: "array",
                description: "أفضل المواد المُطابقة في AUT (1 إلى 2)",
                items: {
                  type: "object",
                  properties: {
                    aut_code: { type: "string" },
                    aut_name: { type: "string" },
                    similarity: { type: "number", description: "نسبة التطابق 0-100" },
                    reasoning: { type: "string", description: "تبرير المطابقة بالعربية" },
                  },
                  required: ["aut_code", "aut_name", "similarity", "reasoning"],
                  additionalProperties: false,
                },
              },
              verdict: {
                type: "string",
                enum: ["تُعادَل", "تُعادَل بشروط", "لا تُعادَل"],
              },
              overall_similarity: { type: "number", description: "أعلى نسبة تطابق إجمالية" },
              summary: { type: "string", description: "ملخص نهائي 2-3 جمل" },
            },
            required: ["matches", "verdict", "overall_similarity", "summary"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `وصف المادة السعودية المراد معادلتها:\n\n${saudiCourse}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_equivalency" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "نفدت رصيد Lovable AI، يرجى إضافة رصيد." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("استجابة الذكاء الاصطناعي غير صالحة");
    }
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("equivalency error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
