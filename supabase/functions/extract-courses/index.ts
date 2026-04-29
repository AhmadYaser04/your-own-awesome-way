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

const SYSTEM_PROMPT = `أنت مساعد دقيق جداً متخصص في استخراج بيانات المواد الدراسية من كشوف العلامات (transcripts) العربية والإنجليزية.

أعد JSON خالصاً فقط (بدون أي نص أو markdown أو شرح) بالشكل:
{
  "courses": [
    { "name": "...", "code": "...", "credits": 3, "grade": "...", "semester": "..." }
  ]
}

== قواعد صارمة جداً (التزم بها حرفياً) ==

1) الرمز (code):
   - انسخه حرفياً من نفس صف المادة فقط (مثل: CS101, MATH-201, 0905101).
   - إن لم يكن هناك رمز ظاهر بوضوح في صف هذه المادة بالذات، اجعل code="" (سلسلة فارغة).
   - **ممنوع منعاً باتاً اختراع أي رمز أو تخمينه أو تركيبه من اسم المادة.**
   - لا تنسخ رمز مادة أخرى ولا رقم الصف.

2) الدرجة (grade):
   - انسخها حرفياً كما تظهر: قد تكون حرفاً لاتينياً (A, A-, B+, C, ...) أو رقماً (85, 92.5) أو كلمة عربية (ممتاز، جيد جداً، جيد، مقبول، ناجح).
   - **لا تترجم بين الأنظمة** (لا تحوّل "ممتاز" إلى A ولا 85 إلى B+).
   - إن كانت الدرجة بالعربية اتركها بالعربية بدون تغيير الأحرف.
   - إن لم تكن واضحة اجعل grade="".

3) الساعات (credits):
   - رقم صحيح أو نصف صحيح بين 1 و 6 كما يظهر في عمود الساعات/Credits/CrHr.
   - إن لم يظهر اجعلها 3 افتراضياً.

4) المواد:
   - استخرج فقط المواد المُجتازة/الناجحة (تجاهل الراسبة F، أو غير المكتملة I/W، أو المؤجلة).
   - لا تخترع مواد. فقط ما تراه فعلياً.
   - حافظ على الترتيب من أعلى إلى أسفل كما في الكشف.

5) الإخراج:
   - JSON صالح فقط. لا تستعمل علامات اقتباس عربية. استخدم " فقط.
   - تأكد من إغلاق كل {} و [].`;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractionFallback = (error: string, errorCode: string) =>
  jsonResponse({
    error,
    errorCode,
    allowManualEntry: true,
    courses: [],
    rawText: "",
    count: 0,
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return extractionFallback("خدمة الاستخراج غير مهيأة حالياً.", "AI_NOT_CONFIGURED");
    }

    const body = await req.json().catch(() => ({}));
    const fileUrl: string | undefined = body.fileUrl;
    if (!fileUrl) {
      return jsonResponse({ error: "fileUrl مطلوب" }, 400);
    }

    const urlPath = (() => {
      try {
        return new URL(fileUrl).pathname.toLowerCase();
      } catch {
        return fileUrl.toLowerCase();
      }
    })();
    const isPdf = urlPath.includes(".pdf");

    let userContent: unknown;

    if (isPdf) {
      try {
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) {
          return extractionFallback(`تعذّر تنزيل الملف: ${fileRes.status}`, "FILE_DOWNLOAD_FAILED");
        }

        const buf = new Uint8Array(await fileRes.arrayBuffer());
        if (buf.byteLength > 15 * 1024 * 1024) {
          return extractionFallback("حجم الملف كبير جداً لعملية الاستخراج التلقائي (الحد الأقصى 15MB).", "FILE_TOO_LARGE");
        }

        const { extractText } = await import("https://esm.sh/unpdf@0.12.1");
        const { text } = await extractText(buf, { mergePages: true });
        const pdfText = (Array.isArray(text) ? text.join("\n") : String(text || "")).slice(0, 40000);

        if (!pdfText.trim()) {
          return extractionFallback(
            "لم يتم العثور على نص قابل للقراءة في ملف PDF. يمكنك المتابعة عبر إدخال المواد يدوياً أو رفع صورة واضحة.",
            "PDF_TEXT_NOT_FOUND",
          );
        }

        userContent = [
          {
            type: "text",
            text: `استخرج كل المواد المُجتازة من نص كشف العلامات التالي بدقة عالية، ولا تخترع رموزاً لمواد ليس لها رمز ظاهر. أعد JSON فقط.\n\n=== نص الكشف ===\n${pdfText}`,
          },
        ];
      } catch (e) {
        return extractionFallback(`فشل قراءة PDF: ${(e as Error)?.message ?? e}`, "PDF_READ_FAILED");
      }
    } else {
      userContent = [
        {
          type: "text",
          text: "استخرج كل المواد المُجتازة من هذا الكشف بدقة عالية، ولا تخترع رموزاً لمواد ليس لها رمز ظاهر. أعد JSON فقط.",
        },
        {
          type: "image_url",
          image_url: { url: fileUrl },
        },
      ];
    }

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 8000,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();

      if (aiRes.status === 402) {
        return extractionFallback("تم استنفاد رصيد الذكاء الاصطناعي، يرجى إضافة رصيد أو استخدام الإدخال اليدوي.", "AI_BALANCE_EXHAUSTED");
      }

      if (aiRes.status === 429) {
        return extractionFallback("تم تجاوز حد الاستخدام، يمكنك المحاولة لاحقاً أو متابعة الإدخال اليدوي الآن.", "AI_RATE_LIMITED");
      }

      return extractionFallback(`فشل استدعاء الذكاء الاصطناعي: ${errText}`, "AI_SERVICE_FAILED");
    }

    const aiData = await aiRes.json();
    const rawContent: string = aiData?.choices?.[0]?.message?.content ?? "";

    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let parsed: { courses: ExtractedCourse[] } = { courses: [] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = { courses: [] };
        }
      }
    }

    const arabicToLatinDigits = (s: string) =>
      s.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

    const cleanGrade = (raw: string): string => {
      if (!raw) return "";
      const g = arabicToLatinDigits(raw).trim();
      const numMatch = g.match(/^-?\d+(\.\d+)?$/);
      if (numMatch) return g;
      const letterMatch = g.match(/^[A-Fa-f][+\-]?$/);
      if (letterMatch) return letterMatch[0].toUpperCase();
      return raw.trim();
    };

    const cleanCode = (raw: string): string => {
      const c = arabicToLatinDigits(String(raw ?? "")).trim().replace(/\s+/g, "");
      if (!c) return "";
      if (c.length > 20) return "";
      if (!/[A-Za-z0-9]/.test(c)) return "";
      return c;
    };

    const courses = (parsed.courses ?? [])
      .map((c) => {
        const credRaw = arabicToLatinDigits(String(c.credits ?? "3"));
        const credNum = Number(credRaw);
        return {
          name: String(c.name ?? "").trim(),
          code: cleanCode(c.code as string),
          credits: Number.isFinite(credNum) && credNum >= 1 && credNum <= 6 ? credNum : 3,
          grade: cleanGrade(String(c.grade ?? "")),
          semester: String(c.semester ?? "").trim(),
        };
      })
      .filter((c) => c.name.length > 0);

    return jsonResponse({
      courses,
      rawText: rawContent,
      count: courses.length,
    });
  } catch (e) {
    return extractionFallback(String((e as Error)?.message ?? e), "EXTRACTION_FAILED");
  }
});
