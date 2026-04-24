import jsPDF from "jspdf";
import logoUrl from "@/assets/aut-logo-full.jpg";

/**
 * أدوات مساعدة لإنشاء ملفات PDF رسمية لجامعة العقبة للتكنولوجيا.
 * تستخدم خط helvetica المدمج في jsPDF (يدعم اللاتينية فقط).
 * النص العربي يُعرض كصور أو يتم استبداله بمصطلحات لاتينية رسمية.
 */

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
  title: string;        // العنوان الرئيسي
  subtitle: string;     // عنوان فرعي
  topBadge?: string;    // شارة صغيرة فوق العنوان (مثلاً: "تقرير أولي")
}

/** ترسم رأس الصفحة الرسمي (شريط أزرق + شعار + عناوين). تُعيد الإحداثي Y بعد الرأس. */
export function drawBrandedHeader(opts: BrandedHeaderOpts): number {
  const { doc, logo, title, subtitle, topBadge } = opts;
  const pageW = doc.internal.pageSize.getWidth();
  const headerH = 110;

  // شريط أزرق علوي
  doc.setFillColor(20, 50, 110);
  doc.rect(0, 0, pageW, headerH, "F");
  // شريط ذهبي رفيع
  doc.setFillColor(230, 170, 30);
  doc.rect(0, headerH, pageW, 5, "F");

  // الشعار (إن توفر)
  if (logo) {
    try {
      doc.addImage(logo, "JPEG", 28, 18, 70, 70, undefined, "FAST");
    } catch {
      /* تجاهل */
    }
  }

  // النصوص بجانب الشعار
  const textX = logo ? 110 : 28;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Aqaba University of Technology", textX, 38);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Faculty of Information Technology", textX, 54);
  doc.text("AI Equivalency Committee | جامعة العقبة للتكنولوجيا", textX, 68);

  // الشارة العلوية اليمين
  if (topBadge) {
    doc.setFillColor(230, 170, 30);
    const tw = doc.getTextWidth(topBadge) + 24;
    doc.roundedRect(pageW - tw - 28, 22, tw, 22, 4, 4, "F");
    doc.setTextColor(50, 30, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(topBadge, pageW - tw - 16, 36);
  }

  // عنوان التقرير
  doc.setTextColor(20, 50, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(title, 28, headerH + 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  doc.text(subtitle, 28, headerH + 52);

  return headerH + 70;
}

/** يرسم تذييل صفحة موحّداً. */
export function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(20, 50, 110);
  doc.rect(0, pageH - 30, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Aqaba University of Technology - Faculty of IT - www.aut.edu.jo",
    pageW / 2,
    pageH - 17,
    { align: "center" }
  );
  doc.text(`Page ${pageNum} / ${totalPages}`, pageW - 28, pageH - 8, { align: "right" });
}

/** يرسم ختماً ذهبياً رسمياً مدوّراً. */
export function drawSeal(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(220, 160, 30);
  doc.setLineWidth(2.2);
  doc.circle(x, y, 36, "S");
  doc.setLineWidth(0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(160, 110, 0);
  doc.text("OFFICIAL", x, y - 10, { align: "center" });
  doc.text("AUT", x, y + 2, { align: "center" });
  doc.text("COMMITTEE", x, y + 14, { align: "center" });
}

/** شارة حالة ملوّنة. */
export function drawStatusBadge(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  type: "approved" | "rejected" | "pending" | "preliminary"
) {
  const colors: Record<string, [number, number, number]> = {
    approved: [38, 170, 90],
    rejected: [220, 60, 60],
    pending: [240, 170, 30],
    preliminary: [60, 120, 200],
  };
  const c = colors[type] ?? [120, 120, 120];
  doc.setFillColor(...c);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const tw = doc.getTextWidth(text) + 24;
  doc.roundedRect(x, y - 14, tw, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + 12, y + 1);
  return tw;
}

/** يرسم شريط نسبة (Progress) مع التسمية. */
export function drawSimilarityBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  similarity: number,
  label = "AI Similarity"
) {
  const sim = Math.max(0, Math.min(100, similarity || 0));
  doc.setFillColor(220, 230, 240);
  doc.roundedRect(x, y, width, 12, 3, 3, "F");
  // لون الشريط بحسب النسبة
  const color: [number, number, number] =
    sim >= 75 ? [38, 170, 90] : sim >= 60 ? [230, 170, 30] : [220, 80, 80];
  doc.setFillColor(...color);
  doc.roundedRect(x, y, (width * sim) / 100, 12, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(`${label}: ${Math.round(sim)}%`, x, y + 26);
}

/** تنسيق تاريخ ميلادي بسيط بالعربية المختصرة. */
export function formatDate(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}
