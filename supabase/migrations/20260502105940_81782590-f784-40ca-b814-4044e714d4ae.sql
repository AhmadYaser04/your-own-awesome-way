-- إضافة قيد فريد على course_code إن لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'aut_courses_course_code_key' 
    AND conrelid = 'public.aut_courses'::regclass
  ) THEN
    -- حذف أي تكرارات قبل إضافة القيد
    DELETE FROM public.aut_courses a
    USING public.aut_courses b
    WHERE a.id < b.id AND a.course_code = b.course_code;
    
    ALTER TABLE public.aut_courses ADD CONSTRAINT aut_courses_course_code_key UNIQUE (course_code);
  END IF;
END $$;