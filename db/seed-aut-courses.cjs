// db/seed-aut-courses.cjs
// زرع/تحديث جدول aut_courses من ملف aut_courses_data.json (65 مادة من الخطة الرسمية)
// الاستخدام: node db/seed-aut-courses.cjs

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "aut_courses_data.json");

const PG_CONFIG = {
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  database: process.env.PGDATABASE || "aut_equivalency",
};

(async () => {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ الملف ${DATA_FILE} غير موجود`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  const courses = raw.courses || [];
  console.log(`📚 تم العثور على ${courses.length} مادة في aut_courses_data.json`);

  const client = new Client(PG_CONFIG);
  await client.connect();

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    const result = await client.query(
      `INSERT INTO public.aut_courses
        (course_code, course_name_ar, course_name_en, credits, category, description_ar, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (course_code) DO UPDATE
         SET course_name_ar = EXCLUDED.course_name_ar,
             course_name_en = EXCLUDED.course_name_en,
             credits = EXCLUDED.credits,
             category = EXCLUDED.category,
             description_ar = EXCLUDED.description_ar,
             display_order = EXCLUDED.display_order,
             updated_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [
        c.code,
        c.name_ar,
        c.name_en || null,
        c.credits || 3,
        c.category,
        c.description_ar || null,
        i,
      ],
    );
    if (result.rows[0].inserted) inserted++;
    else updated++;
  }

  console.log(`✅ تم إدراج ${inserted} مادة جديدة وتحديث ${updated} مادة موجودة.`);
  await client.end();
})().catch((e) => {
  console.error("❌ خطأ:", e.message);
  process.exit(1);
});
