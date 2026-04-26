import jsPDF from "jspdf";
import {
  drawBrandedHeader,
  drawFooter,
  drawSeal,
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

/** Ensure there is enough vertical space; otherwise add a new page (no header redraw). */
function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number, pageH: number): number {
  if (y + needed > pageH - 60) {
    drawFooter(doc, doc.getNumberOfPages(), 0);
    doc.addPage();
    return margin + 10;
  }
  return y;
}

/** Draws a single course block: name → description → decision badge → notes/reason box. */
function drawCourseCard(
  doc: jsPDF,
  opts: {
    x: number;
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
  const { x, width, index, name, description, status, notes, pageH, margin } = opts;
  let { y } = opts;

  // --- Wrap text to compute card height -------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const nameLines = doc.splitTextToSize(name, width - 28) as string[];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(description, width - 28) as string[];
  const descShown = descLines.slice(0, 4);

  const hasNotes = !!notes.trim();
  let notesLines: string[] = [];
  if (hasNotes) {
    doc.setFontSize(9);
    notesLines = doc.splitTextToSize(notes, width - 44) as string[];
    notesLines = notesLines.slice(0, 5);
  }

  const headerRowH = 30;
  const nameH = nameLines.slice(0, 2).length * 14 + 6;
  const descH = descShown.length * 12 + 8;
  const notesBoxH = hasNotes ? notesLines.length * 12 + 30 : 0;
  const totalH = headerRowH + nameH + descH + notesBoxH + 22;

  y = ensureSpace(doc, y, totalH, margin, pageH);

  // --- Card background -------------------------------------------------------
  const border: [number, number, number] =
    status === "approved" ? [38, 170, 90] : status === "rejected" ? [220, 60, 60] : [200, 200, 210];
  doc.setFillColor(252, 253, 255);
  doc.setDrawColor(...border);
  doc.setLineWidth(1.4);
  doc.roundedRect(x, y, width, totalH, 6, 6, "FD");
  doc.setLineWidth(0.4);

  // --- Header row: "Course #N"  +  status badge -----------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 50, 110);
  doc.text(`Course #${index + 1}`, x + 14, y + 20);

  const decLabel =
    status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING";
  const labelW = doc.getTextWidth(decLabel) + 24;
  drawStatusBadge(doc, x + width - 14 - labelW, y + 20, decLabel, status);

  let cy = y + headerRowH + 10;

  // --- Course name -----------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 50);
  for (const line of nameLines.slice(0, 2)) {
    doc.text(line, x + 14, cy);
    cy += 14;
  }
  cy += 4;

  // --- Description -----------------------------------------------------------
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 90);
  for (const line of descShown) {
    doc.text(line, x + 14, cy);
    cy += 12;
  }
  cy += 6;

  // --- Notes / reason box (only when notes exist) ----------------------------
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
    doc.roundedRect(x + 14, boxY, width - 28, boxH, 4, 4, "FD");

    const heading =
      status === "rejected"
        ? "Reason for rejection"
        : status === "approved"
        ? "Approval notes"
        : "Supervisor notes";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(
      status === "rejected" ? 150 : status === "approved" ? 20 : 150,
      status === "rejected" ? 30 : status === "approved" ? 110 : 90,
      status === "rejected" ? 30 : status === "approved" ? 50 : 0,
    );
    doc.text(heading, x + 22, boxY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 70);
    let ny = boxY + 28;
    for (const line of notesLines) {
      doc.text(line, x + 22, ny);
      ny += 12;
    }
  }

  return y + totalH + 10;
}

