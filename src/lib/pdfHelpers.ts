import jsPDF from "jspdf";
import logoUrl from "@/assets/aut-logo-official.png";
import { AMIRI_REGULAR_BASE64 } from "./amiriFont";
import { shapeArabic, containsArabic } from "./arabicText";

/**
 * أدوات مساعدة لإنشاء ملفات PDF رسمية لجامعة العقبة للتكنولوجيا.
 * - تستخدم خط Amiri لدعم العربية بشكل كامل (ربط الحروف + اتجاه RTL).
 * - تستخدم شعار الجامعة الرسمي.
 */

const FONT_NAME = "Amiri";
const FONT_FILE = "Amiri-Regular.ttf";
let fontRegistered = false;

/** يسجّل خط أميري داخل مستند jsPDF (يُستدعى مرة واحدة لكل مستند). */
export function ensureArabicFont(doc: jsPDF) {
  // jsPDF يحتاج تسجيل الخط داخل كل مستند (VFS مرتبط بالكلاس).
  // نستخدم flag بسيطاً لتجنّب إعادة الإضافة لنفس doc.
  // التحقق إذا الخط مسجّل بالفعل في المستند:
  const list = (doc.getFontList?.() ?? {}) as Record<string, unknown>;
  if (list[FONT_NAME]) return;
  doc.addFileToVFS(FONT_FILE, AMIRI_REGULAR_BASE64);
  doc.addFont(FONT_FILE, FONT_NAME, "normal");
  doc.addFont(FONT_FILE, FONT_NAME, "bold");
  fontRegistered = true;
}

/**
 * يكتب نصاً يحتوي عربية بشكل صحيح (Shaping + RTL).
 * يستخدم خط Amiri تلقائياً للنصوص العربية.
 */
export function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  opts: {
    align?: "left" | "right" | "center";
    maxWidth?: number;
    bold?: boolean;
    rtl?: boolean;
  } = {}
) {
  if (!text) return;
  ensureArabicFont(doc);
  const { align = "left", maxWidth, bold = false } = opts;
  const isAr = containsArabic(text);

  if (isAr) {
    doc.setFont(FONT_NAME, bold ? "bold" : "normal");
    const shaped = shapeArabic(text);
    if (maxWidth) {
      const lines = doc.splitTextToSize(shaped, maxWidth) as string[];
      doc.text(lines, x, y, { align: align === "left" ? "right" : align });
    } else {
      doc.text(shaped, x, y, { align: align === "left" ? "right" : align });
    }
  } else {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      doc.text(lines, x, y, { align });
    } else {
      doc.text(text, x, y, { align });
    }
  }
}

/** يقسم نصاً عربياً إلى أسطر بعد عمل reshape ليناسب maxWidth. */
export function wrapArabic(doc: jsPDF, text: string, maxWidth: number): string[] {
  ensureArabicFont(doc);
  if (!text) return [];
  if (containsArabic(text)) {
    doc.setFont(FONT_NAME, "normal");
    const shaped = shapeArabic(text);
    return doc.splitTextToSize(shaped, maxWidth) as string[];
  }
  doc.setFont("helvetica", "normal");
  return doc.splitTextToSize(text, maxWidth) as string[];
}

// تحميل شعار الجامعة كـ data URL لإدراجه في الـ PDF
let cachedLogo: string | null = null;
export async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogo) return cachedLogo;
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        cachedLogo = reader.result as string;
        resolve(cachedLogo);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface BrandedHeaderOpts {
  doc: jsPDF;
  logo: string | null;
  title: string;     // العنوان الرئيسي (عربي)
  subtitle: string;  // عنوان فرعي (عربي)
  topBadge?: string; // شارة صغيرة (عربي مختصر)
}

