/**
 * Equivalency Form Printer
 *
 * Generates an official-looking printable HTML page that mirrors the AUT
 * "نموذج معادلة مواد للطلبة المجسرين" form, then triggers window.print().
 * Supports 3 modes: approved-only, rejected-only, full.
 *
 * Merged courses (N→1) are visually grouped with a left brace `{`.
 */

// Inline as base64 data URL so it always renders inside window.open() blank docs.
import autLogo from "@/assets/aut-logo-official.png?inline";

export type PrintMode = "approved" | "rejected" | "full";

export interface PrintRow {
  sources: { name: string; code: string; credits: number; grade: string }[];
  aut?: { code: string; name: string; credits: number };
  verdict: "approved" | "rejected" | "pending";
  notes: string;
  merged: boolean;
}

export interface EquivalencyPrintData {
  mode: PrintMode;
  student: {
    fullName: string;
    studentId: string;
    college: string;
    major: string;
    previousDiplomaSource: string;
    cumulativeGpa: number | null;
    diplomaGpa: number | null;
    academicYear: string;
    semester: string;
    studentType: string;
    creditsCap: number;
  };
  reviewerName: string;
  reviewedAt: string;
  submittedAt: string;
  requestId: string;
  rows: PrintRow[];
  unlinkedItems: { name: string; code: string; credits: number; grade: string }[];
  totals: {
    approvedAutCredits: number;
    approvedSourceCredits: number;
    cap: number;
  };
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
};

export function exportEquivalencyForm(data: EquivalencyPrintData) {
  const title =
    data.mode === "approved" ? "المواد المعادَلة"
    : data.mode === "rejected" ? "المواد غير المعادَلة"
    : "نموذج معادلة مواد للطلبة المجسرين — كامل";

  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) {
    alert("فضلاً اسمح بالنوافذ المنبثقة لطباعة النموذج.");
    return;
  }

  const html = renderHtml(data, title);
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Allow rendering then print
  w.onload = () => {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 300);
  };
}

