// ============================================================================
// Arabic certificate generator using docx (Microsoft Word .docx).
// Word renders Arabic shaping + RTL natively, which avoids every jsPDF quirk.
// ----------------------------------------------------------------------------
// The output is a fully-formatted .docx file matching the official AUT
// equivalency certificate (header band, student info, per-course decisions,
// supervisor message, signature & seal).
// ============================================================================
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  LevelFormat,
  PageOrientation,
  Footer,
  PageNumber,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import logoDataUrl from "@/assets/aut-logo-official.png?inline";
import type { DecisionPdfData } from "./exportDecisionPdf";

// ---------- helpers ---------------------------------------------------------

const FONT = "Arial"; // Arial reliably renders Arabic on all systems.
const COLOR_PRIMARY = "14326E";
const COLOR_GOLD = "E6AA1E";
const COLOR_GREEN = "26AA5A";
const COLOR_RED = "DC3C3C";
const COLOR_GREY_TEXT = "555566";

const STATUS_LABEL: Record<DecisionPdfData["status"], string> = {
  approved: "مقبول",
  rejected: "مرفوض",
  pending: "قيد المراجعة",
};

const STATUS_COLOR: Record<DecisionPdfData["status"], string> = {
  approved: COLOR_GREEN,
  rejected: COLOR_RED,
  pending: COLOR_GOLD,
};

function formatDateArabic(value?: string | Date | null): string {
  if (!value) return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** A right-to-left, Arial-styled run. */
function arRun(
  text: string,
  opts: { bold?: boolean; color?: string; size?: number } = {}
): TextRun {
  return new TextRun({
    text: text || "",
    bold: opts.bold,
    color: opts.color,
    size: opts.size ?? 22, // half-points → 22 = 11pt
    font: FONT,
    rightToLeft: true,
  });
}

/** A right-to-left paragraph (default body). */
function arParagraph(
  children: TextRun[],
  opts: { spacingAfter?: number; spacingBefore?: number; alignment?: AlignmentType } = {}
): Paragraph {
  return new Paragraph({
    children,
    bidirectional: true,
    alignment: opts.alignment ?? AlignmentType.RIGHT,
    spacing: { after: opts.spacingAfter ?? 80, before: opts.spacingBefore ?? 0 },
  });
}

/** Build a coloured single-cell "shading" row used as a section banner. */
function bannerRow(label: string, fill: string, textColor = "FFFFFF"): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { before: 120, after: 120 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill },
    children: [arRun(label, { bold: true, color: textColor, size: 24 })],
  });
}

/** A "label : value" line where label is bold/grey. */
function infoLine(label: string, value: string): Paragraph {
  return new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [
      arRun(`${label}  `, { bold: true, color: COLOR_GREY_TEXT, size: 20 }),
      arRun(value || "—", { color: "1E1E32", size: 22 }),
    ],
  });
}

// ---------- visual building blocks -----------------------------------------

function buildHeader(): Paragraph[] {
  // Convert the imported base64 PNG to a Uint8Array for ImageRun.
  let logoBytes: Uint8Array | null = null;
  try {
    const base64 = logoDataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    logoBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) logoBytes[i] = binary.charCodeAt(i);
  } catch {
    logoBytes = null;
  }

  const titleRow = new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_PRIMARY },
    children: [
      ...(logoBytes
        ? [
            new ImageRun({
              type: "png",
              data: logoBytes,
              transformation: { width: 90, height: 50 },
              altText: { title: "AUT", description: "AUT Logo", name: "AUT Logo" },
            }),
            new TextRun({ text: "  " }),
          ]
        : []),
      arRun("جامعة العقبة للتكنولوجيا", {
        bold: true,
        color: "FFFFFF",
        size: 32,
      }),
    ],
  });

  const sub1 = new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 40 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_PRIMARY },
    children: [arRun("كلية تكنولوجيا المعلومات", { color: "FFFFFF", size: 22 })],
  });

  const sub2 = new Paragraph({
    bidirectional: true,
    alignment: AlignmentType.RIGHT,
    spacing: { after: 200 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_PRIMARY },
    children: [
      arRun("لجنة معادلة المساقات الأكاديمية", { color: "FFFFFF", size: 22 }),
    ],
  });

  // Gold accent strip
  const goldStrip = new Paragraph({
    spacing: { after: 200 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: COLOR_GOLD },
    children: [new TextRun({ text: " ", size: 6 })],
  });

  return [titleRow, sub1, sub2, goldStrip];
}

function buildTitleBlock(
  data: DecisionPdfData,
  isBatch: boolean,
  badgeLabel: string,
  badgeColor: string
): Paragraph[] {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
      children: [
        arRun("شهادة معادلة المساقات", {
          bold: true,
          color: COLOR_PRIMARY,
          size: 32,
        }),
      ],
    }),
    arParagraph(
      [
        arRun("قرار رسمي صادر عن لجنة معادلة المساقات الأكاديمية", {
          color: COLOR_GREY_TEXT,
          size: 20,
        }),
      ],
      { spacingAfter: 160 }
    ),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: badgeColor },
      children: [
        arRun(`  ${badgeLabel}  `, { bold: true, color: "FFFFFF", size: 22 }),
        new TextRun({
          text: `   رقم الطلب: ${data.requestId.slice(0, 8).toUpperCase()}`,
          size: 18,
          color: "FFFFFF",
          font: FONT,
        }),
      ],
    }),
  ];
}

