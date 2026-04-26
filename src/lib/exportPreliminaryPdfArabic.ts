import jsPDF from "jspdf";
import {
  ar,
  drawBrandedHeaderAr,
  drawFooterAr,
  drawSimilarityBarAr,
  drawStatusBadgeAr,
  formatDateAr,
  getLogoDataUrlAr,
  registerArabicFont,
  setArFont,
} from "./pdfArabicHelpers";
import type { PreliminaryPdfData } from "./exportPreliminaryPdf";

const VERDICT_TYPE_AR = (v: string): "approved" | "rejected" | "pending" =>
  v === "تُعادَل" ? "approved" : v === "لا تُعادَل" ? "rejected" : "pending";

const VERDICT_LABEL_AR = (v: string): string =>
  v === "تُعادَل" ? "تُعادَل" : v === "لا تُعادَل" ? "لا تُعادَل" : v === "تُعادَل بشروط" ? "تُعادَل بشروط" : v;

/** Preliminary equivalency report — Arabic version. */
export async function exportPreliminaryPdfArabic(data: PreliminaryPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  registerArabicFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const rightX = pageW - margin;
  const logo = await getLogoDataUrlAr();

  const studentName = data.studentName?.trim() || data.studentEmail || "—";
  const studentEmail = data.studentEmail || "—";
  const university = data.saudiUniversity?.trim() || "—";
  const isBatch = data.courses.length > 1;

  const drawHeader = () =>
    drawBrandedHeaderAr({
      doc,
      logo,
      title: isBatch
        ? `تقرير معادلة أولي — ${data.courses.length} مواد`
        : "تقرير معادلة أولي",
      subtitle: "غير رسمي — بانتظار اعتماد لجنة معادلة المساقات",
      topBadge: "أولي",
    });

  let y = drawHeader();

  // Unofficial badge on the LEFT, generation date on the right
  drawStatusBadgeAr(doc, margin, y, "غير رسمي", "preliminary");

  setArFont(doc, "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(ar(`تاريخ الإصدار: ${formatDateAr(data.generatedAt)}`), rightX, y, { align: "right" });
  y += 30;

  // Student info
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const boxH = 90;
  doc.roundedRect(margin, y, contentW, boxH, 6, 6, "FD");
  setArFont(doc, "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  doc.text(ar("معلومات الطالب"), rightX - 14, y + 18, { align: "right" });

  let yy = y + 38;
  const drawRow = (label: string, value: string) => {
    setArFont(doc, "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 90);
    doc.text(ar(label), rightX - 14, yy, { align: "right" });
    setArFont(doc, "normal");
    doc.setTextColor(20, 30, 60);
    doc.text(ar(value || "—"), rightX - 14 - 110, yy, { align: "right" });
    yy += 14;
  };
  drawRow("الاسم:", studentName);
  drawRow("البريد:", studentEmail);
  drawRow("الجامعة السعودية:", university);
  y += boxH + 12;

  // Notice
  doc.setFillColor(255, 245, 220);
  doc.setDrawColor(230, 170, 30);
  const noticeH = 56;
  doc.roundedRect(margin, y, contentW, noticeH, 6, 6, "FD");
  setArFont(doc, "bold");
  doc.setFontSize(10);
  doc.setTextColor(150, 90, 0);
  doc.text(ar("تنبيه هام"), rightX - 14, y + 18, { align: "right" });
  setArFont(doc, "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 60, 30);
  const noticeLines = (doc.splitTextToSize(
    "هذا تقرير أولي تم توليده تلقائياً بواسطة محرك الذكاء الاصطناعي. لا يُعدّ معتمداً رسمياً إلا بعد توقيع المشرف الأكاديمي ولجنة المعادلات في جامعة العقبة للتكنولوجيا.",
    contentW - 28
  ) as string[]).slice(0, 2);
  let ny = y + 34;
  for (const line of noticeLines) {
    doc.text(ar(line), rightX - 14, ny, { align: "right" });
    ny += 12;
  }
  y += noticeH + 12;

  // Batch summary
  if (isBatch) {
    const equivalent = data.courses.filter((c) => c.verdict === "تُعادَل").length;
    const conditional = data.courses.filter((c) => c.verdict === "تُعادَل بشروط").length;
    const rejected = data.courses.filter((c) => c.verdict === "لا تُعادَل").length;

    doc.setFillColor(238, 248, 255);
    doc.setDrawColor(60, 140, 220);
    const sumH = 84;
    doc.roundedRect(margin, y, contentW, sumH, 6, 6, "FD");
    setArFont(doc, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 80, 160);
    doc.text(ar("ملخص الدفعة"), rightX - 14, y + 18, { align: "right" });

    const cellW = (contentW - 28) / 4;
    const drawCell = (i: number, val: number, lbl: string, color: [number, number, number]) => {
      // RTL: cell index 0 on the right
      const cx = rightX - 14 - i * cellW - cellW / 2;
      setArFont(doc, "bold");
      doc.setFontSize(22);
      doc.setTextColor(...color);
      doc.text(String(val), cx, y + 50, { align: "center" });
      setArFont(doc, "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 110);
      doc.text(ar(lbl), cx, y + 68, { align: "center" });
    };
    drawCell(0, data.courses.length, "إجمالي المواد", [20, 80, 160]);
    drawCell(1, equivalent, "تُعادَل (>=75%)", [38, 170, 90]);
    drawCell(2, conditional, "بشروط", [230, 170, 30]);
    drawCell(3, rejected, "لا تُعادَل", [220, 80, 80]);
    y += sumH + 14;
  }

  // Course cards
  data.courses.forEach((c, idx) => {
    const blockH = 165;
    if (y + blockH > pageH - 50) {
      drawFooterAr(doc, doc.getNumberOfPages(), 0);
      doc.addPage();
      y = drawHeader();
    }

    doc.setFillColor(248, 250, 254);
    doc.setDrawColor(200, 210, 230);
    doc.roundedRect(margin, y, contentW, blockH, 6, 6, "FD");

    setArFont(doc, "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 50, 110);
    doc.text(ar(`مادة #${idx + 1}`), rightX - 14, y + 20, { align: "right" });

    const verdictType = VERDICT_TYPE_AR(c.verdict);
    const verdictLabel = VERDICT_LABEL_AR(c.verdict);
    drawStatusBadgeAr(doc, margin + 14, y + 20, verdictLabel, verdictType);

    setArFont(doc, "bold");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 60);
    const srcName = (c.saudi_course || "").split("\n")[0].slice(0, 110);
    doc.text(ar(`المصدر: ${srcName}`), rightX - 14, y + 46, { align: "right" });

    const top = c.matches[0];
    if (top) {
      setArFont(doc, "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 80, 160);
      doc.text(
        ar(`المعادل في AUT: ${top.aut_name || "لا يوجد تطابق مباشر"} (${top.aut_code || "—"})`),
        rightX - 14,
        y + 70,
        { align: "right" }
      );

      drawSimilarityBarAr(doc, margin + 14, y + 86, contentW - 28, c.overall_similarity);

      setArFont(doc, "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 80);
      const sumLines = (doc.splitTextToSize(
        c.summary || top.reasoning || "",
        contentW - 28
      ) as string[]).slice(0, 3);
      let sy = y + 122;
      for (const line of sumLines) {
        doc.text(ar(line), rightX - 14, sy, { align: "right" });
        sy += 11;
      }
    }

    y += blockH + 10;
  });

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooterAr(doc, p, total);
  }

  const fileName = isBatch
    ? `AUT-Preliminary-AR-Batch-${data.courses.length}courses-${new Date().toISOString().slice(0, 10)}.pdf`
    : `AUT-Preliminary-AR-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
