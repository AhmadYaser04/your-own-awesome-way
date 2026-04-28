
-- مسح القديم
DELETE FROM public.aut_courses;

ALTER TABLE public.aut_courses 
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- متطلبات الجامعة - إجباري (15)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, display_order) VALUES
('2110104', 'مهارات الإتصال والتواصل باللغة العربية (1)', 'Arabic Communication Skills (1)', 2, 'university_required', 1),
('2110106', 'مهارات الإتصال والتواصل باللغة الإنجليزية (1)', 'English Communication Skills (1)', 2, 'university_required', 2),
('2110108', 'التربية الوطنية', 'National Education', 2, 'university_required', 3),
('2110109', 'العلوم العسكرية', 'Military Sciences', 3, 'university_required', 4),
('2110115', 'الريادة و الإبتكار', 'Entrepreneurship & Innovation', 2, 'university_required', 5),
('2110117', 'القيادة و المسؤولية المجتمعية', 'Leadership & Social Responsibility', 2, 'university_required', 6),
('2110120', 'مهارات حياتية', 'Life Skills', 2, 'university_required', 7);

-- متطلبات الجامعة - اختياري (12)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, display_order) VALUES
('2110105', 'مهارات الإتصال والتواصل باللغة العربية (2)', 'Arabic Communication Skills (2)', 3, 'university_elective', 10),
('2110107', 'مهارات الإتصال والتواصل باللغة الإنجليزية (2)', 'English Communication Skills (2)', 3, 'university_elective', 11),
('2110110', 'الإسعافات الأولية و السلامة العامة', 'First Aid & Public Safety', 3, 'university_elective', 12),
('2110111', 'التجارة الإلكترونية', 'E-Commerce', 3, 'university_elective', 13),
('2110112', 'التنمية و البيئة', 'Development & Environment', 3, 'university_elective', 14),
('2110119', 'حقوق الملكية الفكرية', 'Intellectual Property Rights', 3, 'university_elective', 15);

-- متطلبات التخصص - إجباري (72)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, display_order, description_ar) VALUES
('2110122', 'التفاضل والتكامل (1)', 'Calculus (1)', 3, 'department_required', 100, 'مفاهيم النهايات والاتصال والمشتقات والتكاملات للدوال الحقيقية'),
('2110138', 'مقدمة في علم الحاسوب', 'Introduction to Computer Science', 3, 'department_required', 101, 'مقدمة عامة لعلوم الحاسوب وأساسيات البرمجة والتفكير الحاسوبي'),
('2110141', 'الرياضيات المتقطعة', 'Discrete Mathematics', 3, 'department_required', 102, 'المنطق، النظريات، البراهين، نظرية المجموعات، العلاقات والدوال، نظرية البيان'),
('2312102', 'أساسيات علم البيانات', 'Fundamentals of Data Science', 2, 'department_required', 103, 'مقدمة في علم البيانات وتحليل البيانات والإحصاء التطبيقي'),
('2312103', 'مختبر أساسيات علم البيانات', 'Data Science Lab', 1, 'department_required', 104, 'تطبيقات عملية على أساسيات علم البيانات باستخدام Python'),
('2312201', 'أساسيات الذكاء الاصطناعي', 'Fundamentals of Artificial Intelligence', 3, 'department_required', 105, 'مفاهيم الذكاء الاصطناعي، أنظمة البحث، تمثيل المعرفة، الاستدلال'),
('2312202', 'البرمجة (1)', 'Programming (1)', 3, 'department_required', 106, 'مقدمة في البرمجة باستخدام Python: المتغيرات، الجمل الشرطية، الحلقات، الدوال'),
('2312203', 'مختبر البرمجة (1)', 'Programming Lab (1)', 1, 'department_required', 107, 'تطبيقات عملية على البرمجة بلغة Python'),
('2312204', 'البرمجة (2)', 'Programming (2)', 3, 'department_required', 108, 'البرمجة الكائنية التوجه (OOP) والمفاهيم المتقدمة'),
('2312205', 'مبادئ وأخلاقيات الذكاء الاصطناعي', 'AI Ethics & Principles', 3, 'department_required', 109, 'الأخلاقيات والمعايير القانونية والاجتماعية في تطبيقات الذكاء الاصطناعي'),
('2312206', 'هياكل البيانات والخوارزميات', 'Data Structures & Algorithms', 3, 'department_required', 110, 'القوائم، المكدسات، الطوابير، الأشجار، خوارزميات الفرز والبحث'),
('2312207', 'مختبر هياكل البيانات', 'Data Structures Lab', 1, 'department_required', 111, 'تنفيذ هياكل البيانات والخوارزميات عملياً'),
('2312301', 'تحليل وتصميم الخوارزميات', 'Algorithm Analysis & Design', 3, 'department_required', 112, 'تحليل التعقيد، البرمجة الديناميكية، الخوارزميات الجشعة'),
('2312302', 'إنترنت الأشياء', 'Internet of Things', 3, 'department_required', 113, 'مفاهيم IoT، البروتوكولات، الحساسات، التطبيقات الذكية'),
('2312303', 'نظم التشغيل', 'Operating Systems', 3, 'department_required', 114, 'إدارة العمليات، الذاكرة، الملفات، التزامن، الجدولة'),
('2312304', 'الشبكات الحاسوبية', 'Computer Networks', 3, 'department_required', 115, 'نموذج OSI، TCP/IP، البروتوكولات، توجيه الحزم'),
('2312305', 'معمارية الحاسوب', 'Computer Architecture', 3, 'department_required', 116, 'وحدة المعالجة المركزية، الذاكرة، الإدخال/الإخراج'),
('2312306', 'موضوعات خاصة في الذكاء الاصطناعي (1)', 'Special Topics in AI (1)', 3, 'department_required', 117, 'موضوعات حديثة ومتطورة في مجال الذكاء الاصطناعي'),
('2312307', 'تطبيقات الذكاء الاصطناعي في أمن المعلومات', 'AI Applications in Information Security', 3, 'department_required', 118, 'استخدام تقنيات الذكاء الاصطناعي للكشف عن التهديدات السيبرانية'),
('2312311', 'قواعد البيانات', 'Databases', 2, 'department_required', 119, 'نموذج العلاقات، SQL، التطبيع، تصميم قواعد البيانات'),
('2312312', 'مختبر قواعد البيانات', 'Database Lab', 1, 'department_required', 120, 'تطبيقات عملية على SQL وإدارة قواعد البيانات'),
('2312401', 'الروبوتات', 'Robotics', 3, 'department_required', 121, 'تصميم وبرمجة الروبوتات والتحكم بالحركة والاستشعار'),
('2312402', 'الشبكات العصبونية', 'Neural Networks', 3, 'department_required', 122, 'الشبكات العصبية الاصطناعية، Perceptron، Backpropagation، CNN'),
('2312404', 'تعلم الآلة', 'Machine Learning', 3, 'department_required', 123, 'خوارزميات التعلم الموجه وغير الموجه، التقييم، Scikit-learn'),
('2312407', 'معالجة اللغات الطبيعية', 'Natural Language Processing', 3, 'department_required', 124, 'معالجة النصوص، التضمين، النماذج اللغوية، التحليل الدلالي'),
('2312408', 'التعرف على الأنماط', 'Pattern Recognition', 3, 'department_required', 125, 'استخلاص الميزات، التصنيف، التجميع، تطبيقات التعرف على الصور'),
('2312409', 'التعلم العميق', 'Deep Learning', 3, 'department_required', 126, 'الشبكات العصبية العميقة، CNN، RNN، Transformers'),
('2312410', 'البيانات الكبيرة', 'Big Data', 3, 'department_required', 127, 'Hadoop، Spark، معالجة البيانات الضخمة الموزعة');

