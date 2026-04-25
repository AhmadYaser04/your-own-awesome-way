import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSimilarityBar,
  drawStatusBadge,
  formatDate,
  getLogoDataUrl,
} from "./pdfHelpers";

export interface PreliminaryMatch {
  aut_code: string;
  aut_name: string;
  similarity: number;
  reasoning: string;
}

export interface PreliminaryCourseResult {
  saudi_course: string;
  matches: PreliminaryMatch[];
  verdict: string; // "تُعادَل" | "تُعادَل بشروط" | "لا تُعادَل"
  overall_similarity: number;
  summary: string;
}

export interface PreliminaryPdfData {
  studentName?: string;
  studentEmail?: string;
  saudiUniversity?: string;
  inputMode: string;
  generatedAt: string;
  courses: PreliminaryCourseResult[];
}

const VERDICT_TYPE = (v: string): "approved" | "rejected" | "pending" =>
  v === "تُعادَل" ? "approved" : v === "لا تُعادَل" ? "rejected" : "pending";

const VERDICT_EN = (v: string): string =>
  v === "تُعادَل"
    ? "EQUIVALENT"
    : v === "لا تُعادَل"
    ? "NOT EQUIVALENT"
    : v === "تُعادَل بشروط"
    ? "CONDITIONAL"
    : v;

/**
 * Preliminary equivalency report (English-only).
 * Generated immediately after AI analysis; supports a single course or a batch.
 */
export async function exportPreliminaryPdf(data: PreliminaryPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const logo = await getLogoDataUrl();

  const isBatch = data.courses.length > 1;
  const drawHeader = () =>
    drawBrandedHeader({
      doc,
      logo,
      title: isBatch
        ? `Preliminary Equivalency Report — ${data.courses.length} Courses`
        : "Preliminary Equivalency Report",
      subtitle: "Unofficial — pending approval by the Academic Equivalency Committee",
      topBadge: "PRELIMINARY",
    });

  let y = drawHeader();

  // "Unofficial" badge + generation date
  const badgeText = "UNOFFICIAL";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const bw = doc.getTextWidth(badgeText) + 24;
  drawStatusBadge(doc, pageW - margin - bw, y, badgeText, "preliminary");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(`Generated: ${formatDate(data.generatedAt)}`, margin, y);
  y += 30;

  // ============ STUDENT INFO ============
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const boxH = 90;
  doc.roundedRect(margin, y, contentW, boxH, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  doc.text("Student Information", margin + 14, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let yy = y + 38;
  const drawRow = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 90);
    doc.text(label, margin + 14, yy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 30, 60);
    doc.text(value || "—", margin + 14 + 110, yy);
    yy += 14;
  };
  drawRow("Name:", data.studentName || "—");
  drawRow("Email:", data.studentEmail || "—");
  drawRow("Saudi University:", data.saudiUniversity || "—");
  y += boxH + 12;

  // ============ NOTICE ============
  doc.setFillColor(255, 245, 220);
  doc.setDrawColor(230, 170, 30);
  const noticeH = 56;
  doc.roundedRect(margin, y, contentW, noticeH, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(150, 90, 0);
  doc.text("Important notice", margin + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 60, 30);
  const noticeLines = doc.splitTextToSize(
    "This is a preliminary report generated automatically by the AI engine. It is not officially endorsed until signed by the academic supervisor and the Equivalency Committee at Aqaba University of Technology.",
    contentW - 28
  ) as string[];
  let ny = y + 34;
  for (const line of noticeLines.slice(0, 2)) {
    doc.text(line, margin + 14, ny);
    ny += 12;
  }
  y += noticeH + 12;

  // ============ BATCH SUMMARY ============
  if (isBatch) {
    const equivalent = data.courses.filter((c) => c.verdict === "تُعادَل").length;
    const conditional = data.courses.filter((c) => c.verdict === "تُعادَل بشروط").length;
    const rejected = data.courses.filter((c) => c.verdict === "لا تُعادَل").length;

    doc.setFillColor(238, 248, 255);
    doc.setDrawColor(60, 140, 220);
    const sumH = 84;
    doc.roundedRect(margin, y, contentW, sumH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 80, 160);
    doc.text("Batch summary", margin + 14, y + 18);

    const cellW = (contentW - 28) / 4;
    const drawCell = (i: number, val: number, lbl: string, color: [number, number, number]) => {
      const cx = margin + 14 + i * cellW + cellW / 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...color);
      doc.text(String(val), cx, y + 50, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      doc.text(lbl, cx, y + 68, { align: "center" });
    };
    drawCell(0, data.courses.length, "Total courses", [20, 80, 160]);
    drawCell(1, equivalent, "Equivalent (>=75%)", [38, 170, 90]);
    drawCell(2, conditional, "Conditional", [230, 170, 30]);
    drawCell(3, rejected, "Not equivalent", [220, 80, 80]);
    y += sumH + 14;
  }

  // ============ COURSE CARDS ============
  data.courses.forEach((c, idx) => {
    const blockH = 165;
    if (y + blockH > pageH - 50) {
      drawFooter(doc, doc.getNumberOfPages(), 0);
      doc.addPage();
      y = drawHeader();
    }

    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(200, 210, 230);
    doc.roundedRect(margin, y, contentW, blockH, 6, 6, "FD");

    // Course number (left) + verdict badge (right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 50, 110);
    doc.text(`Course #${idx + 1}`, margin + 14, y + 20);

    const verdictType = VERDICT_TYPE(c.verdict);
    const verdictLabel = VERDICT_EN(c.verdict);
    const lw = doc.getTextWidth(verdictLabel) + 24;
    drawStatusBadge(doc, pageW - margin - lw, y + 20, verdictLabel, verdictType);

    // Source course
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    const srcName = c.saudi_course.split("\n")[0].slice(0, 110);
    const srcLines = doc.splitTextToSize(`Source: ${srcName}`, contentW - 28) as string[];
    doc.text(srcLines.slice(0, 1), margin + 14, y + 46);

    // Best AUT match
    const top = c.matches[0];
    if (top) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 80, 160);
      const matchLines = doc.splitTextToSize(
        `-> AUT equivalent: ${top.aut_name} (${top.aut_code})`,
        contentW - 28
      ) as string[];
      doc.text(matchLines.slice(0, 1), margin + 14, y + 70);

      drawSimilarityBar(doc, margin + 14, y + 86, contentW - 28, c.overall_similarity);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 80);
      const sumLines = doc.splitTextToSize(
        c.summary || top.reasoning || "",
        contentW - 28
      ) as string[];
      let sy = y + 122;
      for (const line of sumLines.slice(0, 3)) {
        doc.text(line, margin + 14, sy);
        sy += 11;
      }
    }

    y += blockH + 10;
  });

  // ============ FOOTERS ============
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  const fileName = isBatch
    ? `AUT-Preliminary-Batch-${data.courses.length}courses-${new Date().toISOString().slice(0, 10)}.pdf`
    : `AUT-Preliminary-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
