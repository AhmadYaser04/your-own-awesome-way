import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, string>;

const AR: Dict = {
  // Layout
  "nav.home": "الرئيسية",
  "nav.college": "كلية الذكاء الاصطناعي",
  "nav.equivalency": "معادلة المواد",
  "nav.about": "حول المشروع",
  "nav.faq": "الأسئلة الشائعة",
  "header.title": "جامعة العقبة للتكنولوجيا",
  "header.subtitle": "نظام معادلة المواد الذكي",
  "header.menu": "القائمة",
  "header.toggleLang": "English",
  "footer.uni": "جامعة العقبة للتكنولوجيا",
  "footer.copy": "© 2026 نظام معادلة المواد الذكي - مشروع تخرج تخصص الذكاء الاصطناعي",
  "footer.poweredBy": "مدعوم بالذكاء الاصطناعي عبر Lovable AI",
  "footer.officialSite": "الموقع الرسمي للجامعة",
  "theme.toLight": "تفعيل الوضع الفاتح",
  "theme.toDark": "تفعيل الوضع الغامق",

  // Home
  "home.badge": "مشروع تخرج · تخصص الذكاء الاصطناعي · جامعة العقبة للتكنولوجيا",
  "home.title": "نظام معادلة المواد الذكي",
  "home.tagline": "قارن وصف المواد الدراسية باستخدام الذكاء الاصطناعي واحصل على نتيجة فورية",
  "home.subtagline": "من ميثاق جامعتك السعودية إلى ميثاق جامعة العقبة للتكنولوجيا — لتخصص الذكاء الاصطناعي حصراً",
  "home.cta.start": "ابدأ المعادلة الآن",
  "home.cta.explore": "استكشف خطة التخصص",
  "home.how": "كيف يعمل النظام؟",
  "home.howSub": "ثلاث خطوات بسيطة للحصول على معادلتك",
  "home.step1.t": "1 · أدخل وصف المادة (نص / PDF / صورة)",
  "home.step1.d": "ألصق نصاً أو ارفع ملف PDF أو صورة من الهاتف لوصف المادة من ميثاق جامعتك السعودية.",
  "home.step2.t": "2 · يقارنها الذكاء الاصطناعي",
  "home.step2.d": "نموذج Gemini يحلل النص ويقارنه دلالياً مع كل مواد خطة الذكاء الاصطناعي في AUT.",
  "home.step3.t": "3 · احصل على نتيجة فورية",
  "home.step3.d": "نسبة تطابق دقيقة، أفضل المواد المُعادِلة، تبرير واضح وحكم نهائي.",
  "home.collegeBadge": "التخصص المُعتمد للمعادلة",
  "home.collegeTitle": "كلية الذكاء الاصطناعي",
  "home.collegeDesc": "هذا النظام مخصص حصراً لمعادلة مواد طلاب علم الحاسوب/الذكاء الاصطناعي في الجامعات السعودية إلى خطة البكالوريوس في الذكاء الاصطناعي بكلية تكنولوجيا المعلومات في جامعة العقبة للتكنولوجيا (تأسس البرنامج عام 2019).",
  "home.collegeBtn": "تصفح الخطة الدراسية الكاملة",
  "home.statsTitle": "إحصائيات النظام",
  "home.stat.spec": "تخصص (الذكاء الاصطناعي)",
  "home.stat.courses": "مادة في الخطة الدراسية",
  "home.stat.engine": "محرك معادلة دلالي",
  "home.stat.speed": "ثانية لكل معادلة",

  // Equivalency
  "eq.back": "← الرئيسية",
  "eq.badge": "تخصص الذكاء الاصطناعي",
  "eq.title": "معادلة المواد الذكية",
  "eq.subtitle": "من ميثاق جامعتك السعودية إلى ميثاق جامعة العقبة للتكنولوجيا",
  "eq.tab.text": "نص",
  "eq.tab.pdf": "ملف PDF",
  "eq.tab.image": "صورة",
  "eq.text.label": "الصق وصف المادة من الميثاق السعودي",
  "eq.text.sample": "تجربة مثال",
  "eq.text.placeholder": "الصق هنا وصف المادة كاملاً: اسم المادة، الساعات المعتمدة، المخرجات التعليمية، والمواضيع التي تغطيها...",
  "eq.text.charCount": "حرف",
  "eq.pdf.label": "ارفع ملف PDF لوصف المادة (حتى 10MB)",
  "eq.pdf.cta": "اختر ملف PDF أو اسحبه هنا",
  "eq.pdf.hint": "سيستخرج النظام النص تلقائياً ثم يجري المعادلة.",
  "eq.image.label": "ارفع صورة من الهاتف أو الكاميرا (JPG/PNG)",
  "eq.image.cta": "اختر صورة أو التقطها بالكاميرا",
  "eq.image.hint": "نستخدم الذكاء الاصطناعي البصري لقراءة النص العربي/الإنجليزي من الصورة.",
  "eq.fileSelected": "الملف المختار:",
  "eq.remove": "إزالة",
  "eq.analyze": "حلّل وأعِد المعادلة",
  "eq.analyzing": "جارٍ التحليل...",
  "eq.extracting": "جارٍ استخراج النص من الملف...",
  "eq.error": "خطأ",
  "eq.toast.shortTitle": "النص قصير جداً",
  "eq.toast.shortDesc": "يرجى لصق وصف المادة كاملاً (20 حرفاً على الأقل).",
  "eq.toast.noFileTitle": "لم يتم اختيار ملف",
  "eq.toast.noFileDesc": "يرجى اختيار ملف للمتابعة.",
  "eq.toast.failTitle": "تعذّر إجراء المعادلة",
  "eq.tip.title": "كيف تحصل على أفضل نتيجة؟",
  "eq.tip.desc": "ادخل وصف المادة كاملاً (نص / PDF / صورة) متضمناً: اسم المادة، الساعات المعتمدة، المخرجات التعليمية، والمواضيع. كلما كان الوصف أدق، كانت النتيجة أعلى دقة.",
  "eq.verdictLabel": "القرار النهائي",
  "eq.overall": "نسبة التطابق الإجمالية",
  "eq.bestMatches": "أفضل المواد المُعادِلة في AUT",
  "eq.matchPct": "تطابق",
  "eq.exploreMore": "استكشف باقي مواد التخصص",

  // College
  "college.back": "← الرئيسية",
  "college.facBadge": "كلية تكنولوجيا المعلومات",
  "college.title": "كلية الذكاء الاصطناعي",
  "college.intro": "تأسس قسم الذكاء الاصطناعي في بداية العام الدراسي 2019-2020، ويُعدّ من الأقسام الرائدة من نوعها في الأردن. يقدّم برنامج بكالوريوس شامل في الذكاء الاصطناعي يدمج الموضوعات النظرية المتقدمة بالتطبيقات العملية في مختلف القطاعات.",
  "college.founded": "سنة التأسيس",
  "college.totalCourses": "إجمالي المواد",
  "college.totalCredits": "ساعات معتمدة",
  "college.faculty": "هيئة تدريس متخصصة",
  "college.vision": "الرؤية",
  "college.visionTxt": "أن نكون قسماً أكاديمياً رائداً معترفاً به عالمياً للتميز في تعليم الذكاء الاصطناعي والبحث فيه، ودفع التقدم في تقنياته وتطبيقاته الأخلاقية.",
  "college.mission": "المهمة",
  "college.missionTxt": "تقديم تعليم عالي الجودة وإجراء أبحاث رائدة في مجال الذكاء الاصطناعي، وإعداد الطلاب ليصبحوا قادة مبتكرين يساهمون في التقدم التكنولوجي والمجتمعي.",
  "college.plan": "الخطة الدراسية",
  "college.planSub": "مواد تخصص الذكاء الاصطناعي المعتمدة لاستخدامها كمرجع في معادلة الشهادات السعودية",
  "college.startCta": "ابدأ معادلة مادتك الآن",
  "college.group.major": "مواد التخصص",
  "college.group.faculty": "متطلبات الكلية",
  "college.group.math": "الرياضيات",
  "college.courseCount": "مادة",
  "college.creditsLabel": "ساعات معتمدة",

  // FAQ heading
  "faq.title": "الأسئلة الشائعة عن المشروع",
  "faq.subtitle": "أكثر الأسئلة المتوقعة في مناقشة المشروع — مع إجاباتها التقنية والأكاديمية",

  // About heading
  "about.badge": "مشروع تخرج",
  "about.title": "حول المشروع",
  "about.subtitle": "نظام معادلة المواد الذكي — حلٌّ مدعوم بالذكاء الاصطناعي لمعادلة المواد الدراسية بين الجامعات السعودية وجامعة العقبة للتكنولوجيا في تخصص الذكاء الاصطناعي.",
};