-- متطلبات التخصص - اختياري (12 من 18)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, display_order, description_ar) VALUES
('2312403', 'النظم التوصية', 'Recommendation Systems', 3, 'department_elective', 200, 'خوارزميات التوصية، التصفية التعاونية، التطبيقات التجارية'),
('2312405', 'موضوعات خاصة في الذكاء الاصطناعي (2)', 'Special Topics in AI (2)', 3, 'department_elective', 201, 'موضوعات بحثية متقدمة'),
('2312406', 'الواقع الافتراضي', 'Virtual Reality', 3, 'department_elective', 202, 'تقنيات الواقع الافتراضي، الرسوميات ثلاثية الأبعاد، التفاعل'),
('2312411', 'الرؤية الحاسوبية', 'Computer Vision', 3, 'department_elective', 203, 'معالجة الصور، اكتشاف الأشياء، التعرف على الوجوه'),
('2312412', 'التدريب العملي', 'Practical Training', 3, 'department_elective', 204, 'تدريب ميداني في شركة أو مؤسسة'),
('2312413', 'مشروع التخرج', 'Graduation Project', 3, 'department_elective', 205, 'مشروع تطبيقي شامل في الذكاء الاصطناعي');

-- مواد استدراكية (9)
INSERT INTO public.aut_courses (course_code, course_name_ar, course_name_en, credits, category, display_order) VALUES
('2110101', 'عربي استدراكي', 'Remedial Arabic', 3, 'remedial', 300),
('2110102', 'إنجليزي استدراكي', 'Remedial English', 3, 'remedial', 301),
('2110103', 'حاسوب استدراكي', 'Remedial Computer', 3, 'remedial', 302);

-- تحديث جدول الطلبات
ALTER TABLE public.equivalency_requests
  ALTER COLUMN credits_cap SET DEFAULT 132,
  ADD COLUMN IF NOT EXISTS extraction_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS extraction_raw_text text,
  ADD COLUMN IF NOT EXISTS previous_university text,
  ADD COLUMN IF NOT EXISTS previous_major_name text,
  ADD COLUMN IF NOT EXISTS transfer_semester text,
  ADD COLUMN IF NOT EXISTS transfer_type text;

UPDATE public.equivalency_requests SET credits_cap = 132 WHERE credits_cap IN (30, 66);

-- تحديث جدول مواد الطالب
ALTER TABLE public.equivalency_request_items
  ADD COLUMN IF NOT EXISTS source_grade_letter text,
  ADD COLUMN IF NOT EXISTS source_semester text;
