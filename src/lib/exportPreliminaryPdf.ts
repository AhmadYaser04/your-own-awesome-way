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
  /** اسم/وصف المادة كما أدخلها أو استخرجها النظام من الملف */
  saudi_course: string;
  matches: PreliminaryMatch[];
  verdict: string;        // "تُعادَل" | "تُعادَل بشروط" | "لا تُعادَل"
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

/**
 * يُنشئ تقرير PDF أولي (غير رسمي) للطالب فور انتهاء تحليل الذكاء الاصطناعي.
 * يدعم مادة واحدة أو عدة مواد دفعةً واحدة (تخصص كامل).
 * يحتوي تنبيهاً صريحاً بأنه نتيجة مبدئية بانتظار اعتماد المرشد الأكاديمي.
 */
export async function exportPreliminaryPdf(data: PreliminaryPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const logo = await getLogoDataUrl();

  const isBatch = data.courses.length > 1;
  const drawHeader = () =>
    drawBrandedHeader({
      doc,
      logo,
      title: isBatch
        ? `PRELIMINARY BATCH EQUIVALENCY REPORT (${data.courses.length} courses)`
        : "PRELIMINARY EQUIVALENCY REPORT",
      subtitle: "تقرير مبدئي - بانتظار اعتماد المرشد الأكاديمي الرسمي",
      topBadge: "PRELIMINARY",
    });

  let y = drawHeader();
  drawStatusBadge(doc, margin, y, "PRELIMINARY - غير رسمي", "preliminary");
  y += 28;

  // مربع بيانات
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  doc.roundedRect(margin, y, pageW - margin * 2, 90, 6, 6, "F");
  doc.setFontSize(9);
  let yy = y + 22;
  const labelX = margin + 14;
  const valueX = margin + 150;
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 90);
    doc.text(label, labelX, yy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 30, 60);
    const lines = doc.splitTextToSize(value || "—", pageW - valueX - margin);
    doc.text(lines, valueX, yy);
    yy += Math.max(14, lines.length * 12);
  };
  row("Student:", data.studentName || "—");
  row("Email:", data.studentEmail || "—");
  row("Saudi University:", data.saudiUniversity || "—");
  row("Generated:", formatDate(data.generatedAt));
  y = Math.max(y + 90, yy) + 14;

  // تحذير
  doc.setFillColor(255, 245, 220);
  doc.setDrawColor(230, 170, 30);
  doc.roundedRect(margin, y, pageW - margin * 2, 60, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(150, 90, 0);
  doc.text("IMPORTANT NOTICE | تنبيه مهم", margin + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 60, 30);
  const noticeLines = doc.splitTextToSize(
    "هذا تقرير مبدئي تم توليده بواسطة محرك الذكاء الاصطناعي. النتيجة النهائية الرسمية تتطلب اعتماد المرشد الأكاديمي / لجنة المعادلات بجامعة العقبة للتكنولوجيا. " +
      "This is a preliminary AI-generated report. Official approval requires review by the AUT Academic Advisor.",
    pageW - margin * 2 - 28
  );
  doc.text(noticeLines.slice(0, 3), margin + 14, y + 34);
  y += 72;

  // ملخص الدفعة
  if (isBatch) {
    const approved = data.courses.filter((c) => c.verdict === "تُعادَل").length;
    const conditional = data.courses.filter((c) => c.verdict === "تُعادَل بشروط").length;
    const rejected = data.courses.filter((c) => c.verdict === "لا تُعادَل").length;

    doc.setFillColor(238, 248, 255);
    doc.setDrawColor(60, 140, 220);
    doc.roundedRect(margin, y, pageW - margin * 2, 80, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 80, 160);
    doc.setFontSize(10);
    doc.text("BATCH SUMMARY | ملخص الدفعة", margin + 14, y + 18);
    const cellW = (pageW - margin * 2 - 28) / 4;
    const drawCell = (i: number, val: number, lbl: string, color: [number, number, number]) => {
      const cx = margin + 14 + i * cellW;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...color);
      doc.text(String(val), cx, y + 48);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      doc.text(lbl, cx, y + 64);
    };
    drawCell(0, data.courses.length, "Total Courses", [20, 80, 160]);
    drawCell(1, approved, "Equivalent (>=75%)", [38, 170, 90]);
    drawCell(2, conditional, "Conditional (60-74%)", [230, 170, 30]);
    drawCell(3, rejected, "Not Equivalent (<60%)", [220, 80, 80]);
    y += 92;
  }

  // كل مادة
  data.courses.forEach((c, idx) => {
    const blockH = 175;
    if (y + blockH > pageH - 50) {
      drawFooter(doc, doc.getNumberOfPages(), 0);
      doc.addPage();
      y = drawHeader();
    }

    // ترويسة المادة
    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(200, 210, 230);
    doc.roundedRect(margin, y, pageW - margin * 2, blockH, 6, 6, "FD");

    // رقم المادة + الاسم
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 50, 110);
    doc.text(`Course #${idx + 1}`, margin + 14, y + 18);

    // verdict badge
    const verdictType: "approved" | "rejected" | "pending" =
      c.verdict === "تُعادَل" ? "approved" : c.verdict === "لا تُعادَل" ? "rejected" : "pending";
    const verdictLabel =
      c.verdict === "تُعادَل" ? "EQUIVALENT" : c.verdict === "لا تُعادَل" ? "NOT EQUIVALENT" : "CONDITIONAL";
    drawStatusBadge(doc, pageW - margin - 130, y + 18, verdictLabel, verdictType);

    // اسم المادة السعودية
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    const srcLines = doc.splitTextToSize(
      `Source: ${c.saudi_course.split("\n")[0].slice(0, 90)}`,
      pageW - margin * 2 - 28
    );
    doc.text(srcLines.slice(0, 1), margin + 14, y + 38);

    // أفضل تطابق
    const top = c.matches[0];
    if (top) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 80, 160);
      doc.text(`-> AUT: ${top.aut_code} - ${top.aut_name}`, margin + 14, y + 60);

      // شريط النسبة
      drawSimilarityBar(
        doc,
        margin + 14,
        y + 72,
        pageW - margin * 2 - 28,
        c.overall_similarity
      );

      // التبرير
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 100);
      const reasonLines = doc.splitTextToSize(
        `Reasoning: ${top.reasoning.slice(0, 280)}`,
        pageW - margin * 2 - 28
      );
      doc.text(reasonLines.slice(0, 4), margin + 14, y + 110);

      // ملخص
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 80);
      const sumLines = doc.splitTextToSize(
        `Summary: ${c.summary.slice(0, 240)}`,
        pageW - margin * 2 - 28
      );
      doc.text(sumLines.slice(0, 2), margin + 14, y + 152);
    }

    y += blockH + 10;
  });

  // التذييل لكل الصفحات
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
