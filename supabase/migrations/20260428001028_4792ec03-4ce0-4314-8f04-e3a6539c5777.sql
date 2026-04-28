
-- ============================================
-- 1) جدول مواد جامعة العقبة الرسمية
-- ============================================
CREATE TABLE public.aut_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  course_name_ar TEXT NOT NULL,
  course_name_en TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  category TEXT NOT NULL CHECK (category IN (
    'university_required','university_elective',
    'department_required','department_elective',
    'supporting','remedial','training','project'
  )),
  description_ar TEXT,
  description_en TEXT,
  prerequisites TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aut_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AUT courses readable by everyone"
  ON public.aut_courses FOR SELECT
  USING (true);

CREATE POLICY "Admins manage AUT courses"
  ON public.aut_courses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_aut_courses_updated_at
  BEFORE UPDATE ON public.aut_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_aut_courses_category ON public.aut_courses(category);
CREATE INDEX idx_aut_courses_code ON public.aut_courses(course_code);

-- ============================================
-- 2) تحديث جدول equivalency_requests
-- ============================================
ALTER TABLE public.equivalency_requests
  ADD COLUMN IF NOT EXISTS student_full_name TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS student_college TEXT,
  ADD COLUMN IF NOT EXISTS student_major TEXT,
  ADD COLUMN IF NOT EXISTS previous_diploma_source TEXT,
  ADD COLUMN IF NOT EXISTS cumulative_gpa NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS diploma_gpa NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS academic_year TEXT,
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS student_type TEXT NOT NULL DEFAULT 'different_major'
    CHECK (student_type IN ('same_major','different_major')),
  ADD COLUMN IF NOT EXISTS credits_cap INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS uploaded_file_url TEXT;

-- ============================================
-- 3) جدول مواد الطالب داخل الطلب
-- ============================================
CREATE TABLE public.equivalency_request_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.equivalency_requests(id) ON DELETE CASCADE,
  source_course_name TEXT NOT NULL,
  source_course_code TEXT,
  source_credits NUMERIC(4,1) NOT NULL DEFAULT 3,
  source_grade TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equivalency_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view items of own requests"
  ON public.equivalency_request_items FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.equivalency_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()));

CREATE POLICY "Users insert items of own requests"
  ON public.equivalency_request_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.equivalency_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()));

CREATE POLICY "Admins view all items"
  ON public.equivalency_request_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage items"
  ON public.equivalency_request_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_request_items_request ON public.equivalency_request_items(request_id);

-- ============================================
-- 4) جدول نتائج المطابقة
-- ============================================
CREATE TABLE public.equivalency_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.equivalency_requests(id) ON DELETE CASCADE,
  aut_course_id UUID REFERENCES public.aut_courses(id) ON DELETE SET NULL,
  source_item_ids UUID[] NOT NULL DEFAULT '{}',
  total_source_credits NUMERIC(5,1) NOT NULL DEFAULT 0,
  aut_credits INTEGER NOT NULL DEFAULT 0,
  similarity NUMERIC(4,3),
  verdict TEXT NOT NULL DEFAULT 'pending'
    CHECK (verdict IN ('approved','rejected','pending')),
  is_manual BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equivalency_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view matches of own requests"
  ON public.equivalency_matches FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.equivalency_requests r
    WHERE r.id = request_id AND r.user_id = auth.uid()));

CREATE POLICY "Admins view all matches"
  ON public.equivalency_matches FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage matches"
  ON public.equivalency_matches FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.equivalency_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_matches_request ON public.equivalency_matches(request_id);
CREATE INDEX idx_matches_aut_course ON public.equivalency_matches(aut_course_id);

