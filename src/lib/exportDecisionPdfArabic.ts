import jsPDF from "jspdf";
import {
  ar,
  drawBrandedHeaderAr,
  drawFooterAr,
  drawInfoRowAr,
  drawSealAr,
  drawStatusBadgeAr,
  formatDateAr,
  getLogoDataUrlAr,
  registerArabicFont,
  resolveBatchDecisionBadgeAr,
  setArFont,
} from "./pdfArabicHelpers";
import type { DecisionPdfData } from "./exportDecisionPdf";

const STATUS_LABEL_AR: Record<DecisionPdfData["status"], string> = {
  approved: "مقبول",
  rejected: "مرفوض",
  pending: "قيد المراجعة",
};

function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number, pageH: number): number {
  if (y + needed > pageH - 60) {
    drawFooterAr(doc, doc.getNumberOfPages(), 0);
    doc.addPage();
    return margin + 10;
  }
  return y;
}

/** Single course block, RTL. Right-aligned text, badge on the LEFT side. */
function drawCourseCardAr(
  doc: jsPDF,
  opts: {
    rightX: number; // right edge of the card
    y: number;
    width: number;
    index: number;
    name: string;
    description: string;
    status: "approved" | "rejected" | "pending";
    notes: string;
    pageH: number;
    margin: number;
  }
): number {
  const { rightX, width, index, name, description, status, notes, pageH, margin } = opts;
  let { y } = opts;
  const leftX = rightX - width;

  // Wrap text to compute height
  setArFont(doc, "bold");
  doc.setFontSize(12);
  const nameLines = (doc.splitTextToSize(name, width - 28) as string[]).slice(0, 2);

  setArFont(doc, "normal");
  doc.setFontSize(10);
  const descLines = (doc.splitTextToSize(description, width - 28) as string[]).slice(0, 4);

  const hasNotes = !!notes.trim();
  let notesLines: string[] = [];
  if (hasNotes) {
    doc.setFontSize(9);
    notesLines = (doc.splitTextToSize(notes, width - 44) as string[]).slice(0, 5);
  }

  const headerRowH = 30;
  const nameH = nameLines.length * 14 + 6;
  const descH = descLines.length * 12 + 8;
  const notesBoxH = hasNotes ? notesLines.length * 12 + 30 : 0;
  const totalH = headerRowH + nameH + descH + notesBoxH + 22;

  y = ensureSpace(doc, y, totalH, margin, pageH);

  const border: [number, number, number] =
    status === "approved" ? [38, 170, 90] : status === "rejected" ? [220, 60, 60] : [200, 200, 210];
  doc.setFillColor(252, 253, 255);
  doc.setDrawColor(...border);
  doc.setLineWidth(1.4);
  doc.roundedRect(leftX, y, width, totalH, 6, 6, "FD");
  doc.setLineWidth(0.4);

  // Header row: "مادة #N" on the right + status badge on the left
  setArFont(doc, "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 110);
  doc.text(ar(`مادة #${index + 1}`), rightX - 14, y + 20, { align: "right" });

  const decLabel = STATUS_LABEL_AR[status];
  drawStatusBadgeAr(doc, leftX + 14, y + 20, decLabel, status);

  let cy = y + headerRowH + 10;

  // Course name
  setArFont(doc, "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 50);
  for (const line of nameLines) {
    doc.text(ar(line), rightX - 14, cy, { align: "right" });
    cy += 14;
  }
  cy += 4;

  // Description
  setArFont(doc, "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 90);
  for (const line of descLines) {
    doc.text(ar(line), rightX - 14, cy, { align: "right" });
    cy += 12;
  }
  cy += 6;

  // Notes box
  if (hasNotes) {
    const boxY = cy;
    const boxH = notesLines.length * 12 + 24;
    if (status === "rejected") {
      doc.setFillColor(255, 240, 240);
      doc.setDrawColor(220, 80, 80);
    } else if (status === "approved") {
      doc.setFillColor(238, 250, 240);
      doc.setDrawColor(38, 170, 90);
    } else {
      doc.setFillColor(252, 248, 232);
      doc.setDrawColor(230, 170, 30);
    }
    doc.roundedRect(leftX + 14, boxY, width - 28, boxH, 4, 4, "FD");

    const heading =
      status === "rejected"
        ? "سبب الرفض"
        : status === "approved"
        ? "ملاحظات الاعتماد"
        : "ملاحظات المشرف";
    setArFont(doc, "bold");
    doc.setFontSize(9);
    doc.setTextColor(
      status === "rejected" ? 150 : status === "approved" ? 20 : 150,
      status === "rejected" ? 30 : status === "approved" ? 110 : 90,
      status === "rejected" ? 30 : status === "approved" ? 50 : 0,
    );
    doc.text(ar(heading), rightX - 22, boxY + 14, { align: "right" });

    setArFont(doc, "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 70);
    let ny = boxY + 28;
    for (const line of notesLines) {
      doc.text(ar(line), rightX - 22, ny, { align: "right" });
      ny += 12;
    }
  }

  return y + totalH + 10;
}

function drawSupervisorMessagePageAr(
  doc: jsPDF,
  data: DecisionPdfData,
  logo: string | null,
  margin: number,
  contentW: number,
  pageW: number,
  pageH: number,
  reviewer: string,
) {
  doc.addPage();
  const rightX = pageW - margin;
  let y = drawBrandedHeaderAr({
    doc,
    logo,
    title: "رسالة المشرف الأكاديمي النهائية",
    subtitle: "مراسلة رسمية صادرة عن لجنة معادلة المساقات",
    topBadge: "مرفقة",
  });

  doc.setFillColor(247, 250, 253);
  doc.setDrawColor(220, 220, 230);
  const infoH = 80;
  doc.roundedRect(margin, y, contentW, infoH, 6, 6, "FD");

  let yy = y + 20;
  yy = drawInfoRowAr(doc, "المشرف:", `د. ${reviewer}`, rightX, yy, contentW);
  yy = drawInfoRowAr(doc, "تاريخ القرار:", formatDateAr(data.reviewedAt) || "—", rightX, yy, contentW);
  yy = drawInfoRowAr(doc, "رقم الطلب:", data.requestId.slice(0, 8).toUpperCase(), rightX, yy, contentW);
  y += infoH + 16;

  setArFont(doc, "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 50, 110);
  doc.text(ar("نص الرسالة"), rightX, y, { align: "right" });
  y += 14;

  const fallback =
    data.status === "approved"
      ? "تمت الموافقة على معادلة المساق بعد المراجعة الأكاديمية للسجل المرفوع."
      : data.status === "rejected"
      ? "لم تتم الموافقة على معادلة المساق بعد المراجعة الأكاديمية للسجل المرفوع."
      : "الطلب لا يزال قيد المراجعة الأكاديمية.";
  const msg = data.adminNotes?.trim() ? data.adminNotes : fallback;
  const lines = doc.splitTextToSize(msg, contentW - 24) as string[];
  const msgH = Math.max(80, lines.length * 14 + 28);
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(210, 210, 220);
  doc.roundedRect(margin, y, contentW, msgH, 6, 6, "FD");
  setArFont(doc, "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  let my = y + 20;
  for (const line of lines) {
    if (my > pageH - 90) break;
    doc.text(ar(line), rightX - 12, my, { align: "right" });
    my += 14;
  }
  y += msgH + 18;

  // Per-course notes (batch only)
  const batch = data.batchCourses ?? [];
  const perCourse = batch.filter((c) => c.decision?.notes && c.decision.notes.trim());
  if (perCourse.length > 0) {
    y = ensureSpace(doc, y, 40, margin, pageH);
    setArFont(doc, "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 50, 110);
    doc.text(ar("ملاحظات لكل مادة"), rightX, y, { align: "right" });
    y += 14;

    perCourse.forEach((c) => {
      const idx = batch.indexOf(c);
      const courseName = c.saudi_course_name || `مادة #${idx + 1}`;
      const noteText = (c.decision?.notes ?? "").trim();
      if (!noteText) return;

      const wrapped = (doc.splitTextToSize(noteText, contentW - 28) as string[]).slice(0, 4);
      const blockH = 26 + wrapped.length * 12;
      y = ensureSpace(doc, y, blockH + 8, margin, pageH);

      const decStatus = c.decision?.status ?? "pending";
      const border: [number, number, number] =
        decStatus === "approved" ? [38, 170, 90] : decStatus === "rejected" ? [220, 60, 60] : [200, 200, 210];
      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(...border);
      doc.roundedRect(margin, y, contentW, blockH, 4, 4, "FD");

      setArFont(doc, "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 50);
      doc.text(ar(`#${idx + 1} — ${courseName}`).slice(0, 90), rightX - 12, y + 16, { align: "right" });

      setArFont(doc, "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 80);
      let ny = y + 30;
      for (const line of wrapped) {
        doc.text(ar(line), rightX - 12, ny, { align: "right" });
        ny += 12;
      }
      y += blockH + 8;
    });
  }

  // Signature + seal (signature block on the right)
  y = pageH - 130;
  doc.setDrawColor(150, 150, 160);
  doc.line(rightX - 240, y + 32, rightX, y + 32);
  setArFont(doc, "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(ar("التوقيع:"), rightX, y + 14, { align: "right" });
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(ar(`د. ${reviewer}`), rightX, y + 30, { align: "right" });
  setArFont(doc, "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(data.reviewerEmail || "committee@aut.edu.jo", rightX, y + 46, { align: "right" });

  drawSealAr(doc, margin + 50, y + 35);
}

/** Official equivalency certificate — Arabic version. */
export function exportDecisionPdfArabic(data: DecisionPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  registerArabicFont(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const rightX = pageW - margin;
  const logo = getLogoDataUrlAr();

  const studentName = data.studentName?.trim() || data.studentEmail || "—";
  const studentEmail = data.studentEmail || "—";
  const university = data.saudiUniversity?.trim() || "—";
  const reviewer = data.reviewerName?.trim() || "المشرف الأكاديمي";
  const isBatch = (data.batchCourses?.length ?? 0) > 1;
  const batchBadge = resolveBatchDecisionBadgeAr(data.batchCourses, data.status);

  let y = drawBrandedHeaderAr({
    doc,
    logo,
    title: "شهادة معادلة المساقات",
    subtitle: "قرار رسمي صادر عن لجنة معادلة المساقات الأكاديمية",
    topBadge: "قرار نهائي",
  });

  // Status badge (left side in RTL) + request ID on the right
  const statusLabel = isBatch ? batchBadge.label : STATUS_LABEL_AR[data.status];
  drawStatusBadgeAr(doc, margin, y, statusLabel, isBatch ? batchBadge.type : data.status);

  setArFont(doc, "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(ar(`رقم الطلب: ${data.requestId.slice(0, 8).toUpperCase()}`), rightX, y, { align: "right" });
  y += 30;

  // Student info card
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const studentBoxH = 110;
  doc.roundedRect(margin, y, contentW, studentBoxH, 6, 6, "FD");

  setArFont(doc, "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  doc.text(ar("معلومات الطالب"), rightX - 14, y + 18, { align: "right" });

  let yy = y + 38;
  yy = drawInfoRowAr(doc, "الاسم الكامل:", studentName, rightX, yy, contentW);
  yy = drawInfoRowAr(doc, "البريد الإلكتروني:", studentEmail, rightX, yy, contentW);
  yy = drawInfoRowAr(doc, "الجامعة السعودية:", university, rightX, yy, contentW);
  yy = drawInfoRowAr(doc, "تاريخ التقديم:", formatDateAr(data.submittedAt), rightX, yy, contentW);
  y = Math.max(y + studentBoxH, yy) + 12;

  if (isBatch) {
    setArFont(doc, "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 50, 110);
    doc.text(
      ar(`قرارات اللجنة (${data.batchCourses!.length} مواد)`),
      rightX,
      y,
      { align: "right" }
    );
    y += 16;

    data.batchCourses!.forEach((c, idx) => {
      const decStatus = c.decision?.status ?? "pending";
      const courseName = c.saudi_course_name || `مادة #${idx + 1}`;
      const description =
        c.summary?.trim() ||
        `تمت مراجعة المساق المرفوع مقابل ${c.matched_aut_name || "المنهاج المعتمد"} بنسبة تطابق تقديرية ${Math.round(c.similarity || 0)}%.`;
      const notes = (c.decision?.notes || "").trim();

      y = drawCourseCardAr(doc, {
        rightX,
        y,
        width: contentW,
        index: idx,
        name: courseName,
        description,
        status: decStatus,
        notes,
        pageH,
        margin,
      });
    });
    y += 8;
  } else {
    const courseName = data.saudiCourseName?.trim() || "المساق المُقدَّم";
    const description =
      data.saudiCourseDescription?.trim() ||
      `تمت مراجعة المساق المرفوع مقابل ${data.matchedName || "المنهاج المعتمد"} بنسبة تطابق تقديرية ${Math.round(data.similarity || 0)}%.`;
    const notes = data.adminNotes?.trim() || "";

    y = drawCourseCardAr(doc, {
      rightX,
      y,
      width: contentW,
      index: 0,
      name: courseName,
      description,
      status: data.status,
      notes,
      pageH,
      margin,
    });
    y += 8;
  }

  // Signature + seal on last content page
  y = ensureSpace(doc, y, 90, margin, pageH);
  doc.setDrawColor(150, 150, 160);
  doc.line(rightX - 220, y + 32, rightX, y + 32);
  setArFont(doc, "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(ar("اعتمد القرار من قبل:"), rightX, y + 14, { align: "right" });
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(ar(`د. ${reviewer}`), rightX, y + 30, { align: "right" });
  setArFont(doc, "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(data.reviewerEmail || "committee@aut.edu.jo", rightX, y + 44, { align: "right" });
  doc.text(ar(`تاريخ القرار: ${formatDateAr(data.reviewedAt) || "—"}`), rightX, y + 58, { align: "right" });

  drawSealAr(doc, margin + 50, y + 35);

  drawSupervisorMessagePageAr(doc, data, logo, margin, contentW, pageW, pageH, reviewer);

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooterAr(doc, p, total);
  }

  doc.save(`AUT-Equivalency-AR-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}