function buildStudentInfo(data: DecisionPdfData): Paragraph[] {
  return [
    bannerRow("معلومات الطالب", COLOR_PRIMARY),
    infoLine("الاسم الكامل:", data.studentName),
    infoLine("البريد الإلكتروني:", data.studentEmail),
    infoLine("الجامعة السعودية:", data.saudiUniversity),
    infoLine("تاريخ التقديم:", formatDateArabic(data.submittedAt)),
    new Paragraph({ children: [new TextRun(" ")], spacing: { after: 120 } }),
  ];
}

interface CourseCardInput {
  index: number;
  name: string;
  description: string;
  status: "approved" | "rejected" | "pending";
  notes: string;
}

function buildCourseCard(c: CourseCardInput): Paragraph[] {
  const statusLabel = STATUS_LABEL[c.status];
  const statusColor = STATUS_COLOR[c.status];

  const out: Paragraph[] = [];

  // Header line: "Course #N" + status pill
  out.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 160, after: 60 },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: "F2F4F8" },
      children: [
        arRun(`مادة #${c.index + 1}    `, { bold: true, color: COLOR_PRIMARY, size: 22 }),
        new TextRun({
          text: `  ${statusLabel}  `,
          bold: true,
          color: "FFFFFF",
          shading: { type: ShadingType.CLEAR, color: "auto", fill: statusColor },
          font: FONT,
          rightToLeft: true,
        }),
      ],
    })
  );

  out.push(
    arParagraph([arRun(c.name, { bold: true, color: "1E1E32", size: 24 })], {
      spacingAfter: 60,
    })
  );

  if (c.description?.trim()) {
    out.push(
      arParagraph([arRun(c.description.trim(), { color: "464656", size: 20 })], {
        spacingAfter: 80,
      })
    );
  }

  if (c.notes?.trim()) {
    const heading =
      c.status === "rejected"
        ? "سبب الرفض"
        : c.status === "approved"
        ? "ملاحظات الاعتماد"
        : "ملاحظات المشرف";
    const fill =
      c.status === "rejected"
        ? "FFEFEF"
        : c.status === "approved"
        ? "EBF8EF"
        : "FFF7E0";

    out.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        spacing: { before: 60, after: 40 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill },
        children: [arRun(heading, { bold: true, color: statusColor, size: 20 })],
      })
    );
    out.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        spacing: { after: 160 },
        shading: { type: ShadingType.CLEAR, color: "auto", fill },
        children: [arRun(c.notes.trim(), { color: "32324A", size: 20 })],
      })
    );
  }

  return out;
}

function buildCoursesSection(data: DecisionPdfData): Paragraph[] {
  const isBatch = (data.batchCourses?.length ?? 0) > 1;
  const out: Paragraph[] = [];

  if (isBatch) {
    out.push(
      bannerRow(
        `قرارات اللجنة (${data.batchCourses!.length} مواد)`,
        COLOR_PRIMARY
      )
    );
    data.batchCourses!.forEach((c, idx) => {
      out.push(
        ...buildCourseCard({
          index: idx,
          name: c.saudi_course_name || `مادة #${idx + 1}`,
          description:
            (c.summary || "").trim() ||
            `تمت مراجعة المساق المرفوع مقابل ${c.matched_aut_name || "المنهاج المعتمد"} بنسبة تطابق تقديرية ${Math.round(c.similarity || 0)}%.`,
          status: c.decision?.status ?? "pending",
          notes: (c.decision?.notes || "").trim(),
        })
      );
    });
  } else {
    out.push(bannerRow("قرار اللجنة", COLOR_PRIMARY));
    out.push(
      ...buildCourseCard({
        index: 0,
        name: data.saudiCourseName || "المساق المُقدَّم",
        description:
          (data.saudiCourseDescription || "").trim() ||
          `تمت مراجعة المساق المرفوع مقابل ${data.matchedName || "المنهاج المعتمد"} بنسبة تطابق تقديرية ${Math.round(data.similarity || 0)}%.`,
        status: data.status,
        notes: (data.adminNotes || "").trim(),
      })
    );
  }

  return out;
}