const EN: Dict = {
  // Layout
  "nav.home": "Home",
  "nav.college": "AI College",
  "nav.equivalency": "Course Equivalency",
  "nav.about": "About",
  "nav.faq": "FAQ",
  "header.title": "Aqaba University of Technology",
  "header.subtitle": "AI-Powered Course Equivalency System",
  "header.menu": "Menu",
  "header.toggleLang": "العربية",
  "footer.uni": "Aqaba University of Technology",
  "footer.copy": "© 2026 AI Course Equivalency System — Graduation project, AI specialization",
  "footer.poweredBy": "Powered by Lovable AI",
  "footer.officialSite": "Official University Website",
  "theme.toLight": "Switch to light mode",
  "theme.toDark": "Switch to dark mode",

  // Home
  "home.badge": "Graduation Project · AI Specialization · Aqaba University of Technology",
  "home.title": "AI Course Equivalency System",
  "home.tagline": "Compare course descriptions using AI and get an instant result",
  "home.subtagline": "From your Saudi university charter to AUT's charter — exclusively for the AI specialization",
  "home.cta.start": "Start Equivalency Now",
  "home.cta.explore": "Explore the Curriculum",
  "home.how": "How does it work?",
  "home.howSub": "Three simple steps to get your equivalency",
  "home.step1.t": "1 · Provide the course description (text / PDF / image)",
  "home.step1.d": "Paste text or upload a PDF or a photo from your phone of the course description from your Saudi university charter.",
  "home.step2.t": "2 · AI compares it",
  "home.step2.d": "Gemini analyzes the description and compares it semantically against AUT's full AI curriculum.",
  "home.step3.t": "3 · Get an instant result",
  "home.step3.d": "Accurate similarity percentage, best matching AUT courses, clear justification, and a final verdict.",
  "home.collegeBadge": "Approved specialization",
  "home.collegeTitle": "AI College",
  "home.collegeDesc": "This system is exclusively dedicated to mapping CS/AI courses from Saudi universities to AUT's BSc program in Artificial Intelligence at the Faculty of Information Technology (program founded in 2019).",
  "home.collegeBtn": "Browse the Full Study Plan",
  "home.statsTitle": "System Stats",
  "home.stat.spec": "specialization (AI)",
  "home.stat.courses": "courses in the curriculum",
  "home.stat.engine": "Semantic equivalency engine",
  "home.stat.speed": "seconds per equivalency",

  // Equivalency
  "eq.back": "← Home",
  "eq.badge": "AI Specialization",
  "eq.title": "Smart Course Equivalency",
  "eq.subtitle": "From your Saudi university charter to AUT's charter",
  "eq.tab.text": "Text",
  "eq.tab.pdf": "PDF File",
  "eq.tab.image": "Image",
  "eq.text.label": "Paste the course description from the Saudi charter",
  "eq.text.sample": "Try a sample",
  "eq.text.placeholder": "Paste the full course description here: course name, credit hours, learning outcomes, and topics covered...",
  "eq.text.charCount": "characters",
  "eq.pdf.label": "Upload a PDF of the course description (up to 10MB)",
  "eq.pdf.cta": "Choose a PDF or drop it here",
  "eq.pdf.hint": "We'll automatically extract the text and run the equivalency.",
  "eq.image.label": "Upload an image from your phone or camera (JPG/PNG)",
  "eq.image.cta": "Choose an image or take a photo",
  "eq.image.hint": "We use vision AI to read Arabic/English text from the image.",
  "eq.fileSelected": "Selected file:",
  "eq.remove": "Remove",
  "eq.analyze": "Analyze & Run Equivalency",
  "eq.analyzing": "Analyzing...",
  "eq.extracting": "Extracting text from the file...",
  "eq.error": "Error",
  "eq.toast.shortTitle": "Text too short",
  "eq.toast.shortDesc": "Please paste the full course description (at least 20 characters).",
  "eq.toast.noFileTitle": "No file selected",
  "eq.toast.noFileDesc": "Please select a file to continue.",
  "eq.toast.failTitle": "Equivalency failed",
  "eq.tip.title": "How to get the best result?",
  "eq.tip.desc": "Provide the full course description (text / PDF / image) including: course name, credit hours, learning outcomes, and topics. The more detailed the input, the more accurate the result.",
  "eq.verdictLabel": "Final Verdict",
  "eq.overall": "Overall Similarity",
  "eq.bestMatches": "Top Matching AUT Courses",
  "eq.matchPct": "match",
  "eq.exploreMore": "Explore the rest of the curriculum",

  // College
  "college.back": "← Home",
  "college.facBadge": "Faculty of Information Technology",
  "college.title": "AI College",
  "college.intro": "The AI department was founded at the start of the 2019-2020 academic year and is one of the leading departments of its kind in Jordan. It offers a comprehensive BSc program in Artificial Intelligence that combines advanced theoretical topics with practical applications across various sectors.",
  "college.founded": "Founded",
  "college.totalCourses": "Total Courses",
  "college.totalCredits": "Credit Hours",
  "college.faculty": "Specialized Faculty",
  "college.vision": "Vision",
  "college.visionTxt": "To be a globally recognized leading academic department for excellence in AI education and research, advancing its technologies and ethical applications.",
  "college.mission": "Mission",
  "college.missionTxt": "To deliver high-quality education and conduct pioneering research in AI, preparing students to become innovative leaders contributing to technological and societal progress.",
  "college.plan": "Study Plan",
  "college.planSub": "AI specialization courses used as the reference for equivalency of Saudi credentials",
  "college.startCta": "Start Equivalency Now",
  "college.group.major": "Major Courses",
  "college.group.faculty": "Faculty Requirements",
  "college.group.math": "Mathematics",
  "college.courseCount": "course(s)",
  "college.creditsLabel": "credit hours",

  // FAQ heading
  "faq.title": "Project FAQ",
  "faq.subtitle": "The most expected questions in the project defense — with technical and academic answers",

  // About heading
  "about.badge": "Graduation Project",
  "about.title": "About the Project",
  "about.subtitle": "AI Course Equivalency System — an AI-powered solution for mapping courses between Saudi universities and Aqaba University of Technology in the AI specialization.",
};

const DICTS: Record<Lang, Dict> = { ar: AR, en: EN };

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    return (localStorage.getItem("lang") as Lang) || "ar";
  });

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem("lang", lang);
  }, [lang, dir]);

  const setLang = (l: Lang) => setLangState(l);
  const toggle = () => setLangState((p) => (p === "ar" ? "en" : "ar"));
  const t = (key: string) => DICTS[lang][key] ?? DICTS.ar[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
