import jsPDF from "jspdf";
import logoUrl from "@/assets/aut-logo-official.png";

/**
 * PDF helpers for AUT official documents.
 * NOTE: All generated PDFs are in ENGLISH ONLY to avoid Arabic font/RTL rendering
 * issues with jsPDF's built-in fonts. The rest of the website remains in Arabic.
 */

/** Backwards-compatible no-op (kept so callers don't need refactoring). */
export function ensureArabicFont(doc: jsPDF) {
  doc.setFont("helvetica", "normal");
}

/** Backwards-compatible identity (no Arabic shaping needed for English PDFs). */
export function shapeForDraw(text: string): string {
  return text ?? "";
}

/** Wrap text on word boundaries to fit maxWidth. */
export function wrapArabic(doc: jsPDF, text: string, maxWidth: number): string[] {
  if (!text) return [];
  doc.setFont("helvetica", "normal");
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/** Draw text with optional alignment, wrap, and bold. English-first. */
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
    lineHeight?: number;
  } = {}
) {
  if (!text) return;
  const { align = "left", maxWidth, bold = false, lineHeight = 14 } = opts;
  doc.setFont("helvetica", bold ? "bold" : "normal");
  if (maxWidth) {
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    let yy = y;
    for (const line of lines) {
      doc.text(line, x, yy, { align });
      yy += lineHeight;
    }
  } else {
    doc.text(text, x, y, { align });
  }
}

// Cache for the university logo
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
  title: string;     // English title
  subtitle: string;  // English subtitle
  topBadge?: string; // short English badge
}

/** Draws the official header (blue band + logo + titles). Returns Y after the header. */
export function drawBrandedHeader(opts: BrandedHeaderOpts): number {
  const { doc, logo, title, subtitle, topBadge } = opts;
  const pageW = doc.internal.pageSize.getWidth();
  const headerH = 110;

  // Main university-color band
  doc.setFillColor(20, 50, 110);
  doc.rect(0, 0, pageW, headerH, "F");
  // Thin gold accent strip
  doc.setFillColor(230, 170, 30);
  doc.rect(0, headerH, pageW, 5, "F");

  // Official university logo (top-left for LTR English layout)
  if (logo) {
    try {
      doc.addImage(logo, "PNG", 28, 18, 70, 70, undefined, "FAST");
    } catch {
      /* ignore */
    }
  }

  // University text block (next to the logo, left-aligned)
  const textX = 110;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Aqaba University of Technology", textX, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Faculty of Information Technology", textX, 56);
  doc.text("Academic Course Equivalency Committee", textX, 72);

  // Top badge (top-right)
  if (topBadge) {
    doc.setFillColor(230, 170, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const tw = doc.getTextWidth(topBadge) + 24;
    doc.roundedRect(pageW - 28 - tw, 22, tw, 22, 4, 4, "F");
    doc.setTextColor(50, 30, 0);
    doc.text(topBadge, pageW - 28 - tw + 12, 38);
  }

  // Report title (below the band, left-aligned)
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

/** Standard footer. */
export function drawFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(20, 50, 110);
  doc.rect(0, pageH - 30, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Aqaba University of Technology  ·  Faculty of Information Technology  ·  www.aut.edu.jo",
    pageW / 2,
    pageH - 17,
    { align: "center" }
  );
  doc.text(`Page ${pageNum} / ${totalPages}`, pageW - 28, pageH - 8, { align: "right" });
}

/** Official gold round seal. */
export function drawSeal(doc: jsPDF, x: number, y: number) {
  doc.setDrawColor(220, 160, 30);
  doc.setLineWidth(2.2);
  doc.circle(x, y, 38, "S");
  doc.setLineWidth(0.6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(160, 110, 0);
  doc.text("OFFICIAL SEAL", x, y - 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("AUT", x, y + 1, { align: "center" });
  doc.setFontSize(7);
  doc.text("Equivalency Committee", x, y + 14, { align: "center" });
}

/** Colored status pill. */
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

/** Progress bar with English label. */
export function drawSimilarityBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  similarity: number,
  label = "Similarity"
) {
  const sim = Math.max(0, Math.min(100, similarity || 0));
  doc.setFillColor(220, 230, 240);
  doc.roundedRect(x, y, width, 12, 3, 3, "F");
  const color: [number, number, number] =
    sim >= 75 ? [38, 170, 90] : sim >= 60 ? [230, 170, 30] : [220, 80, 80];
  doc.setFillColor(...color);
  doc.roundedRect(x, y, (width * sim) / 100, 12, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(`${label}: ${Math.round(sim)}%`, x, y + 26);
}

/** Format a date in English (en-GB style, 24h). */
export function formatDate(iso: string | Date): string {
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso;
    return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(iso);
  }
}

/** Renders a single info row "Label: value" (LTR, English). */
export function drawInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  labelWidth = 140
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 90);
  doc.text(label, x + 6, y);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 30, 60);
  const valueX = x + 6 + labelWidth;
  const valueW = width - labelWidth - 12;
  const lines = doc.splitTextToSize(value || "—", valueW) as string[];
  let yy = y;
  for (const line of lines.slice(0, 3)) {
    doc.text(line, valueX, yy);
    yy += 12;
  }
  return Math.max(y + 14, yy);
}