function renderHtml(d: EquivalencyPrintData, title: string): string {
  const s = d.student;
  const logoUrl = autLogo as unknown as string;
  const showApproved = d.mode === "approved" || d.mode === "full";
  const showRejected = d.mode === "rejected" || d.mode === "full";

  const approvedRows = d.rows.filter((r) => r.verdict === "approved");
  const rejectedRows = d.rows.filter((r) => r.verdict === "rejected");
  const pendingRows = d.rows.filter((r) => r.verdict === "pending");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${esc(title)} — ${esc(s.fullName)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Amiri", "Tajawal", "Cairo", "Times New Roman", serif;
    color: #111; margin: 0; padding: 0;
    font-size: 12pt; line-height: 1.5;
    background: #fff;
  }
  .page { padding: 4mm 0; }
  .hdr {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    border-bottom: 4px double #14306b; padding-bottom: 10px; margin-bottom: 12px;
    background: linear-gradient(135deg, #f7f9ff 0%, #fffaf0 100%);
    padding: 10px 12px; border-radius: 6px;
  }
  .hdr .uni { text-align: center; flex: 1; }
  .hdr h1 { margin: 0; font-size: 17pt; color: #14306b; font-weight: 800; letter-spacing: 0.3px; }
  .hdr h2 { margin: 3px 0 0; font-size: 11pt; color: #b58a2b; font-weight: 600; }
  .hdr .logo-box {
    width: 78px; height: 78px; display: flex; align-items: center; justify-content: center;
    background: #fff; border: 2px solid #14306b; border-radius: 12px; padding: 4px;
  }
  .hdr .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .hdr .seal {
    width: 78px; height: 78px; border: 2px solid #b58a2b; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 8pt; color: #b58a2b; font-weight: bold; text-align: center; padding: 4px;
    background: #fffdf5;
  }
  .form-title {
    text-align: center; font-size: 14pt; font-weight: bold; color: #fff;
    background: linear-gradient(90deg, #14306b, #1e4a9e); padding: 8px;
    margin-bottom: 12px; border-radius: 4px;
    box-shadow: 0 2px 0 #b58a2b;
  }
  .student-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px;
    border: 1px solid #c9d1e3; padding: 8px 10px; margin-bottom: 12px; font-size: 10pt;
    background: #fafbff; border-radius: 4px;
  }
  .student-grid .field { padding: 2px 0; }
  .student-grid .label { color: #14306b; font-weight: bold; font-size: 9pt; }
  .student-grid .value { color: #111; border-bottom: 1px dotted #888; padding: 1px 4px; min-height: 16px; }
  .section-title {
    font-size: 12pt; font-weight: bold; color: #14306b;
    background: #f0f4ff; padding: 5px 10px; margin: 14px 0 6px;
    border-right: 4px solid #b58a2b; border-radius: 0 4px 4px 0;
  }
  table.eq {
    width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 8px;
    page-break-inside: auto;
  }
  table.eq th, table.eq td {
    border: 1px solid #b8c0d6; padding: 4px 6px; vertical-align: top;
  }
  table.eq th {
    background: #14306b; color: #fff; font-weight: bold; text-align: center; font-size: 9.5pt;
  }
  table.eq tr { page-break-inside: avoid; }
  table.eq td.center { text-align: center; }
  table.eq tr.merged-row td { background: #fff8e1; }
  .brace {
    display: inline-block; font-size: 22pt; line-height: 0.8; color: #b58a2b;
    vertical-align: middle; padding: 0 4px;
  }
  .merged-group td:first-child {
    border-left: 3px solid #b58a2b;
  }
  .totals {
    display: flex; justify-content: space-between; gap: 12px; font-size: 11pt;
    border: 2px solid #14306b; padding: 10px 12px; background: #f0f4ff; margin-top: 8px;
    border-radius: 6px;
  }
  .totals .item { display: flex; flex-direction: column; align-items: center; }
  .totals .item b { color: #14306b; font-size: 14pt; }
  .cap-warning {
    margin-top: 6px; color: #b91c1c; font-weight: bold; font-size: 10pt; text-align: center;
  }
  .signatures {
    margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
    page-break-inside: avoid;
  }
  .sig-box {
    border: 1px solid #b8c0d6; padding: 8px; min-height: 80px; font-size: 9.5pt;
    background: #fafbff; border-radius: 4px;
  }
  .sig-box .role { font-weight: bold; color: #14306b; margin-bottom: 4px; }
  .sig-box .name-line { border-bottom: 1px dotted #888; min-height: 18px; margin-top: 24px; }
  .sig-box .label { font-size: 8pt; color: #777; }
  .footer {
    margin-top: 16px; font-size: 8pt; color: #777; text-align: center;
    border-top: 1px solid #ddd; padding-top: 6px;
  }
  .badge-mode {
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 9pt; font-weight: bold; margin-inline-start: 8px; background: #fff;
  }
  .badge-mode.approved { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
  .badge-mode.rejected { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
  .badge-mode.full { background: #fffaf0; color: #b58a2b; border: 1px solid #b58a2b; }
  .empty { text-align: center; color: #999; padding: 12px; font-style: italic; }
  @media print { .no-print { display: none !important; } }
  .no-print { text-align: center; padding: 12px; background: #fef3c7; border-bottom: 1px solid #f59e0b; }
  .no-print button {
    padding: 8px 16px; font-size: 11pt; cursor: pointer; background: #14306b; color: #fff;
    border: none; border-radius: 4px; font-weight: bold;
  }
</style>
</head>
<body>

<div class="no-print">
  هذه معاينة قابلة للطباعة. اضغط الزر أدناه أو Ctrl+P. &nbsp;
  <button onclick="window.print()">🖨️ طباعة</button>
  &nbsp; <button onclick="window.close()" style="background:#777">إغلاق</button>
</div>

<div class="page">
  <div class="hdr">
    <div class="logo-box"><img src="${esc(logoUrl)}" alt="AUT" /></div>
    <div class="uni">
      <h1>جامعة العقبة للتكنولوجيا</h1>
      <h2>كلية تكنولوجيا المعلومات — قسم الذكاء الاصطناعي</h2>
    </div>
    <div class="seal">لجنة<br/>المعادلات</div>
  </div>

  <div class="form-title">
    نموذج معادلة مواد للطلبة المجسرين
    <span class="badge-mode ${d.mode}">
      ${d.mode === "approved" ? "المواد المعادَلة فقط"
        : d.mode === "rejected" ? "المواد غير المعادَلة فقط"
        : "نسخة كاملة"}
    </span>
  </div>

  <div class="student-grid">
    <div class="field"><div class="label">اسم الطالب</div><div class="value">${esc(s.fullName)}</div></div>
    <div class="field"><div class="label">الكلية</div><div class="value">${esc(s.college)}</div></div>
    <div class="field"><div class="label">التخصص</div><div class="value">${esc(s.major)}</div></div>
    <div class="field"><div class="label">نوع الانتقال</div><div class="value">${
      s.studentType === "same_major" ? "نفس التخصص" : "تخصص مختلف"
    }</div></div>
    <div class="field" style="grid-column: span 2"><div class="label">الجامعة / الدبلوم السابق</div><div class="value">${esc(s.previousDiplomaSource)}</div></div>
    <div class="field" style="grid-column: span 3"><div class="label">رقم الطلب</div><div class="value" style="font-family: monospace; font-size: 9pt">${esc(d.requestId.slice(0, 8))}</div></div>
  </div>

  ${showApproved ? renderTable("المواد المعادَلة", approvedRows, "approved") : ""}
  ${showApproved && pendingRows.length ? renderTable("مواد قيد المراجعة", pendingRows, "pending") : ""}
  ${showRejected ? renderTable("المواد غير المعادَلة", rejectedRows, "rejected") : ""}
  ${showRejected && d.unlinkedItems.length ? renderUnlinked(d.unlinkedItems) : ""}

  <div class="totals">
    <div class="item"><b>${d.totals.approvedSourceCredits}</b><span>مجموع ساعات الطالب المعادَلة</span></div>
    <div class="item"><b>${d.totals.approvedAutCredits}</b><span>مجموع ساعات AUT المعتمَدة</span></div>
    <div class="item"><b>${d.totals.cap}</b><span>السقف المسموح</span></div>
    <div class="item"><b>${Math.max(0, d.totals.cap - d.totals.approvedAutCredits)}</b><span>المتبقي ضمن السقف</span></div>
  </div>
  ${d.totals.approvedAutCredits > d.totals.cap
    ? `<div class="cap-warning">⚠️ تم تجاوز السقف المسموح بـ ${d.totals.approvedAutCredits - d.totals.cap} ساعة معتمدة.</div>`
    : ""}

  <div class="signatures">
    <div class="sig-box">
      <div class="role">المرشد الأكاديمي / لجنة المعادلات</div>
      <div class="name-line">${esc(d.reviewerName !== "—" ? `د. ${d.reviewerName}` : "")}</div>
      <div class="label">الاسم والتوقيع</div>
    </div>
    <div class="sig-box">
      <div class="role">رئيس قسم الذكاء الاصطناعي</div>
      <div class="name-line"></div>
      <div class="label">الاسم والتوقيع</div>
    </div>
    <div class="sig-box">
      <div class="role">عميد كلية تكنولوجيا المعلومات</div>
      <div class="name-line"></div>
      <div class="label">الاسم والتوقيع</div>
    </div>
  </div>

  <div class="footer">
    تم إصدار هذا النموذج عبر نظام معادلة المواد الذكي — جامعة العقبة للتكنولوجيا.
    تاريخ التقديم: ${fmtDate(d.submittedAt)} · تاريخ القرار: ${fmtDate(d.reviewedAt)}
  </div>
</div>
</body>
</html>`;
}

function renderTable(heading: string, rows: PrintRow[], kind: "approved" | "rejected" | "pending"): string {
  if (rows.length === 0) {
    return `<div class="section-title">${esc(heading)}</div><div class="empty">— لا يوجد —</div>`;
  }
  const trs = rows.map((r) => {
    const sourceCount = r.sources.length;
    const merged = sourceCount > 1;
    if (!merged) {
      const s0 = r.sources[0];
      return `<tr>
        <td>${esc(s0?.name || "—")}</td>
        <td class="center">${esc(s0?.code || "—")}</td>
        <td class="center">${s0?.credits ?? "—"}</td>
        <td class="center">${esc(s0?.grade || "—")}</td>
        <td class="center"></td>
        <td class="center">${esc(r.aut?.code || "—")}</td>
        <td>${esc(r.aut?.name || "—")}</td>
        <td class="center">${r.aut?.credits ?? "—"}</td>
      </tr>`;
    }
    return r.sources.map((s, idx) => {
      const isFirst = idx === 0;
      return `<tr class="merged-group merged-row">
        <td>${esc(s.name)}</td>
        <td class="center">${esc(s.code || "—")}</td>
        <td class="center">${s.credits}</td>
        <td class="center">${esc(s.grade || "—")}</td>
        ${isFirst ? `<td class="center" rowspan="${sourceCount}"><span class="brace">}</span></td>` : ""}
        ${isFirst ? `<td class="center" rowspan="${sourceCount}">${esc(r.aut?.code || "—")}</td>` : ""}
        ${isFirst ? `<td rowspan="${sourceCount}">${esc(r.aut?.name || "—")}</td>` : ""}
        ${isFirst ? `<td class="center" rowspan="${sourceCount}">${r.aut?.credits ?? "—"}</td>` : ""}
      </tr>`;
    }).join("");
  }).join("");

  return `
  <div class="section-title">${esc(heading)} (${rows.length})</div>
  <table class="eq">
    <thead>
      <tr>
       <th colspan="4" style="background:#b58a2b">مواد الطالب (الدبلوم السابق)</th>
       <th rowspan="2" style="width:18px"></th>
       <th colspan="3" style="background:#14306b">مواد جامعة AUT المعادِلة</th>
      </tr>
      <tr>
        <th>اسم المادة</th><th>الرقم</th><th>الساعات</th><th>العلامة</th>
        <th>الرقم</th><th>اسم المادة</th><th>الساعات</th>
      </tr>
    </thead>
    <tbody>${trs}</tbody>
  </table>`;
}

function renderUnlinked(items: { name: string; code: string; credits: number; grade: string }[]): string {
  if (items.length === 0) return "";
  const trs = items.map((it) => `
    <tr>
      <td>${esc(it.name)}</td>
      <td class="center">${esc(it.code || "—")}</td>
      <td class="center">${it.credits}</td>
      <td class="center">${esc(it.grade || "—")}</td>
      <td style="color:#991b1b; font-style:italic">لم يتم ربطها بأي مادة AUT</td>
    </tr>
  `).join("");
  return `
  <div class="section-title">مواد لم يتم ربطها</div>
  <table class="eq">
    <thead><tr>
      <th>اسم المادة</th><th>الرقم</th><th>الساعات</th><th>العلامة</th><th>الحالة</th>
    </tr></thead>
    <tbody>${trs}</tbody>
  </table>`;
}
