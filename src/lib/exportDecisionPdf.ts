import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSeal,
  drawSimilarityBar,
  drawStatusBadge,
  formatDate,
  getLogoDataUrl,
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
  reviewerEmail: string;
  reviewedAt: string;
  submittedAt: string;
}

/**
 * Official equivalency-decision PDF (final, signed by AUT Equivalency Committee).
 * النسخة النهائية الرسمية بعد توقيع المرشد الأكاديمي.
 */
export async function exportDecisionPdf(data: DecisionPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const logo = await getLogoDataUrl();

  // الترويسة الرسمية مع الشعار
  let y = drawBrandedHeader({
    doc,
    logo,
    title: "OFFICIAL COURSE EQUIVALENCY DECISION",
    subtitle: "القرار النهائي الرسمي لمعادلة المادة الدراسية",
    topBadge: "FINAL DECISION",
  });

  // شارة الحالة
  const statusText = data.status.toUpperCase();
  drawStatusBadge(doc, margin, y, statusText, data.status);
  y += 28;

  // مربع بيانات الطالب
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  doc.roundedRect(margin, y, pageW - margin * 2, 130, 6, 6, "F");
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

  row("Request ID:", data.requestId);
  row("Student:", data.studentName);
  row("Email:", data.studentEmail);
  row("Saudi University:", data.saudiUniversity);
  row("Submitted:", formatDate(data.submittedAt));
  y = Math.max(y + 130, yy) + 14;

  // مربع المادة المصدر
  doc.setFillColor(255, 251, 240);
  doc.setDrawColor(255, 200, 80);
  doc.roundedRect(margin, y, pageW - margin * 2, 90, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 90, 0);
  doc.setFontSize(10);
  doc.text("SAUDI COURSE (SOURCE) | المادة السعودية", margin + 14, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 60);
  doc.setFontSize(12);
  const courseName = data.saudiCourseName || "(unnamed)";
  const cnLines = doc.splitTextToSize(courseName, pageW - margin * 2 - 28);
  doc.text(cnLines, margin + 14, y + 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  const descShort = (data.saudiCourseDescription || "").slice(0, 240);
  const descLines = doc.splitTextToSize(descShort, pageW - margin * 2 - 28);
  doc.text(descLines.slice(0, 3), margin + 14, y + 56);
  y += 100;

  // المادة المعادِلة في AUT
  doc.setFillColor(238, 248, 255);
  doc.setDrawColor(60, 140, 220);
  doc.roundedRect(margin, y, pageW - margin * 2, 96, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 80, 160);
  doc.setFontSize(10);
  doc.text("AUT EQUIVALENT COURSE (TARGET) | المادة المُعادِلة", margin + 14, y + 18);
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 60);
  doc.text(`${data.matchedCode || "—"} - ${data.matchedName || "—"}`, margin + 14, y + 38);
  drawSimilarityBar(doc, margin + 14, y + 54, pageW - margin * 2 - 28, data.similarity);
  y += 110;

  // ملاحظات اللجنة
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 50, 110);
  doc.setFontSize(11);
  doc.text("COMMITTEE NOTES | ملاحظات اللجنة", margin, y);
  y += 14;
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(210, 210, 220);
  const notesText = data.adminNotes?.trim() || "No additional notes provided.";
  const notesLines = doc.splitTextToSize(notesText, pageW - margin * 2 - 24);
  const notesH = Math.max(60, notesLines.length * 12 + 24);
  doc.roundedRect(margin, y, pageW - margin * 2, notesH, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  doc.text(notesLines, margin + 12, y + 18);
  y += notesH + 16;

  // التوقيع + الختم
  if (y > pageH - 130) {
    doc.addPage();
    y = margin;
  }
  doc.setDrawColor(150, 150, 160);
  doc.line(margin, y + 30, margin + 220, y + 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text("Reviewed by:", margin, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 70);
  doc.text(data.reviewerEmail || "—", margin, y + 28);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(`Decision date: ${formatDate(data.reviewedAt) || "—"}`, margin, y + 44);

  drawSeal(doc, pageW - margin - 50, y + 25);

  drawFooter(doc, 1, 1);

  doc.save(`AUT-Final-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}
