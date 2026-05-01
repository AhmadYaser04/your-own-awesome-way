
## ملخّص الفحص

النسخة التي رفعتها انفصلت عن Supabase وتعتمد على:
- **PostgreSQL محلي** (`aut_equivalency` على `localhost:5432`)
- **Node + Express** على `localhost:3000` (`server.cjs`) — REST API
- **FastAPI Python** على `localhost:8000` (`ai-backend/`) — OCR + معادلة دلالية محلية بـ PaddleOCR + sentence-transformers (مجاني تماماً، بدون أي API key)
- **Vite/React** على `localhost:8080` — الواجهة

### المشاكل التي وجدتها

**1. مخطط `equivalency_matches` متضارب (الأخطر)**
صورك تُظهر إنشاءه بـ 3 أشكال مختلفة:
- صورتان: `aut_course_id INTEGER` + `source_item_id` (مفرد)
- صورة: `source_item_ids TEXT[]` + `aut_credits` + `is_manual` ✅

لكن `aut_courses.id` نوعه `UUID`، فإذا كان `aut_course_id INTEGER` فالـ JOIN في `server.cjs` سيفشل.

**2. جدول `profiles` مفقود**
صورة 5 تُظهر فقط: `aut_courses, equivalency_matches, users, equivalency_request_items, equivalency_requests`. لكن `Admin.tsx` و`MyRequests.tsx` يستعلمان عن `profiles` لجلب أسماء الطلاب وجامعاتهم → ستظهر الطلبات بدون أسماء.

**3. طبقة `supabase` stub ناقصة**
`src/integrations/supabase/client.ts` لا تدعم:
- `.in(col, ids)` — مستخدمة في 5 أماكن (MyRequests، Admin حذف جماعي)
- `from("profiles")` — لا يوجد endpoint
- `update().in(...)` و `delete().in(...)` بدفعة

**4. `server.cjs` ينقصه endpoints**
- لا endpoint للـ `profiles`
- لا حذف جماعي `DELETE /api/requests` بـ `{ ids }`
- لا إدارة `equivalency_matches` (إنشاء/تعديل/حذف معادلات الأدمن)
- لا `POST /api/register` للطلاب (التسجيل معطل بالكامل حالياً)

**5. الواجهة لا تستدعي FastAPI فعلاً**
`VITE_AI_BACKEND_URL` فارغ في `.env`، فالواجهة تحاول استدعاء Edge Functions Lovable التي لم تعد قاعدة البيانات لها → الـ OCR والمعادلة التلقائية لا يعملان.

**6. مخاوف أمان بسيطة**
`server.cjs` يخزن `password_hash` كنص خام ويقارنه مباشرة. للمشروع المحلي مقبول، لكن `bcryptjs` أنظف.

---

## الخطة (6 مراحل بالترتيب)

### المرحلة A — قاعدة بيانات نظيفة موحّدة

أنشئ ملف واحد `db/init.sql` يحتوي على المخطط الكامل النظيف، ينظف أي جداول قديمة متضاربة:

```text
DROP TABLE IF EXISTS equivalency_matches CASCADE;
DROP TABLE IF EXISTS equivalency_request_items CASCADE;
DROP TABLE IF EXISTS equivalency_requests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- aut_courses تبقى كما هي

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,    -- bcrypt
  full_name TEXT, email TEXT,
  role TEXT NOT NULL DEFAULT 'user',  -- 'user' | 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT, email TEXT,
  saudi_university TEXT,    -- = الجامعة السابقة
  created_at TIMESTAMPTZ DEFAULT now()
);

-- equivalency_requests, equivalency_request_items: نفس مخطط Supabase الأصلي
-- لكن user_id يشير لـ users(id) بدل auth.users

CREATE TABLE equivalency_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES equivalency_requests(id) ON DELETE CASCADE,
  aut_course_id UUID REFERENCES aut_courses(id) ON DELETE SET NULL,  -- UUID لا INTEGER
  source_item_ids UUID[] NOT NULL DEFAULT '{}',
  total_source_credits NUMERIC DEFAULT 0,
  aut_credits INTEGER DEFAULT 0,
  similarity NUMERIC,
  verdict TEXT DEFAULT 'pending',
  is_manual BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: admin افتراضي
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '<bcrypt-hash-of-admin123>', 'مدير النظام', 'admin');
```

ثم سكريبت Node صغير `db/seed-aut-courses.cjs` يقرأ `src/data/aiCourses.ts` ويُدخل كل مواد AUT تلقائياً.

تشغيل واحد:
```bash
psql -U postgres -d aut_equivalency -f db/init.sql
node db/seed-aut-courses.cjs
```

### المرحلة B — توسيع `server.cjs`

إضافة endpoints الناقصة + استخدام `bcryptjs`:

| Endpoint | الغرض |
|---|---|
| `POST /api/register` | تسجيل طلاب جدد + إنشاء صف في `profiles` تلقائياً |
| `POST /api/login` | bcrypt مقارنة + إرجاع role من DB |
| `GET /api/profiles?ids=a,b,c` | جلب أسماء/جامعات بالدفعة (يحل مشكلة `Admin.tsx`) |
| `DELETE /api/requests` body `{ids:[]}` | حذف جماعي |
| `GET /api/requests/:id/items` و `/matches` | منفصلين |
| `POST /api/matches`, `PATCH /api/matches/:id`, `DELETE /api/matches/:id` | إدارة معادلات الأدمن |
| `GET /api/matches?request_ids=a,b,c` | جلب معادلات بالدفعة (لـ MyRequests) |
| `GET /api/items?request_ids=a,b,c` | جلب items بالدفعة |

