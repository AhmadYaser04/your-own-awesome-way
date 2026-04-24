import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSeal,
  drawSimilarityBar,
  drawStatusBadge,
  drawText,
  drawInfoRow,
  ensureArabicFont,
  formatDate,
  getLogoDataUrl,
  wrapArabic,
} from "./pdfHelpers";

export interface DecisionPdfData {
  requestId: string;
  studentName: string;
  studentEmail: string;
  saudiUniversity: string;
  saudiCourseName: string;
  saudiCourseDescription: string;
  inputMode: string;
  matchedCode: string;
  matchedName: string;
  similarity: number;
  verdict: string;
  status: "approved" | "rejected" | "pending";
  adminNotes: string;
  reviewerName: string;   // اسم المشرف الموقّع
  reviewerEmail: string;
  reviewedAt: string;
  submittedAt: string;
}

const STATUS_LABEL: Record<DecisionPdfData["status"], string> = {
  approved: "مقبولة ومعتمدة",
  rejected: "مرفوضة",
  pending: "قيد المراجعة",
};

/**
 * شهادة معادلة رسمية موقّعة من لجنة المعادلات.
 * الملف بالكامل بالعربية، يدعم RTL والربط الحرفي بشكل سليم.
 */
export async function exportDecisionPdf(data: DecisionPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const logo = await getLogoDataUrl();
  ensureArabicFont(doc);

  // ============ ترويسة ============
  let y = drawBrandedHeader({
    doc,
    logo,
    title: "شهادة معادلة المادة الدراسية",
    subtitle: "قرار رسمي صادر عن لجنة المعادلات الأكاديمية",
    topBadge: "قرار نهائي",
  });

  // شارة الحالة
  drawStatusBadge(doc, pageW - margin - 140, y, STATUS_LABEL[data.status], data.status);
  // رقم الطلب يسار
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  drawText(doc, `رقم الطلب: ${data.requestId.slice(0, 8).toUpperCase()}`, margin, y, { align: "left" });
  y += 30;

  // ============ بيانات الطالب ============
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const studentBoxH = 110;
  doc.roundedRect(margin, y, contentW, studentBoxH, 6, 6, "FD");
  // عنوان القسم
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  drawText(doc, "بيانات الطالب", pageW - margin - 14, y + 18, { bold: true, align: "right" });

  let yy = y + 38;
  yy = drawInfoRow(doc, "الاسم الكامل:", data.studentName, margin + 8, yy, contentW - 16);
  yy = drawInfoRow(doc, "البريد الإلكتروني:", data.studentEmail, margin + 8, yy, contentW - 16);
  yy = drawInfoRow(doc, "الجامعة السعودية:", data.saudiUniversity, margin + 8, yy, contentW - 16);
  yy = drawInfoRow(doc, "تاريخ تقديم الطلب:", formatDate(data.submittedAt), margin + 8, yy, contentW - 16);
  y = Math.max(y + studentBoxH, yy) + 12;

  // ============ المادة المصدر ============
  doc.setFillColor(255, 251, 240);
  doc.setDrawColor(255, 200, 80);
  const srcH = 100;
  doc.roundedRect(margin, y, contentW, srcH, 6, 6, "FD");
  doc.setFontSize(11);
  doc.setTextColor(150, 90, 0);
  drawText(doc, "المادة المعروضة من الجامعة السعودية", pageW - margin - 14, y + 18, {
    bold: true,
    align: "right",
  });
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 60);
  drawText(doc, data.saudiCourseName || "(بدون اسم)", pageW - margin - 14, y + 40, {
    bold: true,
    align: "right",
    maxWidth: contentW - 28,
  });
  // وصف مختصر
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  const descLines = wrapArabic(doc, (data.saudiCourseDescription || "").slice(0, 320), contentW - 28);
  let dy = y + 60;
  for (const line of descLines.slice(0, 3)) {
    doc.text(line, pageW - margin - 14, dy, { align: "right" });
    dy += 12;
  }
  y += srcH + 12;

  // ============ المادة المعادِلة في AUT ============
  doc.setFillColor(238, 248, 255);
  doc.setDrawColor(60, 140, 220);
  const tgtH = 110;
  doc.roundedRect(margin, y, contentW, tgtH, 6, 6, "FD");
  doc.setFontSize(11);
  doc.setTextColor(20, 80, 160);
  drawText(doc, "المادة المُعادِلة في جامعة العقبة للتكنولوجيا", pageW - margin - 14, y + 18, {
    bold: true,
    align: "right",
  });
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 60);
  drawText(
    doc,
    `${data.matchedName || "—"} (${data.matchedCode || "—"})`,
    pageW - margin - 14,
    y + 42,
    { bold: true, align: "right", maxWidth: contentW - 28 }
  );
  drawSimilarityBar(doc, margin + 14, y + 60, contentW - 28, data.similarity, "نسبة التطابق");
  y += tgtH + 16;

  // ============ ملاحظات اللجنة ============
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  drawText(doc, "ملاحظات لجنة المعادلات", pageW - margin, y, { bold: true, align: "right" });
  y += 12;
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(210, 210, 220);
  const notesText =
    data.adminNotes?.trim() ||
    (data.status === "approved"
      ? "تم اعتماد المعادلة بناءً على تطابق المخرجات التعليمية ومحتوى المادة."
      : data.status === "rejected"
      ? "لم تتم الموافقة على المعادلة لعدم استيفاء معايير التطابق المطلوبة."
      : "لا توجد ملاحظات إضافية.");
  const notesLines = wrapArabic(doc, notesText, contentW - 24);
  const notesH = Math.max(60, notesLines.length * 14 + 24);
  doc.roundedRect(margin, y, contentW, notesH, 6, 6, "FD");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  let ny = y + 18;
  for (const line of notesLines) {
    doc.text(line, pageW - margin - 12, ny, { align: "right" });
    ny += 14;
  }
  y += notesH + 20;

  // ============ التوقيع + الختم ============
  if (y > pageH - 150) {
    doc.addPage();
    y = margin;
  }

  // خط التوقيع (يمين)
  doc.setDrawColor(150, 150, 160);
  doc.line(pageW - margin - 220, y + 32, pageW - margin, y + 32);
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  drawText(doc, "اعتمد القرار:", pageW - margin, y + 14, { bold: true, align: "right" });
  doc.setTextColor(20, 30, 60);
  drawText(
    doc,
    data.reviewerName?.trim() ? `د. ${data.reviewerName}` : "(لم يحدَّد)",
    pageW - margin,
    y + 30,
    { bold: true, align: "right" }
  );
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  drawText(doc, data.reviewerEmail || "", pageW - margin, y + 44, { align: "right" });
  drawText(doc, `تاريخ القرار: ${formatDate(data.reviewedAt) || "—"}`, pageW - margin, y + 58, {
    align: "right",
  });

  // الختم (يسار)
  drawSeal(doc, margin + 50, y + 35);

  drawFooter(doc, 1, 1);

  doc.save(`AUT-Equivalency-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}
