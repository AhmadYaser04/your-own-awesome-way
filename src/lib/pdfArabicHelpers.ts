// Arabic-aware PDF helpers (mirrors pdfHelpers.ts) using a real Arabic font.
import jsPDF from "jspdf";
import logoDataUrl from "@/assets/aut-logo-official.png?inline";
import { shapeArabic, containsArabic } from "./arabicText";
import { notoNaskhRegularBase64 } from "./fonts/notoNaskh_regular";
import { notoNaskhBoldBase64 } from "./fonts/notoNaskh_bold";

const FONT_FAMILY = "NotoNaskhArabic";

/** Register the embedded Noto Naskh Arabic fonts on a jsPDF document.
 * Must be called per-document; jsPDF stores both VFS and font registrations
 * on the document instance, so we always re-register. */
export function registerArabicFont(doc: jsPDF) {
  doc.addFileToVFS("NotoNaskhArabic-Regular.ttf", notoNaskhRegularBase64);
  doc.addFileToVFS("NotoNaskhArabic-Bold.ttf", notoNaskhBoldBase64);
  doc.addFont("NotoNaskhArabic-Regular.ttf", FONT_FAMILY, "normal");
  doc.addFont("NotoNaskhArabic-Bold.ttf", FONT_FAMILY, "bold");
  doc.setFont(FONT_FAMILY, "normal");
}

/** Set the active font (Arabic-capable). */
export function setArFont(doc: jsPDF, weight: "normal" | "bold" = "normal") {
  doc.setFont(FONT_FAMILY, weight);
}

/** Shape any string for proper Arabic rendering inside jsPDF. */
export function ar(text: string | null | undefined): string {
  const s = (text ?? "").toString();
  if (!s) return "";
  return containsArabic(s) ? shapeArabic(s) : s;
}

/** Wrap text and shape every output line. Right-to-left aware. */
export function wrapAr(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  const raw = (doc.splitTextToSize(text, maxWidth) as string[]) ?? [];
  return raw.map((l) => ar(l));
}

/** Format a date in Arabic (Gregorian, ar-EG). */
export function formatDateAr(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

export function getLogoDataUrlAr(): string | null {
  return logoDataUrl || null;
}

export interface BrandedHeaderArOpts {
  doc: jsPDF;
  logo: string | null;
  title: string;
  subtitle: string;
  topBadge?: string;
}

/** Branded Arabic header (RTL: logo on the right, text on the left of the logo). */
export function drawBrandedHeaderAr(opts: BrandedHeaderArOpts): number {
  const { doc, logo, title, subtitle, topBadge } = opts;
  const pageW = doc.internal.pageSize.getWidth();
  const headerH = 130;

  doc.setFillColor(20, 50, 110);
  doc.rect(0, 0, pageW, headerH, "F");
  doc.setFillColor(230, 170, 30);
  doc.rect(0, headerH, pageW, 5, "F");

  // Logo on the right side (RTL layout)
  const logoW = 110;
  const logoH = 62;
  const logoX = pageW - 28 - logoW;
  const logoY = (headerH - logoH) / 2;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", logoX, logoY, logoW, logoH, undefined, "FAST");
    } catch {
      /* ignore */
    }
  }

  // Text block (right-aligned, immediately to the left of the logo)
  const textRightX = logoX - 18;
  doc.setTextColor(255, 255, 255);
  setArFont(doc, "bold");
  doc.setFontSize(15);
  doc.text(ar("جامعة العقبة للتكنولوجيا"), textRightX, headerH / 2 - 10, { align: "right" });
  setArFont(doc, "normal");
  doc.setFontSize(10);
  doc.text(ar("كلية تكنولوجيا المعلومات"), textRightX, headerH / 2 + 8, { align: "right" });
  doc.text(ar("لجنة معادلة المساقات الأكاديمية"), textRightX, headerH / 2 + 22, { align: "right" });

  // Top badge on the LEFT in RTL layout
  if (topBadge) {
    doc.setFillColor(230, 170, 30);
    setArFont(doc, "bold");
    doc.setFontSize(10);
    const shaped = ar(topBadge);
    const tw = doc.getTextWidth(shaped) + 24;
    doc.roundedRect(28, 22, tw, 22, 4, 4, "F");
    doc.setTextColor(50, 30, 0);
    doc.text(shaped, 28 + tw - 12, 38, { align: "right" });
  }

  // Title under the band, right-aligned
  doc.setTextColor(20, 50, 110);
  setArFont(doc, "bold");
  doc.setFontSize(15);
  doc.text(ar(title), pageW - 28, headerH + 35, { align: "right" });
  setArFont(doc, "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 100);
  doc.text(ar(subtitle), pageW - 28, headerH + 52, { align: "right" });

  return headerH + 70;
}

