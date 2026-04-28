# 🤖 ai-backend — خادم الذكاء الاصطناعي المحلي لنظام معادلة المواد

> مشروع تخرّج: تخصص الذكاء الاصطناعي — جامعة العقبة للتكنولوجيا (AUT)
> المشرف: د. يزن الوقفي · الطلاب: أحمد ياسر، أحمد بهلول، زيد زبدة، عبدالرحمن عطيوة

هذا الباك-إند **مستقل تماماً عن لوفابل وعن أي خدمة سحابية مدفوعة**.
ينفّذ:
1. **استخراج النصوص (OCR)** من صور وكشوف PDF — عربي + إنجليزي
2. **التشابه الدلالي** بين أسماء/أوصاف المواد بنماذج محلية مفتوحة المصدر
3. **اقتراح الدمج N→1** عند تطابق الموضوع وتقارب الساعات
4. **مزامنة (اختيارية) مع قاعدة بيانات المشروع** عبر واجهة REST

---

## 📦 المتطلبات

- Python 3.10 أو أحدث
- ~2GB مساحة (للنماذج)
- اتصال إنترنت أوّل مرة فقط (لتنزيل النماذج)

---

## ⚙️ التثبيت (خطوة بخطوة على VS Code)

```bash
# 1) ادخل المجلد
cd ai-backend

# 2) أنشئ بيئة افتراضية
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

# 3) ثبّت المكتبات
pip install --upgrade pip
pip install -r requirements.txt

# 4) (اختياري) انسخ ملف البيئة
cp .env.example .env
# عدّل القيم لو احتجت ربط Supabase

# 5) شغّل الخادم
uvicorn main:app --reload --port 8000
```

افتح: <http://localhost:8000/docs> — ستجد توثيق Swagger تفاعلي لجميع الـ Endpoints.

---

## 🔌 ربط الواجهة (Lovable Frontend) بهذا الخادم

في الواجهة، أضف متغيّر بيئة:
```
VITE_AI_BACKEND_URL=http://localhost:8000
```
ثم في `src/lib/aiBackend.ts` (في الواجهة) ستُرسل الطلبات لهنا بدلاً من Edge Function.

> ⚠️ لو لم يُضبط `VITE_AI_BACKEND_URL`، تستخدم الواجهة Edge Function الحالي كـ fallback.

---

## 🎯 الـ Endpoints الأساسية

### 1. `POST /api/extract` — استخراج مواد من ملف
يستقبل صورة أو PDF لكشف علامات، يرجع قائمة مواد.

```bash
curl -X POST http://localhost:8000/api/extract \
  -F "file=@transcript.pdf"
```

### 2. `POST /api/match` — مطابقة دلالية
يستقبل قائمة مواد طالب + قائمة مواد AUT، يرجع أفضل الترشيحات لكل مادة.

```json
{
  "student_courses": [
    { "name": "مقدمة في الذكاء الاصطناعي", "credits": 3 }
  ],
  "aut_courses": [
    { "id": "...", "code": "2312402", "name_ar": "ذكاء اصطناعي", "credits": 3 }
  ]
}
```

### 3. `POST /api/suggest-merges` — اقتراح دمج N→1
يحلّل مواد الطالب ويقترح أي مادتين/ثلاث يمكن دمجهم في مادة AUT واحدة (بمقارنة مجموع الساعات وتقارب المواضيع).

### 4. `GET /api/health` — فحص جاهزية الخادم

---

## 🧠 النماذج المستخدمة

| المهمة | المكتبة | النموذج |
|---|---|---|
| OCR عربي/إنجليزي | PaddleOCR | `arabic` + `en` |
| استخراج جداول PDF | pdfplumber | — |
| تشابه دلالي متعدد اللغات | sentence-transformers | `paraphrase-multilingual-MiniLM-L12-v2` |
| تصنيف موضوع المادة | scikit-learn | KMeans على Embeddings |

النماذج تُحمَّل **مرة واحدة عند أول تشغيل** وتُخزَّن محلياً في `~/.cache/`.

---

## 📂 الهيكل

```
ai-backend/
├── README.md                ← هذا الملف
├── requirements.txt         ← المكتبات
├── .env.example             ← قالب متغيّرات البيئة
├── main.py                  ← FastAPI + CORS + كل الـ endpoints
├── config.py                ← إعدادات
├── data/
│   └── aut_courses.json     ← مواد AUT الرسمية (نسخة محلية)
├── services/
│   ├── ocr_service.py       ← PaddleOCR
│   ├── pdf_extractor.py     ← pdfplumber
│   ├── table_parser.py      ← تحويل النص لقائمة مواد
│   ├── embedding_service.py ← Sentence-Transformers
│   ├── matcher.py           ← خوارزمية المطابقة + اقتراح الدمج
│   └── supabase_sync.py     ← (اختياري) كتابة النتائج لقاعدة البيانات
└── tests/
    └── sample_inputs/       ← صور وملفات تجريبية
```

---

## 🔒 الخصوصية والأمان

- **لا يُرسَل أي محتوى** إلى أي API خارجي (لا OpenAI ولا Google ولا أي طرف ثالث)
- جميع المعالجة محلية على جهازك
- قاعدة البيانات لا تُلمس إلا لو شغّلت `supabase_sync` بمفاتيحك

---

## 🛠️ تخصيص قائمة مواد AUT

عدّل `data/aut_courses.json` لتحديث المواد، أو شغّل:
```bash
python scripts/sync_aut_courses_from_db.py
```
لاستيرادها مباشرة من قاعدة بيانات المشروع.

---

## 📝 ملاحظات للمشرف الأكاديمي

- النظام **يقترح فقط**؛ القرار النهائي للمعادلة دائماً يدوي عبر واجهة لجنة المعادلات.
- لا يوجد حكم تلقائي يُعرض للطالب — الطالب يرى "بانتظار قرار المرشد" حتى يضغط المشرف اعتماد/رفض.
- اقتراح الدمج N→1 يظهر للمشرف فقط كاقتراح، وله حرية القبول أو التعديل.
