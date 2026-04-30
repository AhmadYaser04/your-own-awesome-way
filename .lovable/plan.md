# خطة الاستقلالية الكاملة للمشروع

هدفك: **مشروع تخرج مستقل تماماً** — تنزّله، تشغّله من VS Code، تعرضه على لجنة المناقشة، **بدون أي اعتماد على Lovable AI أو أي خدمة سحابية مدفوعة**. الذكاء الاصطناعي يكون **من برمجتك** (نماذج مفتوحة المصدر تُشغّلها محلياً، أنت من تختارها وتدرّبها وتضبط معاييرها).

---

## نظرة عامة على البنية بعد الاستقلال

```text
project-root/
├── frontend/                  ← الواجهة (React + Vite)  [موجود حالياً]
│
├── ai-backend/                ← خادم الذكاء الاصطناعي الخاص بك [موجود — يحتاج تطوير]
│   ├── main.py                FastAPI: /extract /match /suggest-merges
│   ├── services/
│   │   ├── ocr_service.py     ← نموذج OCR (PaddleOCR محلياً)
│   │   ├── pdf_extractor.py
│   │   ├── table_parser.py    ← يحوّل نص OCR إلى مواد
│   │   ├── embedding_service.py ← Sentence-Transformers محلي
│   │   └── matcher.py         ← خوارزميتك للمعادلة + دمج N→1
│   └── data/aut_courses.json
│
└── database/                  ← Postgres محلي (بدلاً من Supabase Cloud)
```

ثلاث طبقات منفصلة، كل طبقة مستقلة وقابلة للتشغيل على جهازك بدون إنترنت بعد التثبيت الأول.

---

## المرحلة 1 — استبدال Lovable AI بالخادم المحلي (ai-backend)

مجلد `ai-backend/` موجود لديك أصلاً وفيه الهيكل الكامل لكنه **غير مفعّل في الواجهة**. الواجهة الآن تستدعي Edge Functions في Supabase التي تستخدم `LOVABLE_API_KEY`. سنحوّل ذلك.

### 1.1 ما سنفعله في الكود
- إنشاء `src/lib/aiBackend.ts` بدالتين: `extractCourses(file)` و `matchCourses(student, aut)` تستدعيان `http://localhost:8000/api/...`.
- في `src/pages/Equivalency.tsx`: استبدال `supabase.functions.invoke("extract-courses")` و `invoke("equivalency")` بالدوال الجديدة.
- في `src/pages/AdminReview.tsx`: استبدال أي استدعاء لـ `auto-match` بـ `matchCourses`.
- إضافة متغيّر `VITE_AI_BACKEND_URL=http://localhost:8000` في `.env`.
- بقاء Edge Functions كنسخة احتياطية فقط (يمكن حذفها لاحقاً).

### 1.2 النموذج الذي ستبرمجه أنت (وليس Lovable)
| المهمة | النموذج المفتوح | مكانه |
|---|---|---|
| OCR عربي + إنجليزي | **PaddleOCR** (مجاني، يعمل محلياً) | `services/ocr_service.py` |
| استخراج جداول PDF | **pdfplumber** | `services/pdf_extractor.py` |
| فهم المعنى ومقارنة المواد | **sentence-transformers** بنموذج `paraphrase-multilingual-MiniLM-L12-v2` (يدعم العربية) | `services/embedding_service.py` |
| منطق المعادلة والدمج N→1 | **خوارزميتك أنت** (cosine similarity + قواعد ساعات) | `services/matcher.py` |

كل النماذج تُنزَّل مرة واحدة على جهازك (~500MB) ثم تعمل **بدون إنترنت**.

### 1.3 لماذا هذا "ذكاؤك أنت"؟
- أنت تكتب الـ prompts والقواعد في `matcher.py`.
- أنت تضبط عتبة التشابه (`MIN_SIMILARITY`) وتسامح الساعات (`MERGE_CREDIT_TOLERANCE`).
- يمكنك **fine-tuning** لاحقاً على بيانات معادلات حقيقية لجامعة AUT.
- يمكنك استبدال أي مكوّن: مثلاً تستخدم Tesseract بدل PaddleOCR، أو نموذج عربي خاص مثل `AraBERT` بدل MiniLM.

---

## المرحلة 2 — استبدال Supabase Cloud بقاعدة بيانات محلية

Supabase الحالي يعمل عبر Lovable Cloud. بعد التخرج تحتاج كل شيء على جهازك.