/** Standard Arabic footer. */
export function drawFooterAr(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(20, 50, 110);
  doc.rect(0, pageH - 30, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  setArFont(doc, "normal");
  doc.setFontSize(8);
  doc.text(
    ar("جامعة العقبة للتكنولوجيا  ·  كلية تكنولوجيا المعلومات  ·  www.aut.edu.jo"),
    pageW / 2,
    pageH - 17,
    { align: "center" }
  );
  doc.text(ar(`صفحة ${pageNum} / ${totalPages}`), 28, pageH - 8, { align: "left" });
}

/** Gold round seal (Arabic labels). */
export function drawSealAr(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(220, 160, 30);
  doc.setLineWidth(2.2);
  doc.circle(x, y, 38, "S");
  doc.setLineWidth(0.6);
  setArFont(doc, "bold");
  doc.setFontSize(7);
  doc.setTextColor(160, 110, 0);
  doc.text(ar("ختم رسمي"), x, y - 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("AUT", x, y + 1, { align: "center" });
  doc.setFontSize(7);
  doc.text(ar("لجنة المعادلات"), x, y + 14, { align: "center" });
}

/** Colored status pill (Arabic). */
export function drawStatusBadgeAr(
  doc: jsPDF,
  x: number,
  y: number,
  text: string,
  type: "approved" | "rejected" | "pending" | "preliminary" | "partial"
) {
  const colors: Record<string, [number, number, number]> = {
    approved: [38, 170, 90],
    rejected: [220, 60, 60],
    pending: [240, 170, 30],
    preliminary: [60, 120, 200],
    partial: [20, 80, 160],
  };
  const c = colors[type] ?? [120, 120, 120];
  doc.setFillColor(...c);
  setArFont(doc, "bold");
  doc.setFontSize(11);
  const shaped = ar(text);
  const tw = doc.getTextWidth(shaped) + 24;
  doc.roundedRect(x, y - 14, tw, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(shaped, x + tw - 12, y + 1, { align: "right" });
  return tw;
}

/** Similarity bar with Arabic label. */
export function drawSimilarityBarAr(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  similarity: number,
  label = "نسبة التطابق"
) {
  const sim = Math.max(0, Math.min(100, similarity || 0));
  doc.setFillColor(220, 230, 240);
  doc.roundedRect(x, y, width, 12, 3, 3, "F");
  const color: [number, number, number] =
    sim >= 75 ? [38, 170, 90] : sim >= 60 ? [230, 170, 30] : [220, 80, 80];
  doc.setFillColor(...color);
  // RTL fill: anchor on the right
  const fillW = (width * sim) / 100;
  doc.roundedRect(x + width - fillW, y, fillW, 12, 3, 3, "F");
  setArFont(doc, "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(ar(`${label}: ${Math.round(sim)}%`), x + width, y + 26, { align: "right" });
}

/** Info row "Label: value" (right-aligned, RTL). */
export function drawInfoRowAr(
  doc: jsPDF,
  label: string,
  value: string,
  rightX: number,
  y: number,
  width: number,
  labelWidth = 140
) {
  // Label (gray) on the right
  setArFont(doc, "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 90);
  doc.text(ar(label), rightX - 6, y, { align: "right" });

  // Value (dark) to the left of the label
  setArFont(doc, "normal");
  doc.setTextColor(20, 30, 60);
  const valueRightX = rightX - 6 - labelWidth;
  const valueW = width - labelWidth - 12;
  const lines = (doc.splitTextToSize(value || "—", valueW) as string[]).slice(0, 3);
  let yy = y;
  for (const line of lines) {
    doc.text(ar(line), valueRightX, yy, { align: "right" });
    yy += 12;
  }
  return Math.max(y + 14, yy);
}

/** Pick an Arabic batch decision label. */
export function resolveBatchDecisionBadgeAr(
  courses: Array<{ decision?: { status: "approved" | "rejected" | "pending" } }> | undefined,
  fallback: "approved" | "rejected" | "pending"
): { label: string; type: "approved" | "rejected" | "pending" | "partial" } {
  if (!courses?.length) {
    return {
      label:
        fallback === "approved" ? "مقبول" : fallback === "rejected" ? "مرفوض" : "قيد المراجعة",
      type: fallback,
    };
  }
  const approved = courses.filter((c) => c.decision?.status === "approved").length;
  const rejected = courses.filter((c) => c.decision?.status === "rejected").length;
  if (approved > 0 && rejected > 0) return { label: "قرار مختلط", type: "partial" };
  if (approved === courses.length) return { label: "مقبول", type: "approved" };
  if (rejected === courses.length) return { label: "مرفوض", type: "rejected" };
  return { label: "قيد المراجعة", type: "pending" };
}