/** ترسم رأس الصفحة الرسمي (شريط أزرق + شعار + عناوين). تُعيد Y بعد الرأس. */
export function drawBrandedHeader(opts: BrandedHeaderOpts): number {
  const { doc, logo, title, subtitle, topBadge } = opts;
  ensureArabicFont(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const headerH = 110;

  // شريط رئيسي بلون الجامعة
  doc.setFillColor(20, 50, 110);
  doc.rect(0, 0, pageW, headerH, "F");
  // شريط ذهبي رفيع
  doc.setFillColor(230, 170, 30);
  doc.rect(0, headerH, pageW, 5, "F");

  // الشعار الرسمي للجامعة (أعلى يمين الصفحة لأنّ التصميم RTL)
  if (logo) {
    try {
      doc.addImage(logo, "PNG", pageW - 28 - 70, 18, 70, 70, undefined, "FAST");
    } catch {
      /* تجاهل */
    }
  }

  // النصوص بجانب الشعار (محاذاة لليمين، بحيث تكون بجوار الشعار)
  const textRightX = pageW - 28 - 80; // يسار الشعار
  doc.setTextColor(255, 255, 255);
  drawText(doc, "جامعة العقبة للتكنولوجيا", textRightX, 38, { bold: true, align: "right" });
  doc.setFontSize(10);
  drawText(doc, "كلية تكنولوجيا المعلومات", textRightX, 54, { align: "right" });
  drawText(doc, "لجنة معادلة المواد الأكاديمية", textRightX, 70, { align: "right" });
  doc.setFontSize(16);

  // الشارة العلوية يسار (لأن الشعار يمين)
  if (topBadge) {
    doc.setFillColor(230, 170, 30);
    ensureArabicFont(doc);
    doc.setFont(FONT_NAME, "bold");
    doc.setFontSize(10);
    const shaped = shapeArabic(topBadge);
    const tw = doc.getTextWidth(shaped) + 24;
    doc.roundedRect(28, 22, tw, 22, 4, 4, "F");
    doc.setTextColor(50, 30, 0);
    doc.text(shaped, 28 + 12, 38);
  }

  // عنوان التقرير (تحت الشريط)
  doc.setTextColor(20, 50, 110);
  doc.setFontSize(15);
  drawText(doc, title, pageW - 28, headerH + 35, { bold: true, align: "right" });
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  drawText(doc, subtitle, pageW - 28, headerH + 52, { align: "right" });

  return headerH + 70;
}

/** يرسم تذييل صفحة موحّداً. */
export function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  ensureArabicFont(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(20, 50, 110);
  doc.rect(0, pageH - 30, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  drawText(
    doc,
    "جامعة العقبة للتكنولوجيا · كلية تكنولوجيا المعلومات · www.aut.edu.jo",
    pageW / 2,
    pageH - 17,
    { align: "center" }
  );
  drawText(doc, `صفحة ${pageNum} / ${totalPages}`, 28, pageH - 8, { align: "left" });
}

/** يرسم ختماً ذهبياً رسمياً مدوّراً. */
export function drawSeal(doc: jsPDF, x: number, y: number) {
  ensureArabicFont(doc);
  doc.setDrawColor(220, 160, 30);
  doc.setLineWidth(2.2);
  doc.circle(x, y, 38, "S");
  doc.setLineWidth(0.6);
  doc.setFontSize(7);
  doc.setTextColor(160, 110, 0);
  drawText(doc, "ختم رسمي", x, y - 12, { bold: true, align: "center" });
  drawText(doc, "AUT", x, y, { bold: true, align: "center" });
  drawText(doc, "لجنة المعادلات", x, y + 12, { bold: true, align: "center" });
}

/** شارة حالة ملوّنة. */
export function drawStatusBadge(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  type: "approved" | "rejected" | "pending" | "preliminary"
) {
  ensureArabicFont(doc);
  const colors: Record<string, [number, number, number]> = {
    approved: [38, 170, 90],
    rejected: [220, 60, 60],
    pending: [240, 170, 30],
    preliminary: [60, 120, 200],
  };
  const c = colors[type] ?? [120, 120, 120];
  doc.setFillColor(...c);
  doc.setFont(FONT_NAME, "bold");
  doc.setFontSize(11);
  const shaped = containsArabic(text) ? shapeArabic(text) : text;
  const tw = doc.getTextWidth(shaped) + 24;
  doc.roundedRect(x, y - 14, tw, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(shaped, x + 12, y + 1);
  return tw;
}

/** يرسم شريط نسبة (Progress) مع التسمية بالعربية. */
export function drawSimilarityBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  similarity: number,
  label = "نسبة التطابق"
) {
  ensureArabicFont(doc);
  const sim = Math.max(0, Math.min(100, similarity || 0));
  doc.setFillColor(220, 230, 240);
  doc.roundedRect(x, y, width, 12, 3, 3, "F");
  const color: [number, number, number] =
    sim >= 75 ? [38, 170, 90] : sim >= 60 ? [230, 170, 30] : [220, 80, 80];
  doc.setFillColor(...color);
  doc.roundedRect(x, y, (width * sim) / 100, 12, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  drawText(doc, `${label}: ${Math.round(sim)}%`, x + width, y + 26, { bold: true, align: "right" });
}

/** تنسيق تاريخ ميلادي بالعربية. */
export function formatDate(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString("ar-EG-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

/** يرسم صفّاً من بطاقة بيانات (تسمية: قيمة) بمحاذاة يمينية للعربية. */
export function drawInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  labelWidth = 130
) {
  ensureArabicFont(doc);
  doc.setFontSize(9);
  // التسمية على اليمين
  doc.setTextColor(80, 80, 90);
  drawText(doc, label, x + width - 10, y, { bold: true, align: "right" });
  // القيمة على يسار التسمية
  doc.setTextColor(20, 30, 60);
  const valueW = width - labelWidth - 20;
  const valueRightX = x + width - labelWidth - 10;
  const lines = wrapArabic(doc, value || "—", valueW);
  let yy = y;
  for (const line of lines.slice(0, 3)) {
    doc.text(line, valueRightX, yy, { align: "right" });
    yy += 12;
  }
  return Math.max(y + 14, yy);
}