/** Final page: full text of the supervisor's last message. */
function drawSupervisorMessagePage(
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
  let y = drawBrandedHeader({
    doc,
    logo,
    title: "Final Supervisor Message",
    subtitle: "Official communication from the Academic Equivalency Committee",
    topBadge: "ATTACHED",
  });

  // Header info row
  doc.setFillColor(247, 250, 253);
  doc.setDrawColor(220, 220, 230);
  const infoH = 80;
  doc.roundedRect(margin, y, contentW, infoH, 6, 6, "FD");

  let yy = y + 20;
  yy = drawInfoRow(doc, "Supervisor:", `Dr. ${reviewer}`, margin, yy, contentW);
  yy = drawInfoRow(doc, "Decision date:", formatDate(data.reviewedAt) || "—", margin, yy, contentW);
  yy = drawInfoRow(doc, "Request ID:", data.requestId.slice(0, 8).toUpperCase(), margin, yy, contentW);
  y += infoH + 16;

  // Main message
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 50, 110);
  doc.text("Message", margin, y);
  y += 14;

  const msg = safePdfNotes(data.adminNotes, data.status);
  const lines = doc.splitTextToSize(msg, contentW - 24) as string[];
  const msgH = Math.max(80, lines.length * 14 + 28);
  doc.setFillColor(252, 252, 254);
  doc.setDrawColor(210, 210, 220);
  doc.roundedRect(margin, y, contentW, msgH, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  let my = y + 20;
  for (const line of lines) {
    if (my > pageH - 90) break;
    doc.text(line, margin + 12, my);
    my += 14;
  }
  y += msgH + 18;

  // Per-course notes (batch only)
  const batch = data.batchCourses ?? [];
  const perCourse = batch.filter((c) => c.decision?.notes && c.decision.notes.trim());
  if (perCourse.length > 0) {
    y = ensureSpace(doc, y, 40, margin, pageH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 50, 110);
    doc.text("Per-course notes", margin, y);
    y += 14;

    perCourse.forEach((c, i) => {
      const idx = batch.indexOf(c);
      const courseName = safePdfCourseTitle(c.saudi_course_name, idx);
      const noteText = safePdfText(c.decision?.notes, "");
      if (!noteText || noteText === "—") return;

      const wrapped = doc.splitTextToSize(noteText, contentW - 28) as string[];
      const blockH = 26 + wrapped.slice(0, 4).length * 12;
      y = ensureSpace(doc, y, blockH + 8, margin, pageH);

      const decStatus = c.decision?.status ?? "pending";
      const border: [number, number, number] =
        decStatus === "approved" ? [38, 170, 90] : decStatus === "rejected" ? [220, 60, 60] : [200, 200, 210];
      doc.setFillColor(252, 253, 255);
      doc.setDrawColor(...border);
      doc.roundedRect(margin, y, contentW, blockH, 4, 4, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 50);
      doc.text(`#${idx + 1} — ${courseName}`.slice(0, 90), margin + 12, y + 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 80);
      let ny = y + 30;
      for (const line of wrapped.slice(0, 4)) {
        doc.text(line, margin + 12, ny);
        ny += 12;
      }
      y += blockH + 8;
    });
  }

  // Signature + seal
  y = ensureSpace(doc, y, 90, margin, pageH);
  y = pageH - 130;
  doc.setDrawColor(150, 150, 160);
  doc.line(margin, y + 32, margin + 240, y + 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text("Signed by:", margin, y + 14);
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(`Dr. ${reviewer}`, margin, y + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(safePdfText(data.reviewerEmail, "committee@aut.edu.jo"), margin, y + 46);

  drawSeal(doc, pageW - margin - 50, y + 35);
}

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
    // ============ BATCH: course-by-course decisions ============
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 50, 110);
    doc.text(
      `Committee Decisions (${data.batchCourses!.length} courses)`,
      margin,
      y,
    );
    y += 16;

    data.batchCourses!.forEach((c, idx) => {
      const decStatus = c.decision?.status ?? "pending";
      const courseName = safePdfCourseTitle(c.saudi_course_name, idx);
      const description = safePdfCourseSummary(c.summary, c.matched_aut_name, c.similarity);
      const notes = safePdfText(c.decision?.notes, "");
      const safeNotes = notes === "—" ? "" : notes;

      y = drawCourseCard(doc, {
        x: margin,
        y,
        width: contentW,
        index: idx,
        name: courseName,
        description,
        status: decStatus,
        notes: safeNotes,
        pageH,
        margin,
      });
    });

    y += 8;
  } else {
    // ============ SINGLE COURSE ============
    const courseName = safePdfCourseTitle(data.saudiCourseName, 0);
    const description = safePdfCourseSummary(
      data.saudiCourseDescription,
      data.matchedName,
      data.similarity,
    );
    const notes = safePdfNotes(data.adminNotes, data.status);

    y = drawCourseCard(doc, {
      x: margin,
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

  // ============ SIGNATURE + SEAL on last content page ============
  y = ensureSpace(doc, y, 90, margin, pageH);

  doc.setDrawColor(150, 150, 160);
  doc.line(margin, y + 32, margin + 220, y + 32);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text("Approved by:", margin, y + 14);
  doc.setFontSize(11);
  doc.setTextColor(20, 30, 60);
  doc.text(`Dr. ${safeReviewer}`, margin, y + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 130);
  doc.text(safePdfText(data.reviewerEmail, "committee@aut.edu.jo"), margin, y + 44);
  doc.text(`Decision date: ${formatDate(data.reviewedAt) || "—"}`, margin, y + 58);

  drawSeal(doc, pageW - margin - 50, y + 35);

  // ============ FINAL PAGE: supervisor's full message ============
  drawSupervisorMessagePage(doc, data, logo, margin, contentW, pageW, pageH, safeReviewer);

  // ============ Footers ============
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, p, total);
  }

  doc.save(`AUT-Equivalency-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}

// drawText is intentionally re-exported (some legacy callers use it).
export { drawText };
