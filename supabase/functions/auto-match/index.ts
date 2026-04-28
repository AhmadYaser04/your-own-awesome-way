import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SourceItem {
  id: string;
  source_course_name: string;
  source_course_code: string | null;
  source_credits: number;
}
interface AutCourse {
  id: string;
  course_code: string;
  course_name_ar: string;
  course_name_en: string | null;
  credits: number;
  description_ar: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { request_id } = await req.json();
    if (!request_id || typeof request_id !== "string") {
      return new Response(JSON.stringify({ error: "request_id مطلوب" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY غير مهيّأ");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", userRes.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "هذه العملية للمسؤول فقط" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch items + AUT catalog + existing matches
    const [{ data: items }, { data: aut }, { data: existing }] = await Promise.all([
      admin.from("equivalency_request_items").select("id, source_course_name, source_course_code, source_credits").eq("request_id", request_id),
      admin.from("aut_courses").select("id, course_code, course_name_ar, course_name_en, credits, description_ar").eq("is_active", true),
      admin.from("equivalency_matches").select("source_item_ids, aut_course_id").eq("request_id", request_id),
    ]);

    const itemsList = (items ?? []) as SourceItem[];
    const autList = (aut ?? []) as AutCourse[];
    if (itemsList.length === 0) {
      return new Response(JSON.stringify({ error: "لا توجد مواد طالب لمعادلتها" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (autList.length === 0) {
      return new Response(JSON.stringify({ error: "لا توجد مواد AUT في النظام" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Items already linked — skip
    const linkedItemIds = new Set<string>();
    const linkedAutIds = new Set<string>();
    (existing ?? []).forEach((m: any) => {
      (m.source_item_ids || []).forEach((sid: string) => linkedItemIds.add(sid));
      if (m.aut_course_id) linkedAutIds.add(m.aut_course_id);
    });
    const unlinkedItems = itemsList.filter((i) => !linkedItemIds.has(i.id));
    if (unlinkedItems.length === 0) {
      return new Response(JSON.stringify({ created: 0, message: "كل المواد مربوطة مسبقاً" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceText = unlinkedItems.map((i) =>
      `- [ID:${i.id}] ${i.source_course_name}${i.source_course_code ? ` (${i.source_course_code})` : ""} — ${i.source_credits} س.م`
    ).join("\n");

    const autText = autList.map((c) =>
      `- [ID:${c.id}] ${c.course_code} | ${c.course_name_ar}${c.course_name_en ? ` / ${c.course_name_en}` : ""} (${c.credits} س.م)${c.description_ar ? `: ${c.description_ar.slice(0, 200)}` : ""}`
    ).join("\n");

    const systemPrompt = `أنت خبير أكاديمي في معادلة المواد بين الجامعات السعودية وجامعة العقبة للتكنولوجيا (AUT).

مهمتك: لكل مادة من مواد الطالب السعودية أدناه، اقترح أفضل مادة AUT مطابقة (إن وجدت) بناءً على الاسم والمحتوى والساعات.
- نسبة التطابق ≥ 70٪ → اقترح المعادلة.
- إذا لم تجد مطابقة قوية، لا تقترح شيئاً لتلك المادة.
- يمكن دمج عدة مواد طالب في مادة AUT واحدة إذا كان مجموع ساعاتها يقارب ساعات AUT والمحتوى مكمّل.
- لا تقترح نفس مادة AUT لأكثر من مجموعة.
- استخدم ID المعطى بالضبط كما هو.

مواد الطالب (غير المربوطة):
${sourceText}

كتالوج مواد AUT:
${autText}`;

    const tools = [{
      type: "function",
      function: {
        name: "submit_matches",
        description: "إرجاع قائمة المعادلات المقترحة",
        parameters: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_item_ids: { type: "array", items: { type: "string" }, description: "معرّفات مواد الطالب" },
                  aut_course_id: { type: "string", description: "معرّف مادة AUT المقترحة" },
                  similarity: { type: "number", description: "نسبة التطابق 0-100" },
                  reasoning: { type: "string", description: "سبب المطابقة بالعربية، جملة قصيرة" },
                },
                required: ["source_item_ids", "aut_course_id", "similarity", "reasoning"],
                additionalProperties: false,
              },
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "قم بمعادلة كل مادة طالب مع أفضل مادة AUT مطابقة، ثم أعد النتيجة عبر الدالة." },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "submit_matches" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      const status = aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500;
      const msg = aiRes.status === 429 ? "تم تجاوز الحد المسموح" : aiRes.status === 402 ? "نفد رصيد AI" : "خطأ في خدمة الذكاء الاصطناعي";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("استجابة AI غير صالحة");
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    const suggestions: any[] = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    // Validate + insert
    const validItemIds = new Set(unlinkedItems.map((i) => i.id));
    const validAutIds = new Map(autList.map((c) => [c.id, c] as const));
    const usedItemIds = new Set<string>();
    const usedAutIds = new Set<string>(linkedAutIds);
    const itemById = new Map(unlinkedItems.map((i) => [i.id, i] as const));

    const rows: any[] = [];
    for (const s of suggestions) {
      const aut = validAutIds.get(s.aut_course_id);
      if (!aut) continue;
      if (usedAutIds.has(aut.id)) continue;
      const sourceIds: string[] = (s.source_item_ids || []).filter(
        (sid: string) => validItemIds.has(sid) && !usedItemIds.has(sid)
      );
      if (sourceIds.length === 0) continue;
      const totalCredits = sourceIds.reduce((sum, sid) => sum + Number(itemById.get(sid)?.source_credits || 0), 0);
      sourceIds.forEach((sid) => usedItemIds.add(sid));
      usedAutIds.add(aut.id);
      rows.push({
        request_id,
        aut_course_id: aut.id,
        source_item_ids: sourceIds,
        total_source_credits: totalCredits,
        aut_credits: aut.credits,
        similarity: Math.max(0, Math.min(100, Number(s.similarity) || 0)),
        verdict: "pending",
        is_manual: false,
        notes: s.reasoning ? `🤖 اقتراح AI: ${s.reasoning}` : "🤖 اقتراح AI",
      });
    }

    if (rows.length === 0) {
      return new Response(JSON.stringify({ created: 0, message: "لم يجد AI مطابقات قوية" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insErr } = await admin.from("equivalency_matches").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ created: rows.length, suggestions: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