-- ============================================
-- 5) Storage bucket لرفع كشوف الطلاب (50MB)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equivalency-uploads', 'equivalency-uploads', false, 52428800,
  ARRAY['application/pdf','image/jpeg','image/png','image/jpg','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = 52428800,
      allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/jpg','image/webp'];

CREATE POLICY "Users upload own equivalency files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'equivalency-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users view own equivalency files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'equivalency-uploads'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins delete equivalency files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equivalency-uploads' AND public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 6) بذر مواد AUT الرسمية
-- ============================================

-- متطلبات جامعية إجبارية (15 س)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2110104','مهارات الإتصال والتواصل باللغة العربية (1)','Arabic Communication Skills (1)',2,'university_required','مساق يهدف لتطوير مهارات الاتصال والتواصل باللغة العربية كتابةً وحديثاً.'),
('2110106','مهارات الإتصال والتواصل باللغة الإنجليزية (1)','English Communication Skills (1)',2,'university_required','تطوير مهارات اللغة الإنجليزية الأساسية في المحادثة والكتابة.'),
('2110108','التربية الوطنية','National Education',2,'university_required','مفاهيم الوطنية والمواطنة الصالحة وتاريخ الأردن.'),
('2110109','العلوم العسكرية','Military Sciences',3,'university_required','مبادئ العلوم العسكرية والدفاع المدني.'),
('2110115','الريادة و الإبتكار','Entrepreneurship and Innovation',2,'university_required','مفاهيم ريادة الأعمال والابتكار وبناء المشاريع الناشئة.'),
('2110117','القيادة و المسؤولية المجتمعية','Leadership and Social Responsibility',2,'university_required','مهارات القيادة والمسؤولية المجتمعية والعمل التطوعي.'),
('2110120','مهارات حياتية','Life Skills',2,'university_required','المهارات الحياتية الأساسية للنجاح المهني والاجتماعي.');

-- متطلبات جامعية اختيارية
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2110105','مهارات الإتصال والتواصل باللغة العربية (2)','Arabic Communication Skills (2)',3,'university_elective','استكمال متقدم لمهارات اللغة العربية.'),
('2110107','مهارات الإتصال والتواصل باللغة الإنجليزية (2)','English Communication Skills (2)',3,'university_elective','استكمال متقدم لمهارات اللغة الإنجليزية.'),
('2110110','الإسعافات الأولية و السلامة العامة','First Aid and Public Safety',3,'university_elective','مبادئ الإسعافات الأولية وقواعد السلامة العامة.'),
('2110111','التجارة الإلكترونية','E-Commerce',3,'university_elective','مفاهيم التجارة الإلكترونية وتطبيقاتها لغير طلبة تكنولوجيا المعلومات.'),
('2110112','التنمية و البيئة','Development and Environment',3,'university_elective','العلاقة بين التنمية المستدامة وحماية البيئة.'),
('2110113','الثقافة الإسلامية','Islamic Culture',3,'university_elective','أسس الثقافة الإسلامية والقيم الحضارية.'),
('2110114','الثقافة الإسلامية (1+2)','Islamic Culture 1+2',3,'university_elective','مساق متقدم في الثقافة الإسلامية.'),
('2110116','مبادئ القانون','Principles of Law',3,'university_elective','مقدمة في مبادئ القانون والأنظمة.'),
('2110118','الإرشاد المهني','Vocational Guidance',3,'university_elective','الإرشاد المهني واختيار المسارات الوظيفية.'),
('2110119','حقوق الملكية الفكرية','Intellectual Property Rights',3,'university_elective','حقوق الملكية الفكرية والملكية الصناعية.'),
('2110137','اللغة الإنجليزية المتخصصة','Specialized English Language',3,'university_elective','اللغة الإنجليزية للأغراض التقنية والمتخصصة.'),
('2110140','التربية الصحية','Health Education',3,'university_elective','مبادئ التربية الصحية والوقاية.');

-- متطلبات قسم إجبارية (72 س)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2110122','التفاضل والتكامل (1)','Calculus (1)',3,'department_required','أساسيات التفاضل والتكامل للدوال ذات المتغير الواحد، النهايات والاتصال والمشتقات والتكاملات.'),
('2110138','مقدمة في البرمجة','Introduction to Programming',3,'department_required','مفاهيم البرمجة الأساسية، الخوارزميات، المتغيرات، الجمل الشرطية، الحلقات، الدوال.'),
('2110141','الرياضيات المتقطعة','Discrete Mathematics',3,'department_required','المنطق، نظرية المجموعات، العلاقات، التوافيق والتباديل، نظرية الرسوم البيانية.'),
('2110201','هياكل البيانات','Data Structures',3,'department_required','المصفوفات، القوائم المرتبطة، المكدسات، الطوابير، الأشجار، الرسوم البيانية، خوارزميات الترتيب والبحث.'),
('2312102','أساسيات علم البيانات','Foundations of Data Science',2,'department_required','مقدمة في علم البيانات، تنظيف البيانات، التحليل الاستكشافي، التصور.'),
('2312103','مختبر أساسيات علم البيانات','Foundations of Data Science Lab',1,'department_required','تطبيقات عملية لعلم البيانات باستخدام Python و Pandas.'),
('2312201','أساسيات الذكاء الاصطناعي','Foundations of Artificial Intelligence',3,'department_required','مفاهيم الذكاء الاصطناعي، البحث، تمثيل المعرفة، الأنظمة الخبيرة، مقدمة في تعلم الآلة.'),
('2312206','تحليل وتصميم الخوارزميات','Algorithm Analysis and Design',3,'department_required','تحليل تعقيد الخوارزميات، تقنيات التصميم: فرّق تسد، البرمجة الديناميكية، الخوارزميات الجشعة.'),
('2312301','الإحصاء والاحتمالات للذكاء الاصطناعي','Statistics and Probability for AI',3,'department_required','المتغيرات العشوائية، التوزيعات الاحتمالية، اختبار الفرضيات، تحليل الانحدار.'),
('2312305','الجبر الخطي للذكاء الاصطناعي','Linear Algebra for AI',3,'department_required','المتجهات، المصفوفات، القيم الذاتية، تحليل القيم المفردة، تطبيقات في تعلم الآلة.'),
('2312311','قواعد البيانات','Databases',2,'department_required','نموذج العلاقات، SQL، التطبيع، تصميم قواعد البيانات.'),
('2312312','مختبر قواعد البيانات','Databases Lab',1,'department_required','تطبيقات عملية على قواعد البيانات.'),
('2312402','الشبكات العصبونية','Neural Networks',3,'department_required','البيرسبترون، الشبكات متعددة الطبقات، الانتشار الخلفي، التدريب، التطبيقات.'),
('2312404','تعلم الآلة','Machine Learning',3,'department_required','التعلم المُشرف وغير المُشرف، الانحدار، التصنيف، التجميع، التقييم.'),
('2312407','معالجة اللغات الطبيعية','Natural Language Processing',3,'department_required','معالجة النصوص، النماذج اللغوية، تحليل المشاعر، الترجمة الآلية، Transformers.'),
('2312408','التعرف على الأنماط','Pattern Recognition',3,'department_required','استخلاص الميزات، اختيار الميزات، التصنيف، تقنيات التعرف على الأنماط.'),
('2312409','التعلم العميق','Deep Learning',3,'department_required','الشبكات الالتفافية CNN، الشبكات المتكررة RNN/LSTM، GANs، Transformers.'),
('2312410','البيانات الكبيرة','Big Data',3,'department_required','Hadoop، Spark، معالجة البيانات الموزعة، MapReduce.'),
('2312411','رؤية الحاسوب','Computer Vision',3,'department_required','معالجة الصور، استخراج الميزات، الكشف عن الأشياء، التجزئة، OpenCV.'),
('2312412','الأنظمة الذكية','Intelligent Systems',3,'department_required','تصميم الأنظمة الذكية، الأنظمة متعددة الوكلاء، أنظمة دعم القرار.'),
('2312413','مشروع التخرج (1)','Graduation Project (1)',3,'department_required','تخطيط وتصميم مشروع تطبيقي في الذكاء الاصطناعي.'),
('2312414','مشروع التخرج (2)','Graduation Project (2)',3,'department_required','تنفيذ مشروع التخرج وتقييمه.'),
('2312415','التدريب العملي','Practical Training',3,'training','تدريب عملي في إحدى الشركات أو المؤسسات.'),
('2331307','أمن المعلومات','Information Security',3,'department_required','مبادئ أمن المعلومات، التشفير، التحقق، التوقيع الرقمي.');

-- متطلبات قسم اختيارية (12 س)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2312205','مبادئ وأخلاقيات الذكاء الاصطناعي','Principles and Ethics of AI',3,'department_elective','الأخلاقيات في الذكاء الاصطناعي، التحيز، الخصوصية، المسؤولية.'),
('2312302','إنترنت الأشياء','Internet of Things',3,'department_elective','أساسيات IoT، البروتوكولات، المستشعرات، تطبيقات إنترنت الأشياء مع AI.'),
('2312306','موضوعات خاصة في الذكاء الاصطناعي (1)','Special Topics in AI (1)',3,'department_elective','موضوعات معاصرة ومتقدمة في الذكاء الاصطناعي.'),
('2312307','تطبيقات الذكاء الاصطناعي في أمن المعلومات','AI Applications in Information Security',3,'department_elective','استخدام الذكاء الاصطناعي في الكشف عن التهديدات وتأمين الأنظمة.'),
('2312308','هندسة المعرفة','Knowledge Engineering',3,'department_elective','تمثيل المعرفة، الأنطولوجيا، الأنظمة المبنية على المعرفة.'),
('2312310','تعلم معزز','Reinforcement Learning',4,'department_elective','مبادئ التعلم المعزز، Q-Learning، Policy Gradients، تطبيقات.'),
('2312401','الروبوتات','Robotics',3,'department_elective','تصميم الروبوتات، الحركة، الاستشعار، التحكم، التعلم.'),
('2312403','أنظمة التوصية','Recommender Systems',3,'department_elective','أنظمة التوصية، التصفية التعاونية، التصفية القائمة على المحتوى.'),
('2312405','الواقع الافتراضي','Virtual Reality',3,'department_elective','تقنيات VR، الرسوميات ثلاثية الأبعاد، تصميم التفاعل.'),
('2312406','موضوعات خاصة في الذكاء الاصطناعي (2)','Special Topics in AI (2)',3,'department_elective','موضوعات متقدمة ومعاصرة في الذكاء الاصطناعي - الجزء الثاني.');

-- مساندة (6 س)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2110123','التفاضل والتكامل (2)','Calculus (2)',3,'supporting','التكامل المتقدم، المتسلسلات، المعادلات التفاضلية الأساسية.'),
('2110139','مبادئ الفيزياء','Principles of Physics',3,'supporting','مبادئ الفيزياء العامة، الميكانيكا، الكهرباء، المغناطيسية.');

-- استدراكية (9 س)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, description_ar) VALUES
('2110101','عربي استدراكي','Remedial Arabic',3,'remedial','مساق استدراكي في اللغة العربية للطلبة المحتاجين.'),
('2110102','إنجليزي استدراكي','Remedial English',3,'remedial','مساق استدراكي في اللغة الإنجليزية للطلبة المحتاجين.'),
('2110103','حاسوب استدراكي','Remedial Computer',3,'remedial','مهارات الحاسوب الأساسية للطلبة المحتاجين.');
