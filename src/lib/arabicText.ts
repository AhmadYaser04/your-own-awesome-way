// Helpers لمعالجة النص العربي قبل عرضه في PDF (jsPDF لا يدعم RTL/Shaping تلقائياً).
// نستخدم arabic-reshaper لربط الحروف العربية، ثم bidi-js لإعادة ترتيب اتجاه الأحرف.
import reshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

/** هل النص يحتوي على حرف عربي؟ */
export function containsArabic(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}

/**
 * يجهّز نصاً عربياً (أو مختلطاً) للعرض في PDF:
 *  - يربط الحروف العربية (initial/medial/final)
 *  - يعيد ترتيبها بصرياً من اليمين لليسار
 * يجب أن يُستخدم النص الناتج فقط داخل jsPDF — وليس في DOM.
 */
export function shapeArabic(text: string): string {
  if (!text) return "";
  if (!containsArabic(text)) return text;
  const reshaped = reshaper.convertArabic(text);
  const levels = bidi.getEmbeddingLevels(reshaped, "rtl");
  return bidi.getReorderedString(reshaped, levels);
}

/** يجهّز قائمة أسطر دفعةً واحدة. */
export function shapeLines(lines: string[]): string[] {
  return lines.map((l) => shapeArabic(l));
}
