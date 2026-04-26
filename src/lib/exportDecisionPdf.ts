import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSeal,
  drawSimilarityBar,
  drawStatusBadge,
  drawText,
  drawInfoRow,
  formatDate,
  getLogoDataUrl,
  resolveBatchDecisionBadge,
  safePdfCourseSummary,
  safePdfCourseTitle,
  safePdfNotes,
  safePdfReviewerName,
  safePdfStudentName,
  safePdfText,
  safePdfUniversity,
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
  reviewerName: string;
  reviewerEmail: string;
  reviewedAt: string;
  submittedAt: string;
  /** Set when the request contains multiple courses processed together. */
  batchCourses?: Array<{
    saudi_course_name: string;
    matched_aut_name?: string;
    matched_aut_code?: string;
    similarity: number;
    verdict: string;
    summary?: string;
    decision?: { status: "approved" | "rejected" | "pending"; notes?: string };
  }>;
}

const STATUS_LABEL: Record<DecisionPdfData["status"], string> = {
  approved: "APPROVED",
  rejected: "REJECTED",
  pending: "PENDING REVIEW",
};

/**
 * Official equivalency certificate (English-only output).
 */
export async function exportDecisionPdf(data: DecisionPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const contentW = pageW - margin * 2;
  const logo = await getLogoDataUrl();
  const safeStudentName = safePdfStudentName(data.studentName, data.studentEmail);
  const safeStudentEmail = safePdfText(data.studentEmail, "student@record.local");
  const safeUniversity = safePdfUniversity(data.saudiUniversity);
  const safeReviewer = safePdfReviewerName(data.reviewerName);
  const isBatch = (data.batchCourses?.length ?? 0) > 1;
  const batchBadge = resolveBatchDecisionBadge(data.batchCourses, data.status);

  // ============ HEADER ============
  let y = drawBrandedHeader({
    doc,
    logo,
    title: "Course Equivalency Certificate",
    subtitle: "Official decision issued by the Academic Equivalency Committee",
    topBadge: "FINAL DECISION",
  });

  // Status badge (right) + request ID (left)
  const statusLabel = isBatch ? batchBadge.label : STATUS_LABEL[data.status];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  const sw = doc.getTextWidth(statusLabel) + 24;
  drawStatusBadge(doc, pageW - margin - sw, y, statusLabel, isBatch ? batchBadge.type : data.status);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(`Request ID: ${data.requestId.slice(0, 8).toUpperCase()}`, margin, y);
  y += 30;

  // ============ STUDENT INFO ============
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  const studentBoxH = 110;
  doc.roundedRect(margin, y, contentW, studentBoxH, 6, 6, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 50, 110);
  doc.text("Student Information", margin + 14, y + 18);

  let yy = y + 38;
  yy = drawInfoRow(doc, "Full Name:", safeStudentName, margin, yy, contentW);
  yy = drawInfoRow(doc, "Email:", safeStudentEmail, margin, yy, contentW);
  yy = drawInfoRow(doc, "Saudi University:", safeUniversity, margin, yy, contentW);
  yy = drawInfoRow(doc, "Submitted At:", formatDate(data.submittedAt), margin, yy, contentW);
  y = Math.max(y + studentBoxH, yy) + 12;

  if (isBatch) {
    // ============ BATCH TABLE ============
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 50, 110);
    doc.text(
      `Committee Decisions (${data.batchCourses!.length} courses)`,
      margin,
      y
    );
    y += 16;

    data.batchCourses!.forEach((c, idx) => {
      const decStatus = c.decision?.status ?? "pending";
      const blockH = 110;
      if (y + blockH > pageH - 160) {
        drawFooter(doc, doc.getNumberOfPages(), 0);
        doc.addPage();
        y = margin + 10;
      }

      const border: [number, number, number] =
        decStatus === "approved" ? [38, 170, 90] : decStatus === "rejected" ? [220, 60, 60] : [200, 200, 210];
      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(...border);
      doc.setLineWidth(1.4);
      doc.roundedRect(margin, y, contentW, blockH, 6, 6, "FD");
      doc.setLineWidth(0.4);

      // Card header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(20, 50, 110);
      doc.text(`Course #${idx + 1}`, margin + 14, y + 18);

      const decLabel =
        decStatus === "approved" ? "APPROVED" : decStatus === "rejected" ? "REJECTED" : "PENDING";
      const labelW = doc.getTextWidth(decLabel) + 24;
      drawStatusBadge(doc, pageW - margin - labelW, y + 18, decLabel, decStatus);

      // Saudi course name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 60);
      drawText(doc, `Source: ${safePdfCourseTitle(c.saudi_course_name, idx)}`, margin + 14, y + 42, {
        bold: true, maxWidth: contentW - 28,
      });

      // AUT match
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(20, 80, 160);
      drawText(
        doc,
        `→ AUT Equivalent: ${safePdfText(c.matched_aut_name, "No direct AUT match")} (${safePdfText(c.matched_aut_code, "—")})`,
        margin + 14, y + 60,
        { maxWidth: contentW - 28 }
      );

      // Similarity bar + brief summary
      drawSimilarityBar(doc, margin + 14, y + 76, contentW - 28, c.similarity);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 90);
      const sumLine = safePdfCourseSummary(c.summary, c.matched_aut_name, c.similarity).slice(0, 160);
      if (sumLine) {
        doc.text(sumLine, margin + 14, y + 102);
      }

      y += blockH + 8;
    });

    y += 8;
  } else {
    // ============ SINGLE COURSE ============
    doc.setFillColor(255, 251, 240);
    doc.setDrawColor(255, 200, 80);
    const srcH = 100;
    doc.roundedRect(margin, y, contentW, srcH, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(150, 90, 0);
    doc.text("Source course (Saudi university)", margin + 14, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 30, 60);
    drawText(doc, safePdfCourseTitle(data.saudiCourseName, 0), margin + 14, y + 40, {
      bold: true, maxWidth: contentW - 28,
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 100);
    const descLines = doc.splitTextToSize(
      safePdfCourseSummary(data.saudiCourseDescription, data.matchedName, data.similarity).slice(0, 320),
      contentW - 28
    ) as string[];
    let dy = y + 60;
    for (const line of descLines.slice(0, 3)) {
      doc.text(line, margin + 14, dy);
      dy += 12;
    }
    y += srcH + 12;

    // AUT side
    doc.setFillColor(238, 248, 255);
    doc.setDrawColor(60, 140, 220);
    const tgtH = 110;
    doc.roundedRect(margin, y, contentW, tgtH, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 80, 160);
    doc.text("Equivalent course at Aqaba University of Technology", margin + 14, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 30, 60);
    drawText(doc, `${safePdfText(data.matchedName, "No direct AUT match")} (${safePdfText(data.matchedCode, "—")})`, margin + 14, y + 42, {
      bold: true, maxWidth: contentW - 28,
    });
    drawSimilarityBar(doc, margin + 14, y + 60, contentW - 28, data.similarity, "Similarity");
    y += tgtH + 16;

    // Notes
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 50, 110);
    doc.text("Committee notes", margin, y);
    y += 12;
    doc.setFillColor(252, 252, 254);
    doc.setDrawColor(210, 210, 220);
    const notesText = safePdfNotes(data.adminNotes, data.status);
    const notesLines = doc.splitTextToSize(notesText, contentW - 24) as string[];
    const notesH = Math.max(60, notesLines.length * 14 + 24);
    doc.roundedRect(margin, y, contentW, notesH, 6, 6, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    let ny = y + 18;
    for (const line of notesLines) {
      doc.text(line, margin + 12, ny);
      ny += 14;
    }
    y += notesH + 20;
  }

  // ============ SIGNATURE + SEAL ============
  if (y > pageH - 150) {
    doc.addPage();
    y = margin;
  }

  // Signature line (left)
  doc.setDrawColor(150, 150, 160);
  doc.line(margin, y + 32, margin + 220, y + 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text("Approved by:", margin, y + 14);
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(
    `Dr. ${safeReviewer}`,
    margin, y + 30
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(safePdfText(data.reviewerEmail, "committee@aut.edu.jo"), margin, y + 44);
  doc.text(`Decision date: ${formatDate(data.reviewedAt) || "—"}`, margin, y + 58);

  // Seal (right)
  drawSeal(doc, pageW - margin - 50, y + 35);

  // Final footers
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  doc.save(`AUT-Equivalency-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}
