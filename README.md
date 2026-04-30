# 🎓 نظام معادلة المواد الذكي — جامعة العقبة للتكنولوجيا (AUT)

> **مشروع تخرّج** · تخصص الذكاء الاصطناعي
> المشرف: **د. يزن الوقفي**
> الفريق: أحمد ياسر · أحمد بهلول · زيد زبدة · عبدالرحمن عطيوة

نظام متكامل لمعادلة المواد بين الجامعات/الكليات/الدبلومات وجامعة AUT، مدعوم بنماذج ذكاء اصطناعي **مفتوحة المصدر** يطوّرها الفريق ويشغّلها محلياً — **بدون اعتماد على أي خدمة سحابية مدفوعة**.

---

## 🏛️ البنية المعمارية (3 طبقات مستقلة)

```text
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│   1) Frontend (Vite)     │───▶│  2) AI Backend (FastAPI) │───▶│  3) Database (Postgres)  │
│   React + TypeScript     │    │   PaddleOCR + Sentence-  │    │  محلي عبر Docker          │
│   localhost:8080         │    │   Transformers محلياً     │    │   localhost:5432          │
│                          │    │   localhost:8000          │    │                          │
└──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

كل طبقة تعمل في **تيرمينال منفصل في VS Code**. لا حاجة لإنترنت بعد التثبيت الأول.

---

## ⚡ التشغيل السريع (بعد التحميل من Lovable / GitHub)

### المتطلبات
- **Node.js 20+** و **npm**
- **Python 3.10+**
- **Docker Desktop** (لقاعدة البيانات المحلية — اختياري)
- VS Code

### 1) الواجهة (Frontend)

```bash
# في الجذر
npm install
npm run dev
```
افتح: <http://localhost:8080>

### 2) خادم الذكاء الاصطناعي المحلي (الذي طوّره الفريق)

```bash
cd ai-backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```
افتح توثيق Swagger التفاعلي: <http://localhost:8000/docs>

ثم في `.env` بجذر المشروع أضف:
```env
VITE_AI_BACKEND_URL=http://localhost:8000
```
وأعد تشغيل `npm run dev`. الآن الواجهة تستخدم **نماذجك المحلية** بدلاً من أي خدمة خارجية.

### 3) قاعدة البيانات المحلية (اختياري — Supabase Self-Hosted)

```bash
git clone --depth 1 https://github.com/supabase/supabase external/supabase
cd external/supabase/docker
cp .env.example .env
docker compose up -d
```
ثم في `.env` بجذر المشروع:
```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_PUBLISHABLE_KEY=<المفتاح الذي يطبعه docker>
```

---

## 🧠 نماذج الذكاء الاصطناعي (من تطوير الفريق)

| المهمة                     | النموذج / المكتبة                                      | يعمل محلياً؟ |
| --------------------------- | ------------------------------------------------------- | :---: |
| OCR عربي + إنجليزي         | **PaddleOCR** (`arabic` + `en`)                         | ✅ |
| استخراج جداول من PDF       | **pdfplumber**                                          | ✅ |
| تمثيل دلالي للنصوص (Embeddings) | **sentence-transformers** — `paraphrase-multilingual-MiniLM-L12-v2` | ✅ |
| خوارزمية المعادلة + دمج N→1 | **خوارزميتنا** في `ai-backend/services/matcher.py`     | ✅ |

النماذج تُنزَّل **مرة واحدة** عند أول تشغيل (~500MB) وتُخزَّن في `~/.cache/`. بعدها يعمل النظام بدون إنترنت.

> **القرار النهائي بشريّ دائماً.** النظام يقترح فقط — المرشد الأكاديمي يعتمد أو يرفض.

---

## 📂 هيكل المشروع

```
.
├── README.md                ← هذا الملف
├── package.json             ← الواجهة
├── src/                     ← React + TypeScript
│   ├── pages/               ← Equivalency, MyRequests, AdminReview, ...
│   ├── lib/aiBackend.ts     ← طبقة الاتصال بالخادم المحلي
│   └── integrations/supabase/  ← عميل قاعدة البيانات
│
├── ai-backend/              ← خادم الذكاء الاصطناعي (Python)
│   ├── README.md            ← توثيق تفصيلي للخادم
│   ├── main.py              ← FastAPI: /api/extract, /api/match, /api/suggest-merges
│   ├── services/
│   │   ├── ocr_service.py        ← OCR
│   │   ├── pdf_extractor.py      ← قراءة PDF
│   │   ├── table_parser.py       ← تحويل النص لقائمة مواد
│   │   ├── embedding_service.py  ← Embeddings
│   │   └── matcher.py            ← خوارزمية المعادلة
│   └── data/aut_courses.json
│
└── supabase/                ← schema + migrations + edge functions (للنشر السحابي الاختياري)
    ├── migrations/*.sql
    └── functions/           ← نسخة احتياطية تستخدم Lovable AI (لن تُستعمل في الوضع المحلي)
```

---

## 🧪 خطوات التطوير المتقدّمة (لإضافة المساهمة البحثية)

ضعها في `ai-backend/training/` كنوتبوكات Jupyter:

1. **جمع بيانات تدريب** — 200-500 معادلة تاريخية حقيقية.
2. **Fine-tune نموذج Embeddings** على ثنائيات (مادة سابقة، مادة AUT) بـ contrastive loss.
3. **مصنّف قرار** خفيف (Logistic Regression) يتنبأ بـ "تُعادَل / لا تُعادَل" كاقتراح للمرشد.
4. **تحسين OCR** بـ fine-tuning على عيّنات كشوف عربية.
5. **التقييم** — Precision / Recall / F1 + Confusion Matrix لعرض المناقشة.

---

## 🔒 الخصوصية

- لا يُرسَل أي محتوى لأي API خارجي عند تشغيل الخادم المحلي.
- كل المعالجة تتم على جهازك.
- الكود مفتوح المصدر بالكامل ضمن المشروع.

---

## 📞 للمناقشة الأكاديمية

- العرض التوضيحي: شغّل الطبقات الثلاث، افتح <http://localhost:8080>، ارفع كشف علامات حقيقي.
- توثيق المعمارية: راجع `ai-backend/README.md`.
- شيفرة خوارزمية المعادلة (للشرح): `ai-backend/services/matcher.py`.