### خيار أ (موصى به للعرض) — **Supabase Self-Hosted عبر Docker**
يعطيك نفس الـ API ونفس RLS policies بدون تغيير الكود الحالي.

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
docker compose up -d
```
ثم في `frontend/.env`:
```
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<المفتاح المحلي>
```

### خيار ب (أبسط) — **Postgres مباشرة + REST بسيط**
لو أردت تبسيطاً أكثر، استبدل عميل Supabase بطلبات `fetch` مباشرة لـ FastAPI الذي يتصل بـ Postgres محلي. أكثر عملاً لكن "ذكاؤك" 100%.

### تصدير البيانات الحالية
من Supabase Cloud الحالي: `Cloud → Database → Tables → Export` لكل جدول، ثم استيراد SQL في القاعدة المحلية.

---

## المرحلة 3 — تشغيل المشروع كاملاً من VS Code

### 3.1 تنزيل المشروع
- في Lovable: زر **GitHub → Connect to GitHub** ثم `git clone` المستودع.
- أو من Lovable مباشرة: قائمة المشروع → **Download ZIP**.

### 3.2 هيكل التشغيل المحلي (3 تيرمينالات في VS Code)

**Terminal 1 — قاعدة البيانات:**
```bash
cd database && docker compose up
```

**Terminal 2 — خادم الذكاء الاصطناعي (الذي برمجته):**
```bash
cd ai-backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 3 — الواجهة:**
```bash
cd frontend
npm install
npm run dev
```

افتح `http://localhost:8080` — كل شيء يعمل بدون إنترنت بعد التحميل الأول.

---

## المرحلة 4 — تطوير "نموذجك الخاص" المتقدم (ما بعد الأساسيات)

هذه هي الجزئية التي تجعل المشروع **مشروع تخرّج حقيقي بمساهمة بحثية**:

1. **جمع بيانات تدريب**: 200-500 معادلة تاريخية من قسم القبول والتسجيل (مادة قديمة + المادة المعتمدة + قرار المرشد).
2. **Fine-tune نموذج Embeddings عربي**: استخدم `sentence-transformers` لتدريب MiniLM على ثنائيات (مادة سعودية، مادة AUT) بـ contrastive loss.
3. **مصنّف قرار**: تدريب نموذج خفيف (Logistic Regression أو شبكة صغيرة) على الميزات (similarity, credit_diff, category_match) ليتنبأ بـ "تُعادَل / لا تُعادَل" كـ **اقتراح** للمرشد.
4. **OCR محسَّن**: fine-tune PaddleOCR على عيّنات كشوف علامات سعودية لتحسين دقة الأسماء العربية.
5. **التقييم**: قياس Precision/Recall/F1 على مجموعة test، ورسم Confusion Matrix — هذه أرقام تذكرها في عرض المشروع.

ضع كل ذلك في `ai-backend/training/` كنوتبوكات Jupyter (`.ipynb`) لتعرضها للجنة.

---

## التفاصيل التقنية (للمرجع)

### الملفات التي ستُعدَّل في المرحلة 1
- `src/lib/aiBackend.ts` (جديد)
- `src/pages/Equivalency.tsx` — استبدال نقاط استدعاء AI
- `src/pages/AdminReview.tsx` — استبدال نقاط استدعاء AI
- `.env` — إضافة `VITE_AI_BACKEND_URL`
- `ai-backend/services/table_parser.py` — تحسين دقة الـ regex على الكشوف العربية
- `ai-backend/services/matcher.py` — قواعد الـ 66/30 ساعة وتقييد الدمج 3:1

### المخاطر والحلول
| المخاطرة | الحل |
|---|---|
| PaddleOCR بطيء على CPU | استخدم `lang="ar"` فقط للكشوف العربية، أو fallback إلى Tesseract |
| نموذج Embeddings كبير | `MiniLM` فقط 470MB — مناسب للابتوب |
| Self-hosted Supabase معقد | البديل: Postgres + FastAPI REST بسيط |
| فقدان البيانات الحالية | تصديرها من Lovable Cloud قبل البدء |

---

## ترتيب التنفيذ المقترح (بعد موافقتك)

1. **توصيل ai-backend بالواجهة** (يومان): إنشاء `aiBackend.ts` + استبدال الاستدعاءات + اختبار.
2. **تحسين matcher.py** (3 أيام): قواعد الـ 66/30 + دمج N→1 + threshold tuning.
3. **تصدير البيانات + Supabase self-hosted** (يومان): Docker compose + استيراد SQL.
4. **توثيق التشغيل المحلي** (يوم): `README.md` رئيسي بكل الخطوات للجنة.
5. **(اختياري)** تدريب نموذج Embeddings مخصص + إضافة نوتبوكات تقييم.

---

## ما الذي أحتاج موافقتك عليه قبل البدء بالتنفيذ؟

عندما توافق على الخطة، سأبدأ مباشرة بـ **المرحلة 1** فقط (توصيل ai-backend بالواجهة ليصبح هو المسؤول عن AI بدلاً من Lovable). المراحل 2-4 ستحتاج موافقتك تباعاً لأن كل واحدة تستغرق وقتاً وقد يحتاج بعضها لقرارات منك (مثل: Self-hosted Supabase أم Postgres مباشرة؟).
