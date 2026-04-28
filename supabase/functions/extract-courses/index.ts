// supabase/functions/extract-courses/index.ts
// استخراج مواد الطالب من PDF/صورة باستخدام Lovable AI (Gemini Vision).
// يستقبل: { fileUrl } لرابط ملف موقّع من Storage
// يعيد: { courses: [{ name, code, credits, grade }], rawText }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ExtractedCourse {
  name: string;
  code: string;
  credits: number;
  grade: string;
  semester?: string;
}

const SYSTEM_PROMPT = `أنت مساعد ذكي متخصص في استخراج بيانات المواد الدراسية من كشوف العلامات الجامعية والدبلومات.
سيُعرض عليك صورة أو PDF لكشف مواد طالب (من جامعة أو دبلوم سابق).

استخرج كل مادة مرّت في الكشف وأعد JSON خالصاً (بدون أي نص قبل أو بعد) بالشكل التالي:
{
  "courses": [
    { "name": "اسم المادة بالعربية أو الإنجليزية كما ورد", "code": "رمز المادة إن وُجد", "credits": 3, "grade": "A أو 85 أو ممتاز", "semester": "الفصل إن ذُكر" }
  ]
}

قواعد مهمة:
- استخرج كل المواد المُجتازة فقط (تجاهل الراسبة أو غير المكتملة إن وُجدت).
- credits = عدد الساعات المعتمدة (رقم بين 1 و 6).
- grade = الدرجة كما وردت (حرفية مثل A,B+ أو رقمية مثل 85 أو وصفية مثل "ممتاز").
- إن لم يوجد رمز للمادة اترك code=""
- إن لم يوجد فصل اترك semester=""
- لا تخترع مواد. فقط ما تراه فعلياً في الكشف.
- أعد JSON فقط بدون شرح أو markdown.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY غير مهيأ" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl: string | undefined = body.fileUrl;
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: "fileUrl مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // نُرسل رابط الملف مباشرة إلى Gemini عبر Lovable AI
    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "استخرج كل المواد من هذا الكشف وأعد JSON فقط.",
              },
              {
                type: "image_url",
                image_url: { url: fileUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الاستخدام، يرجى المحاولة لاحقاً." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "تم استنفاد رصيد الذكاء الاصطناعي، يرجى إضافة رصيد." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `فشل استدعاء الذكاء الاصطناعي: ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const rawContent: string = aiData?.choices?.[0]?.message?.content ?? "";

    // إزالة أي markdown fences إن وجدت
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { courses: ExtractedCourse[] } = { courses: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch (_e) {
      // محاولة إيجاد أول كائن JSON داخل النص
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = { courses: [] };
        }
      }
    }

    const courses = (parsed.courses ?? []).map((c) => ({
      name: String(c.name ?? "").trim(),
      code: String(c.code ?? "").trim(),
      credits: Number(c.credits ?? 3) || 3,
      grade: String(c.grade ?? "").trim(),
      semester: String(c.semester ?? "").trim(),
    })).filter((c) => c.name.length > 0);

    return new Response(
      JSON.stringify({
        courses,
        rawText: rawContent,
        count: courses.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
