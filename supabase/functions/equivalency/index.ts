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

interface RequestBody {
  saudiCourse?: string;
  inputMode?: "text" | "pdf" | "image";
  fileDataUrl?: string; // data:application/pdf;base64,... or data:image/png;base64,...
  fileName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    const inputMode = body.inputMode ?? "text";

    if (inputMode === "text") {
      if (!body.saudiCourse || typeof body.saudiCourse !== "string" || body.saudiCourse.trim().length < 20) {
        return new Response(
          JSON.stringify({ error: "يرجى إدخال وصف مادة لا يقل عن 20 حرفاً." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      if (!body.fileDataUrl || !body.fileDataUrl.startsWith("data:")) {
        return new Response(
          JSON.stringify({ error: "يرجى رفع ملف صالح (PDF أو صورة) بصيغة data URL." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Limit ~12MB base64 (~9MB binary)
      if (body.fileDataUrl.length > 14_000_000) {
        return new Response(
          JSON.stringify({ error: "الملف كبير جداً. الحد الأقصى ~10 ميجابايت." }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY غير مهيّأ");

    const catalogText = AUT_AI_COURSES.map(
      (c) => `- ${c.code} | ${c.name} (${c.credits} س.م): ${c.description}`
    ).join("\n");

    const systemPrompt = `أنت خبير أكاديمي مختص في معادلة المواد الدراسية بين الجامعات والكليات والدبلومات وجامعة العقبة للتكنولوجيا (AUT) — تخصص علم الحاسوب/الذكاء الاصطناعي.

عند استلامك ملفاً (PDF أو صورة) قد يحتوي على **مادة واحدة أو عدّة مواد دراسية** (مثلاً: كشف علامات، خطة جامعية كاملة، أو قائمة من المواد).
- استخرج كل مادة موجودة في المدخل بدقة (الاسم، الساعات إن وُجدت، المخرجات، المواضيع).
- إذا كان النص يصف مادة واحدة فقط، أعِد مادة واحدة في المصفوفة.
- إذا كان يحتوي على أكثر من مادة، أعِد كل واحدة منها في عنصر مستقل داخل المصفوفة.

لكل مادة مستخرَجة من الجامعة المُحوَّل منها:
1. قارنها مع مواد AUT أدناه.
2. اختر أفضل مادة (أو مادتين كحد أقصى) في AUT تتطابق معها.
3. احسب نسبة التطابق الدلالي (0-100٪) بناءً على: تقاطع المخرجات، المواضيع المشتركة، عمق التغطية، الساعات.
4. حكم: "تُعادَل" (≥75٪)، "تُعادَل بشروط" (60-74٪)، "لا تُعادَل" (<60٪).
5. مبررات قصيرة بالعربية.

قائمة مواد AUT للذكاء الاصطناعي:
${catalogText}

أرجع نتيجة منظّمة فقط عبر استدعاء الدالة المُحددة.`;

    // Build the user message — multimodal if file uploaded
    let userMessage: any;
    if (inputMode === "text") {
      userMessage = {
        role: "user",
        content: `وصف المادة (أو المواد) المراد معادلتها:\n\n${body.saudiCourse}`,
      };
    } else if (inputMode === "image") {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: "هذه صورة من ميثاق/خطة جامعية. اقرأها بدقة (OCR عربي/إنجليزي)، استخرج كل المواد التي تظهر فيها، ثم أجرِ المعادلة لكل مادة على حدة وأعد النتيجة عبر الدالة." },
          { type: "image_url", image_url: { url: body.fileDataUrl } },
        ],
      };
    } else {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: `هذا ملف PDF (${body.fileName ?? "courses.pdf"}) قد يحتوي على مادة واحدة أو خطة جامعية كاملة. استخرج كل مادة بدقة، ثم أجرِ المعادلة لكل واحدة منها على حدة وأعد النتيجة عبر الدالة.` },
          { type: "image_url", image_url: { url: body.fileDataUrl } },
        ],
      };
    }

    const courseSchema = {
      type: "object",
      properties: {
        saudi_course_name: { type: "string", description: "اسم المادة كما استُخرج." },
        extracted_course: { type: "string", description: "وصف المادة كما استُخرج (المخرجات + المواضيع)." },
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
        verdict: { type: "string", enum: ["تُعادَل", "تُعادَل بشروط", "لا تُعادَل"] },
        overall_similarity: { type: "number", description: "أعلى نسبة تطابق إجمالية" },
        summary: { type: "string", description: "ملخص نهائي 1-2 جمل" },
      },
      required: ["saudi_course_name", "matches", "verdict", "overall_similarity", "summary"],
      additionalProperties: false,
    };

    const tools = [
      {
        type: "function",
        function: {
          name: "submit_equivalency",
          description: "إرجاع نتيجة معادلة المادة (أو المواد) بشكل منظم.",
          parameters: {
            type: "object",
            properties: {
              courses: {
                type: "array",
                description: "كل مادة تم استخراجها مع نتيجة معادلتها. مادة واحدة أو أكثر.",
                items: courseSchema,
              },
            },
            required: ["courses"],
            additionalProperties: false,
          },
        },
      },
    ];

    // Use a vision-capable model when file is provided
    const model = inputMode === "text" ? "google/gemini-2.5-flash" : "google/gemini-2.5-pro";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          userMessage,
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
      console.error("Invalid AI response", JSON.stringify(data).slice(0, 500));
      throw new Error("استجابة الذكاء الاصطناعي غير صالحة");
    }
    const raw = JSON.parse(toolCall.function.arguments);
    const courses: any[] = Array.isArray(raw.courses) ? raw.courses : [];
    if (courses.length === 0) {
      throw new Error("لم يتم استخراج أي مادة من المدخل.");
    }

    // نضع legacy fields من أول مادة للتوافق مع الواجهة الحالية،
    // ونرفق المصفوفة كاملة للوضع الدفعي.
    const first = courses[0] ?? {};
    const response = {
      // ===== legacy fields (مادة واحدة) =====
      matches: first.matches ?? [],
      verdict: first.verdict ?? "لا تُعادَل",
      overall_similarity: first.overall_similarity ?? 0,
      summary: first.summary ?? "",
      extracted_course: first.extracted_course ?? "",
      // ===== batch (كل المواد) =====
      is_batch: courses.length > 1,
      courses,
    };

    return new Response(JSON.stringify(response), {
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
