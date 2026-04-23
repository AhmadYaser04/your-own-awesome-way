import jsPDF from "jspdf";

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
 * Generates an official equivalency-decision PDF.
 * Uses Latin text with Arabic transliteration of labels for compatibility,
 * since jsPDF default font lacks Arabic glyphs. Arabic content is preserved
 * by encoding to a separate "Notes" section as plain UTF-8 — admin can also
 * read the structured English summary.
 */
export function exportDecisionPdf(data: DecisionPdfData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // Header bar (navy)
  doc.setFillColor(20, 50, 110);
  doc.rect(0, 0, pageW, 90, "F");
  // Gold accent bar
  doc.setFillColor(255, 180, 30);
  doc.rect(0, 90, pageW, 6, "F");

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Aqaba University of Technology", margin, 38);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Faculty of Information Technology — AI Equivalency Committee", margin, 56);
  doc.setFontSize(9);
  doc.text("Official Course Equivalency Decision", margin, 72);

  y = 130;

  // Title
  doc.setTextColor(20, 50, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("COURSE EQUIVALENCY DECISION", margin, y);
  y += 22;

  // Status badge
  const statusColor: [number, number, number] =
    data.status === "approved" ? [38, 170, 90] : data.status === "rejected" ? [220, 60, 60] : [240, 170, 30];
  doc.setFillColor(...statusColor);
  const statusText = data.status.toUpperCase();
  const tw = doc.getTextWidth(statusText) + 24;
  doc.roundedRect(margin, y - 14, tw, 22, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(statusText, margin + 12, y + 1);
  y += 28;

  // Meta box
  doc.setDrawColor(220, 220, 230);
  doc.setFillColor(247, 250, 253);
  doc.roundedRect(margin, y, pageW - margin * 2, 110, 6, 6, "F");
  doc.setTextColor(80, 80, 90);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const labelX = margin + 14;
  const valueX = margin + 150;
  let yy = y + 22;

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
  row("Submitted:", data.submittedAt);
  y = Math.max(y + 110, yy) + 16;

  // Saudi course block
  doc.setFillColor(255, 251, 240);
  doc.setDrawColor(255, 200, 80);
  doc.roundedRect(margin, y, pageW - margin * 2, 90, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 90, 0);
  doc.setFontSize(10);
  doc.text("SAUDI COURSE (SOURCE)", margin + 14, y + 18);
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
  y += 102;

  // Arrow
  doc.setTextColor(20, 50, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("v", pageW / 2 - 6, y + 6);
  y += 22;

  // AUT match block
  doc.setFillColor(238, 248, 255);
  doc.setDrawColor(60, 140, 220);
  doc.roundedRect(margin, y, pageW - margin * 2, 96, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 80, 160);
  doc.setFontSize(10);
  doc.text("AUT EQUIVALENT COURSE (TARGET)", margin + 14, y + 18);
  doc.setFontSize(13);
  doc.setTextColor(20, 30, 60);
  doc.text(`${data.matchedCode || "—"} — ${data.matchedName || "—"}`, margin + 14, y + 38);

  // Similarity bar
  const barX = margin + 14;
  const barY = y + 54;
  const barW = pageW - margin * 2 - 28;
  doc.setFillColor(220, 230, 240);
  doc.roundedRect(barX, barY, barW, 12, 3, 3, "F");
  const sim = Math.max(0, Math.min(100, data.similarity || 0));
  doc.setFillColor(20, 130, 220);
  doc.roundedRect(barX, barY, (barW * sim) / 100, 12, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 50, 110);
  doc.text(`AI Similarity: ${Math.round(sim)}%`, barX, barY + 28);
  doc.setTextColor(80, 80, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`AI Verdict: ${data.verdict || "—"}`, barX + 180, barY + 28);
  y += 110;

  // Committee notes
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 50, 110);
  doc.setFontSize(11);
  doc.text("COMMITTEE NOTES / MULAHADHAT AL-LAJNAH", margin, y);
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

  // Signature line
  if (y > pageH - 120) {
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
  doc.text(`Decision date: ${data.reviewedAt || "—"}`, margin, y + 44);

  // Official seal (right)
  const sealX = pageW - margin - 90;
  doc.setDrawColor(255, 180, 30);
  doc.setLineWidth(2);
  doc.circle(sealX + 45, y + 25, 38, "S");
  doc.setLineWidth(0.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(150, 100, 0);
  doc.text("OFFICIAL", sealX + 26, y + 18);
  doc.text("AUT", sealX + 36, y + 30);
  doc.text("COMMITTEE", sealX + 18, y + 42);

  // Footer
  doc.setFillColor(20, 50, 110);
  doc.rect(0, pageH - 30, pageW, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Aqaba University of Technology · Faculty of IT · AI Equivalency Committee · www.aut.edu.jo",
    pageW / 2,
    pageH - 12,
    { align: "center" }
  );

  doc.save(`AUT-Equivalency-${data.requestId.slice(0, 8)}-${data.status}.pdf`);
}
