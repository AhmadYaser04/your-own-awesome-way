## Goals from your message

1. Use the **full official AUT AI plan (132 hours, ~55 courses)** from the photos — not just 50.
2. Make the equivalency page **cleaner / less cluttered** and more professional.
3. **Remove all AI-written reasoning / per-match notes / comments** from the screen and from the printed form.
4. Rename buttons/labels: "استخراج المواد بالذكاء الاصطناعي" → **"استخراج المواد"**; "معادلة بالذكاء الاصطناعي" → **"معادلة تلقائية"**.
5. Remove the "بدون رقم جامعي/معدل" badge and any similar promotional notes from the data-entry page.
6. **Admin/مسؤول flow**: when logged in as admin, after extraction the system should jump straight into the auto-match review — no "إرسال طلب للمرشد" step. The submit-to-advisor button stays for normal students only.

---

## Plan

### 1. Replace the AUT course catalog with the official 132h plan

Rewrite the seed data so `aut_courses` matches the official "الخطط الدراسية" sheet exactly (5 categories, 132h total):

- **متطلبات جامعة إجبارية (15h)** — 7 courses: 2110104, 2110106, 2110108, 2110109, 2110115, 2110117, 2110120
- **متطلبات جامعة اختيارية (12h)** — 10 courses: 2110105, 2110107, 2110110, 2110111, 2110112, 2110113, 2110114, 2110116, 2110118, 2110119
- **متطلبات الكلية إجبارية (21h)** — 7 courses: 2110121, 2110122, 2110137, 2110138, 2110139, 2110140, 2110201
- **متطلبات القسم إجبارية (72h)** — 27 courses: 2110141, 2312102, 2312103, 2312201, 2312206, 2312207, 2312211, 2312212, 2312301, 2312303, 2312305, 2312308, 2312310, 2312311, 2312312, 2312402, 2312404, 2312407, 2312408, 2312409, 2312410, 2312411, 2312415, 2312416, 2321106, 2321107, 2321207, 2331307, 2331314
- **متطلبات القسم اختيارية (12h)** — 7 courses: 2312204, 2312205, 2312302, 2312306, 2312307, 2312401, 2312403, 2312406
- **مواد استدراكية (9h)** — 3 courses: 2110101, 2110102, 2110103

Done as a SQL migration that:
- truncates `aut_courses` and reinserts the full list above with correct `course_code`, `course_name_ar`, `credits`, and `category` (using the keys already in the code: `university_required`, `university_elective`, `college_required` (new), `department_required`, `department_elective`, `remedial`).
- Adds a 6th category `college_required` (21h) to `CATEGORY_LIMITS` so the breakdown adds up to 132h.
- Updates `src/data/aiCourses.ts` to mirror the same list (used as fallback context for the AI).

> Descriptions (`description_ar`) will be left blank for new courses for now and can be filled in later — the auto-match AI already infers content when descriptions are missing.

### 2. Simplify and de-clutter the Equivalency (data entry) page

In `src/pages/Equivalency.tsx`:
- Remove the **"بدون رقم جامعي/معدل"** badge.
- Remove the long descriptive paragraphs under the title and under each section (keep one short subtitle only).
- Rename the extract button to **"استخراج المواد"** (drop "بالذكاء الاصطناعي").
- Tighten card paddings/spacing, drop the secondary helper text on the extracted-courses table.
- Hide the "Submit to Advisor" footer and instead **redirect admins straight to the AdminReview page** for the new request:
  - if `role === "admin"`: after extraction & insert, navigate to `/admin/review/:id` (no advisor-submit wording).
  - if `role === "user"`: keep the current "إرسال الطلب للمرشد" button.

### 3. Clean up the AdminReview screen

In `src/pages/AdminReview.tsx`:
- Remove the per-match **Textarea for notes** and the **"ملاحظات عامة على الطلب"** field.
- Remove the **"AI reasoning"/notes** display from the matches list and stop sending/receiving `notes` from the AI.
- Keep only: student-list ↔ AUT-list, link/auto-match buttons, three verdict buttons (Pending/Reject/Approve), final 3 action buttons + print buttons.
- Add the 6th category bar (College Required, 21h) so totals reach 132.
- Rename "معادلة تلقائية (AI)" → **"معادلة تلقائية"**.

### 4. Strip notes/reasoning from the printout

In `src/lib/exportEquivalencyForm.ts`:
- Remove the **"ملاحظات"** column from both the approved and rejected tables.
- Remove the "(دمج N)" small note text inside the notes cell (the merge brace already shows it visually).
- Tighten the student info grid — drop GPA / academic year fields that the user said they don't want.

### 5. Backend tweaks

In `supabase/functions/auto-match/index.ts`:
- Stop returning a `reasoning` / `notes` field in the response (or at least stop persisting it) so nothing AI-written reaches the UI.
- Keep the AUT-centric matching logic, just don't surface the explanation.

---

## Technical notes

- New category key `college_required` must be added to:
  - `aut_courses.category` rows (migration)
  - `CATEGORY_LIMITS` map in `AdminReview.tsx` (max: 21)
  - `categoryTotals` initial object
- Admin redirect uses the existing `useAuth().role` already exposed by `src/hooks/useAuth.tsx`.
- No DB schema changes besides repopulating `aut_courses`; existing `equivalency_matches.notes` column stays but is just unused.

---

## Files to change

- `supabase/migrations/<new>.sql` — wipe + reseed `aut_courses` (≈55 rows, 132h).
- `src/data/aiCourses.ts` — mirror the new full list.
- `src/pages/Equivalency.tsx` — strip clutter, rename button, admin auto-redirect.
- `src/pages/AdminReview.tsx` — remove notes UI, add 6th category, rename button.
- `src/lib/exportEquivalencyForm.ts` — drop notes column + GPA fields.
- `supabase/functions/auto-match/index.ts` — stop returning/persisting AI commentary.

After approval I'll switch to build mode and apply all of the above in one pass.