function buildSupervisorMessage(data: DecisionPdfData, reviewer: string): Paragraph[] {
  const out: Paragraph[] = [];

  out.push(bannerRow("رسالة المشرف الأكاديمي النهائية", COLOR_PRIMARY));
  out.push(infoLine("المشرف:", `د. ${reviewer}`));
  out.push(infoLine("تاريخ القرار:", formatDateArabic(data.reviewedAt)));
  out.push(infoLine("رقم الطلب:", data.requestId.slice(0, 8).toUpperCase()));

  const fallback =
    data.status === "approved"
      ? "تمت الموافقة على معادلة المساق بعد المراجعة الأكاديمية للسجل المرفوع."
      : data.status === "rejected"
      ? "لم تتم الموافقة على معادلة المساق بعد المراجعة الأكاديمية للسجل المرفوع."
      : "الطلب لا يزال قيد المراجعة الأكاديمية.";
  const msg = data.adminNotes?.trim() ? data.adminNotes.trim() : fallback;

  out.push(
    arParagraph(
      [arRun("نص الرسالة", { bold: true, color: COLOR_PRIMARY, size: 22 })],
      { spacingBefore: 160, spacingAfter: 60 }
    )
  );
  msg
    .split(/\n+/)
    .filter((l) => l.trim())
    .forEach((line) => {
      out.push(
        arParagraph([arRun(line.trim(), { color: "32324A", size: 22 })], {
          spacingAfter: 60,
        })
      );
    });

  // Per-course notes (batch only)
  const perCourse =
    data.batchCourses?.filter(
      (c) => c.decision?.notes && c.decision.notes.trim()
    ) ?? [];

  if (perCourse.length > 0) {
    out.push(
      arParagraph(
        [arRun("ملاحظات لكل مادة", { bold: true, color: COLOR_PRIMARY, size: 22 })],
        { spacingBefore: 200, spacingAfter: 80 }
      )
    );
    perCourse.forEach((c) => {
      const idx = data.batchCourses!.indexOf(c);
      out.push(
        arParagraph(
          [
            arRun(`#${idx + 1} — ${c.saudi_course_name || `مادة #${idx + 1}`}`, {
              bold: true,
              color: "1E1E32",
              size: 20,
            }),
          ],
          { spacingAfter: 40 }
        )
      );
      out.push(
        arParagraph(
          [arRun((c.decision?.notes || "").trim(), { color: "464656", size: 20 })],
          { spacingAfter: 100 }
        )
      );
    });
  }

  return out;
}

function buildSignature(data: DecisionPdfData, reviewer: string): Paragraph[] {
  return [
    new Paragraph({ children: [new TextRun(" ")], spacing: { before: 240 } }),
    arParagraph(
      [arRun("اعتمد القرار من قبل:", { bold: true, color: COLOR_PRIMARY, size: 20 })],
      { spacingAfter: 40 }
    ),
    arParagraph([arRun(`د. ${reviewer}`, { bold: true, size: 24 })], {
      spacingAfter: 40,
    }),
    arParagraph(
      [
        arRun(
          `تاريخ القرار: ${formatDateArabic(data.reviewedAt)}`,
          { color: COLOR_GREY_TEXT, size: 20 }
        ),
      ],
      { spacingAfter: 40 }
    ),
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 12, color: COLOR_GOLD, space: 1 },
      },
      children: [
        arRun("ختم لجنة معادلة المساقات الأكاديمية — جامعة العقبة للتكنولوجيا", {
          bold: true,
          color: COLOR_GOLD,
          size: 18,
        }),
      ],
    }),
  ];
}

// ---------- main entry -----------------------------------------------------

export async function exportDecisionDocxArabic(data: DecisionPdfData) {
  const isBatch = (data.batchCourses?.length ?? 0) > 1;
  const reviewer = data.reviewerName?.trim() || "المشرف الأكاديمي";

  // Choose final badge label/color
  let badgeLabel = STATUS_LABEL[data.status];
  let badgeColor = STATUS_COLOR[data.status];
  if (isBatch) {
    const approved = data.batchCourses!.filter(
      (c) => c.decision?.status === "approved"
    ).length;
    const rejected = data.batchCourses!.filter(
      (c) => c.decision?.status === "rejected"
    ).length;
    if (approved > 0 && rejected > 0) {
      badgeLabel = "قرار مختلط";
      badgeColor = COLOR_PRIMARY;
    } else if (approved === data.batchCourses!.length) {
      badgeLabel = "مقبول";
      badgeColor = COLOR_GREEN;
    } else if (rejected === data.batchCourses!.length) {
      badgeLabel = "مرفوض";
      badgeColor = COLOR_RED;
    }
  }

  const children: Paragraph[] = [
    ...buildHeader(),
    ...buildTitleBlock(data, isBatch, badgeLabel, badgeColor),
    ...buildStudentInfo(data),
    ...buildCoursesSection(data),
    new Paragraph({ children: [new TextRun(" ")], spacing: { before: 200 } }),
    ...buildSupervisorMessage(data, reviewer),
    ...buildSignature(data, reviewer),
  ];

  const doc = new Document({
    creator: "Aqaba University of Technology",
    title: "شهادة معادلة المساقات",
    description: "Official Arabic equivalency certificate",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22 },
          paragraph: { spacing: { line: 320 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4
              height: 16838,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.CENTER,
                children: [
                  arRun(
                    "جامعة العقبة للتكنولوجيا  ·  كلية تكنولوجيا المعلومات  ·  www.aut.edu.jo",
                    { color: COLOR_GREY_TEXT, size: 16 }
                  ),
                  new TextRun({
                    children: [" — صفحة ", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES],
                    color: COLOR_GREY_TEXT,
                    size: 16,
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `AUT-Equivalency-AR-${data.requestId.slice(0, 8)}-${data.status}.docx`;
  saveAs(blob, filename);
}