### المرحلة C — إصلاح stub `src/integrations/supabase/client.ts`

دعم `.in(col, values)`، `update().in(...)`, `delete().in(...)`، وتوجيهها للـ endpoints الجديدة:
- `from("profiles").select(...).in("id", ids)` → `GET /api/profiles?ids=...`
- `from("equivalency_request_items").select(...).in("request_id", ids)` → `GET /api/items?request_ids=...`
- `from("equivalency_matches").select(...).in("request_id", ids)` → `GET /api/matches?request_ids=...`
- `delete().in("id", ids)` → `DELETE /api/requests` body `{ids}`

هذا سيعمل بدون أي تعديل على `Admin.tsx` و`MyRequests.tsx`.

### المرحلة D — ربط FastAPI بالواجهة (الذكاء الاصطناعي المحلي المجاني)

في `.env`:
```
VITE_AI_BACKEND_URL=http://localhost:8000
```

في `src/pages/Equivalency.tsx`:
- استبدل نداء Edge Function `extract-courses` بـ `extractCoursesLocal()` من `src/lib/aiBackend.ts`.
- عند فشل OCR → fallback تلقائي للإدخال اليدوي + رسالة عربية واضحة.

في `src/pages/AdminReview.tsx`:
- زر "اقتراح معادلات تلقائية" يستدعي `matchCoursesLocal()` + `suggestMergesLocal()` ويخزن النتائج في `equivalency_matches` عبر `/api/matches`.

إضافة بطاقة حالة في الـ Header تعرض:
- 🟢 سيرفر API: متصل / 🔴 معطّل
- 🟢 محرّك الذكاء (FastAPI): متصل / 🔴 معطّل
عبر `pingLocalBackend()` و `/api/health`.

> **النموذج المستخدم محلياً مجاني 100%:**  
> - OCR: PaddleOCR (يعمل أوفلاين بعد تحميل الموديلات أول مرة)  
> - مطابقة دلالية: `paraphrase-multilingual-MiniLM-L12-v2` (sentence-transformers، أوفلاين)  
> - لا API keys، لا حدود استخدام، لا اتصال بالإنترنت بعد التحميل الأول.

### المرحلة E — تجربة مطوّر مريحة (DX)

`package.json`:
```json
"scripts": {
  "dev:web": "vite",
  "dev:api": "node server.cjs",
  "dev:ai":  "cd ai-backend && uvicorn main:app --port 8000 --reload",
  "dev":     "concurrently -n web,api,ai -c blue,green,magenta \"npm:dev:web\" \"npm:dev:api\" \"npm:dev:ai\""
}
```
أمر واحد `npm run dev` يشغّل كل شيء.

`README.local.md` بخطوات من الصفر:
1. تثبيت PostgreSQL 15+ ← إنشاء قاعدة `aut_equivalency`
2. `psql -f db/init.sql` ثم `node db/seed-aut-courses.cjs`
3. `cd ai-backend && pip install -r requirements.txt`
4. `npm install` (الجذر)
5. `npm run dev` ← كل شيء يبدأ
6. افتح `http://localhost:8080` ودخول `admin / admin123`

### المرحلة F — تنظيف بقايا Supabase

- حذف مجلد `supabase/functions/` كاملاً (لم يعد مستخدماً).
- حذف `supabase/config.toml`.
- إزالة `@supabase/supabase-js` من `package.json` (لم يعد ضرورياً، الـ stub لا يستخدم المكتبة).
- إعادة تسمية `src/integrations/supabase/client.ts` إلى `src/integrations/api/client.ts` ليبقى متناسقاً مع الفلسفة الجديدة (مع `import` alias للحفاظ على التوافق).
- في `useAuth.tsx`: التأكد أن النسخة المحلية الجديدة (التي تقرأ من `localStorage.app_user`) هي المستخدمة فقط.

---

## النتيجة النهائية بعد التطبيق

✅ كل البيانات على جهازك (Postgres محلي).  
✅ الذكاء الاصطناعي (OCR + معادلة دلالية) محلي بالكامل، مجاني، بدون أي API key.  
✅ صفر اعتماد على Supabase أو أي خدمة مدفوعة.  
✅ أمر واحد `npm run dev` يشغّل كل شيء.  
✅ admin/admin123 يعمل، تسجيل طلاب جدد يعمل، الأدمن يرى أسماء الطلاب وجامعاتهم، الحذف الجماعي يعمل، المعادلة التلقائية تعمل، الطباعة الرسمية تعمل.

---

## أسئلة قبل البدء

أحتاج إجابتك على هذه الأمور قبل التنفيذ:

1. **مخطط `equivalency_matches`**: سأعتمد الشكل بـ `source_item_ids UUID[]` (الأحدث في صورك) لأنه يدعم الدمج N→1. هل توافق على إسقاط الجداول الأقدم وإعادة بنائها من الصفر بسكريبت `db/init.sql` واحد؟ (سيمسح أي طلبات تجريبية موجودة)

2. **`bcryptjs` أم نص خام**: هل تريد bcrypt للأمان (موصى به، إضافة dependency واحدة) أم نص خام لأنه مشروع تخرج محلي فقط؟

3. **التسجيل**: هل أُفعّل تسجيل طلاب جدد من صفحة `/auth` (يحتاج جامعة سابقة + اسم كامل + كلمة سر)، أم أكتفي بالـ admin فقط ويتم إنشاء حسابات الطلاب يدوياً عبر سكريبت seed؟

بعد إجابتك سأنفّذ المراحل A → F بالترتيب وأختبر كل شيء.
