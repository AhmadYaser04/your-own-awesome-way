import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSimilarityBar,
  drawStatusBadge,
  drawText,
  ensureArabicFont,
  formatDate,
  getLogoDataUrl,
  wrapArabic,
  shapeForDraw,
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
  /** قائمة المواد — قد تكون مادة واحدة أو عدة مواد (دفعة) */
  courses: PreliminaryCourseResult[];
}

const VERDICT_TYPE = (v: string): "approved" | "rejected" | "pending" =>
  v === "تُعادَل" ? "approved" : v === "لا تُعادَل" ? "rejected" : "pending";

/**
 * تقرير معادلة أوّلي (غير رسمي) — يُولَّد للطالب فور انتهاء التحليل.
 * يدعم مادة واحدة أو دفعة كاملة (تخصص بكامله).
 */
export async function exportPreliminaryPdf(data: PreliminaryPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const logo = await getLogoDataUrl();
  ensureArabicFont(doc);

  const isBatch = data.courses.length > 1;
  const drawHeader = () =>
    drawBrandedHeader({
      doc,
      logo,
      title: isBatch
        ? `تقرير معادلة أوّلي لمجموعة مواد (${data.courses.length} مادة)`
        : "تقرير معادلة أوّلي",
      subtitle: "غير رسمي — بانتظار اعتماد لجنة المعادلات الأكاديمية",
      topBadge: "أوّلي",
    });

  let y = drawHeader();

  // شارة "غير رسمي" + التاريخ
  drawStatusBadge(doc, pageW - margin - 130, y, "غير رسمي", "preliminary");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  drawText(doc, `تاريخ التوليد: ${formatDate(data.generatedAt)}`, margin, y, { align: "left" });
  y += 30;

  // ============ بيانات الطالب ============
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const boxH = 90;
  doc.roundedRect(margin, y, contentW, boxH, 6, 6, "FD");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  drawText(doc, "بيانات الطالب", pageW - margin - 14, y + 18, { bold: true, align: "right" });
  doc.setFontSize(9);
  let yy = y + 38;
  const drawRow = (label: string, value: string) => {
    doc.setTextColor(80, 80, 90);
    drawText(doc, label, pageW - margin - 14, yy, { bold: true, align: "right" });
    doc.setTextColor(20, 30, 60);
    drawText(doc, value || "—", pageW - margin - 130, yy, { align: "right" });
    yy += 14;
  };
  drawRow("الاسم:", data.studentName || "—");
  drawRow("البريد:", data.studentEmail || "—");
  drawRow("الجامعة:", data.saudiUniversity || "—");
  y += boxH + 12;

  // ============ تنبيه ============
  doc.setFillColor(255, 245, 220);
  doc.setDrawColor(230, 170, 30);
  const noticeH = 56;
  doc.roundedRect(margin, y, contentW, noticeH, 6, 6, "FD");
  doc.setFontSize(10);
  doc.setTextColor(150, 90, 0);
  drawText(doc, "تنبيه مهم", pageW - margin - 14, y + 18, { bold: true, align: "right" });
  doc.setFontSize(9);
  doc.setTextColor(80, 60, 30);
  const noticeLines = wrapArabic(
    doc,
    "هذا تقرير مبدئي تم توليده تلقائياً بواسطة محرك الذكاء الاصطناعي. لا يُعتمد رسمياً إلا بعد توقيع المرشد الأكاديمي ولجنة المعادلات بجامعة العقبة للتكنولوجيا.",
    contentW - 28
  );
  let ny = y + 34;
  for (const line of noticeLines.slice(0, 2)) {
    doc.text(shapeForDraw(line), pageW - margin - 14, ny, { align: "right" });
    ny += 12;
  }
  y += noticeH + 12;

  // ============ ملخص الدفعة (لو أكثر من مادة) ============
  if (isBatch) {
    const equivalent = data.courses.filter((c) => c.verdict === "تُعادَل").length;
    const conditional = data.courses.filter((c) => c.verdict === "تُعادَل بشروط").length;
    const rejected = data.courses.filter((c) => c.verdict === "لا تُعادَل").length;

    doc.setFillColor(238, 248, 255);
    doc.setDrawColor(60, 140, 220);
    const sumH = 84;
    doc.roundedRect(margin, y, contentW, sumH, 6, 6, "FD");
    doc.setFontSize(11);
    doc.setTextColor(20, 80, 160);
    drawText(doc, "ملخص الدفعة", pageW - margin - 14, y + 18, { bold: true, align: "right" });

    const cellW = (contentW - 28) / 4;
    const drawCell = (i: number, val: number, lbl: string, color: [number, number, number]) => {
      // الخلايا من اليمين لليسار
      const cx = pageW - margin - 14 - i * cellW - cellW / 2;
      doc.setFontSize(22);
      doc.setTextColor(...color);
      drawText(doc, String(val), cx, y + 50, { bold: true, align: "center" });
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      drawText(doc, lbl, cx, y + 68, { align: "center" });
    };
    drawCell(0, data.courses.length, "إجمالي المواد", [20, 80, 160]);
    drawCell(1, equivalent, "تُعادَل (≥75%)", [38, 170, 90]);
    drawCell(2, conditional, "تُعادَل بشروط", [230, 170, 30]);
    drawCell(3, rejected, "لا تُعادَل", [220, 80, 80]);
    y += sumH + 14;
  }

  // ============ بطاقة لكل مادة ============
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

    // رقم المادة (يمين)
    doc.setFontSize(10);
    doc.setTextColor(20, 50, 110);
    drawText(doc, `المادة رقم ${idx + 1}`, pageW - margin - 14, y + 20, {
      bold: true,
      align: "right",
    });

    // شارة القرار (يسار)
    const verdictType = VERDICT_TYPE(c.verdict);
    drawStatusBadge(doc, margin + 14, y + 20, c.verdict, verdictType);

    // اسم المادة السعودية
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    const srcName = c.saudi_course.split("\n")[0].slice(0, 90);
    drawText(doc, `المصدر: ${srcName}`, pageW - margin - 14, y + 46, {
      bold: true,
      align: "right",
      maxWidth: contentW - 28,
    });

    // أفضل تطابق
    const top = c.matches[0];
    if (top) {
      doc.setFontSize(11);
      doc.setTextColor(20, 80, 160);
      drawText(
        doc,
        `← المعادِلة في AUT: ${top.aut_name} (${top.aut_code})`,
        pageW - margin - 14,
        y + 70,
        { bold: true, align: "right", maxWidth: contentW - 28 }
      );

      // شريط النسبة
      drawSimilarityBar(doc, margin + 14, y + 86, contentW - 28, c.overall_similarity);

      // ملخص
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 80);
      const sumLines = wrapArabic(doc, c.summary || top.reasoning || "", contentW - 28);
      let sy = y + 122;
      for (const line of sumLines.slice(0, 3)) {
        doc.text(shapeForDraw(line), pageW - margin - 14, sy, { align: "right" });
        sy += 11;
      }
    }

    y += blockH + 10;
  });

  // ============ التذييل لكل الصفحات ============
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
