import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, AlertCircle, Brain, ArrowLeft, ArrowRight,
  Upload, Image as ImageIcon, FileType2, X, Plus, Trash2, Save, LogIn,
  GraduationCap, FileText, CheckCircle2, Wand2,
} from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/i18n/LanguageProvider";
import { useAuth } from "@/hooks/useAuth";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const BUCKET = "equivalency-uploads";

type TransferType = "same_major" | "different_major";
type InputMode = "manual" | "file";

const SAME_MAJOR_CAP = 66;
const DIFFERENT_MAJOR_CAP = 30;

interface CourseRow {
  source_course_name: string;
  source_credits: number;
}

const emptyRow = (): CourseRow => ({
  source_course_name: "",
  source_credits: 3,
});

export default function Equivalency() {
  const { dir, lang } = useLang();
  const { user, role } = useAuth();
  const nav = useNavigate();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const isAr = lang === "ar";
  const isManualFallbackError = (payload?: { error?: string | null; errorCode?: string | null; allowManualEntry?: boolean | null } | null) => {
    if (!payload) return false;
    return Boolean(payload.allowManualEntry)
      || payload.errorCode === "AI_BALANCE_EXHAUSTED"
      || isAiCreditError(payload.error);
  };
  const isAiCreditError = (message?: string | null) => {
    if (!message) return false;
    return message.includes("402") || message.includes("تم استنفاد رصيد الذكاء الاصطناعي");
  };

  // ============ بيانات الطالب المبسطة ============
  const [studentFullName, setStudentFullName] = useState("");
  const [studentCollege, setStudentCollege] = useState("");
  const [studentMajor, setStudentMajor] = useState(""); // التخصص الجديد في AUT (يظهر فقط لو مختلف)
  const [previousUniversity, setPreviousUniversity] = useState(""); // الجامعة السابقة
  const [previousMajorName, setPreviousMajorName] = useState(""); // التخصص السابق
  const [transferSemester, setTransferSemester] = useState(""); // فصل الانتقال
  const [transferType, setTransferType] = useState<TransferType>("different_major");

  // ============ وضع الإدخال: يدوي أو ملف ============
  const [inputMode, setInputMode] = useState<InputMode>("manual");

  // ============ ملف كشف المواد + الاستخراج ============
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedCourses, setExtractedCourses] = useState<CourseRow[]>([]);
  const [extractionDone, setExtractionDone] = useState(false);
  const [rawText, setRawText] = useState<string>("");

  // ============ حالات الإرسال ============
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // الحد الأقصى للساعات حسب نوع الانتقال
  const creditsCap = transferType === "same_major" ? SAME_MAJOR_CAP : DIFFERENT_MAJOR_CAP;

  const totalSourceCredits = extractedCourses.reduce((s, r) => s + (Number(r.source_credits) || 0), 0);

  const updateRow = (i: number, patch: Partial<CourseRow>) => {
    setExtractedCourses((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => setExtractedCourses((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setExtractedCourses((prev) => prev.filter((_, idx) => idx !== i));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      toast({
        title: isAr ? "حجم الملف كبير" : "File too large",
        description: isAr ? "الحد الأقصى 50 ميجابايت" : "Maximum 50MB",
        variant: "destructive",
      });
      return;
    }
    setFile(f);
    setExtractionDone(false);
    setExtractedCourses([]);
    if (f.type.startsWith("image/")) {
      setFilePreviewUrl(URL.createObjectURL(f));
    } else {
      setFilePreviewUrl(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreviewUrl(null);
    setExtractionDone(false);
    setExtractedCourses([]);
    setRawText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ============ رفع الملف + استدعاء extract-courses ============
  const handleExtract = async () => {
    if (!file || !user) {
      toast({
        title: isAr ? "لا يوجد ملف" : "No file",
        description: isAr ? "يرجى رفع ملف الكشف أولاً" : "Please upload a transcript first",
        variant: "destructive",
      });
      return;
    }
    setExtracting(true);
    setError(null);

    try {
      // 1) ارفع الملف إلى Storage
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/extract-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      // 2) أنشئ رابط موقّع لمدة ساعة
      const { data: signed, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60);
      if (signErr || !signed?.signedUrl) throw signErr || new Error("فشل إنشاء الرابط");

      // 3) استدعِ Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke("extract-courses", {
        body: { fileUrl: signed.signedUrl },
      });
      if (fnErr) throw fnErr;
      if (data?.error) {
        if (isManualFallbackError(data)) {
          setError(isAr
            ? (data.error || "تعذر تشغيل الاستخراج الذكي حالياً. يمكنك متابعة الطلب عبر إدخال المواد يدوياً.")
            : (data.error || "Automatic extraction is unavailable right now. You can continue with manual entry."));
          setExtractedCourses([]);
          setRawText("");
          setExtractionDone(false);
          return;
        }

        throw new Error(data.error);
      }

      const list: CourseRow[] = (data?.courses ?? []).map((c: any) => ({
        source_course_name: c.name ?? "",
        source_credits: Number(c.credits ?? 3) || 3,
      }));

      setExtractedCourses(list.length > 0 ? list : [emptyRow()]);
      setRawText(data?.rawText ?? "");
      setExtractionDone(true);

      toast({
        title: isAr ? "تم الاستخراج" : "Extraction complete",
        description: isAr
          ? `تم العثور على ${list.length} مادة. راجعها وعدّلها قبل الإرسال.`
          : `Found ${list.length} courses. Review and edit before submitting.`,
      });
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      if (isAiCreditError(msg)) {
        setError(isAr
          ? "نفد رصيد الاستخراج الذكي حالياً. يمكنك متابعة الطلب عبر إدخال المواد يدوياً."
          : "AI extraction balance is exhausted right now. You can continue by entering courses manually.");
      } else {
        setError(msg);
      }
      toast({ title: isAr ? "فشل الاستخراج" : "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const handleEnableManualEntry = () => {
    setExtractedCourses((prev) => (prev.length > 0 ? prev : [emptyRow()]));
    setExtractionDone(true);
    setRawText("");
    toast({
      title: isAr ? "تم تفعيل الإدخال اليدوي" : "Manual entry enabled",
      description: isAr ? "أدخل المواد يدوياً ثم أرسل الطلب." : "Enter courses manually, then submit the request.",
    });
  };

  // ============ الإرسال النهائي ============
  const validate = (): string | null => {
    if (!studentFullName.trim()) return isAr ? "اسم الطالب مطلوب" : "Student name required";
    if (!studentCollege.trim()) return isAr ? "الكلية مطلوبة" : "College required";
    if (transferType === "different_major" && !studentMajor.trim()) {
      return isAr ? "التخصص الجديد مطلوب" : "New major required";
    }
    if (!previousUniversity.trim()) return isAr ? "الجامعة السابقة مطلوبة" : "Previous university required";
    if (inputMode === "file" && !file) {
      return isAr ? "يرجى رفع كشف المواد أو التبديل للإدخال اليدوي" : "Upload a transcript or switch to manual entry";
    }
    if (extractedCourses.length === 0) {
      return isAr ? "لا توجد مواد للمعادلة — أضف مادة واحدة على الأقل" : "Add at least one course";
    }
    if (extractedCourses.some((r) => !r.source_course_name.trim())) {
      return isAr ? "اسم كل مادة مطلوب" : "Each course must have a name";
    }
    return null;
  };

  const handleSubmit = async () => {
    console.log("[Equivalency] Submit clicked", {
      hasUser: !!user,
      extractionDone,
      coursesCount: extractedCourses.length,
    });
    if (!user) {
      nav("/auth");
      return;
    }
    const v = validate();
    if (v) {
      console.warn("[Equivalency] Validation failed:", v);
      setError(v);
      toast({
        title: isAr ? "تحقق من البيانات" : "Validation",
        description: v,
        variant: "destructive",
      });
      // مرّر التركيز لأعلى الصفحة ليرى المستخدم الخطأ
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // ارفع الملف للأرشيف الدائم — الفشل لا يمنع الإرسال
      let uploadedFileUrl: string | null = null;
      if (file) {
        try {
          const ext = file.name.split(".").pop() || "bin";
          const path = `${user.id}/request-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) {
            console.warn("[Equivalency] Archive upload failed (non-blocking):", upErr);
          } else {
            uploadedFileUrl = path;
          }
        } catch (archiveErr) {
          console.warn("[Equivalency] Archive upload exception (non-blocking):", archiveErr);
        }
      }

      // أنشئ الطلب
      const insertPayload = {
        user_id: user.id,
        student_full_name: studentFullName.trim(),
        student_college: studentCollege.trim(),
        student_major: (transferType === "same_major"
          ? (previousMajorName.trim() || studentMajor.trim() || "نفس التخصص")
          : studentMajor.trim()),
        previous_university: previousUniversity.trim(),
        previous_major_name: previousMajorName.trim() || null,
        transfer_semester: transferSemester.trim() || null,
        transfer_type: transferType,
        student_type: transferType,
        credits_cap: creditsCap,
        input_mode: inputMode,
        uploaded_file_url: uploadedFileUrl,
        extraction_status: "completed",
        extraction_raw_text: rawText.slice(0, 10000),
        ai_result: { extracted_count: extractedCourses.length },
        status: "pending" as const,
      };
      console.log("[Equivalency] Inserting request...", insertPayload);

      const { data: req, error: reqErr } = await supabase
        .from("equivalency_requests")
        .insert(insertPayload)
        .select("id")
        .single();
      if (reqErr) {
        console.error("[Equivalency] Insert request failed:", reqErr);
        throw reqErr;
      }
      console.log("[Equivalency] Request created:", req?.id);

      // أدرج المواد
      const items = extractedCourses.map((c, idx) => ({
        request_id: req.id,
        source_course_name: c.source_course_name.trim(),
        source_course_code: c.source_course_code.trim() || null,
        source_credits: Number(c.source_credits) || 3,
        source_grade: c.source_grade.trim() || null,
        source_semester: c.source_semester?.trim() || null,
        display_order: idx,
      }));
      console.log("[Equivalency] Inserting items:", items.length);
      const { error: itemsErr } = await supabase
        .from("equivalency_request_items")
        .insert(items);
      if (itemsErr) {
        console.error("[Equivalency] Insert items failed:", itemsErr);
        throw itemsErr;
      }

      const isAdmin = role === "admin";
      toast({
        title: isAdmin
          ? (isAr ? "تم إنشاء الطلب — انتقال للمعادلة" : "Request created — opening review")
          : (isAr ? "تم إرسال الطلب" : "Request submitted"),
        description: isAdmin
          ? (isAr ? "ابدأ المعادلة التلقائية الآن." : "Starting auto-match.")
          : (isAr ? "سيراجعه المرشد الأكاديمي قريباً." : "Your academic advisor will review it soon."),
      });
      nav(isAdmin ? `/admin/review/${req.id}` : "/my-requests");
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      console.error("[Equivalency] Submit failed:", e);
      setError(msg);
      toast({
        title: isAr ? "فشل الإرسال" : "Submission failed",
        description: msg,
        variant: "destructive",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SiteLayout>
        <div className="container mx-auto py-16 max-w-xl">
          <Card className="p-8 text-center space-y-4">
            <LogIn className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">{isAr ? "يجب تسجيل الدخول" : "Login required"}</h2>
            <p className="text-muted-foreground">
              {isAr ? "يرجى تسجيل الدخول لتقديم طلب معادلة." : "Please sign in to submit an equivalency request."}
            </p>
            <Button asChild><Link to="/auth">{isAr ? "تسجيل الدخول" : "Sign in"}</Link></Button>
          </Card>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto py-8 max-w-5xl space-y-6" dir={dir}>
        {/* العنوان */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3"><Brain className="h-7 w-7 text-primary" /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{isAr ? "طلب معادلة مواد" : "Course Equivalency Request"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "ارفع كشف المواد ليتم استخراجها ومعادلتها مع مواد جامعة العقبة." : "Upload your transcript to extract and match against AUT courses."}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{isAr ? "خطأ" : "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* القسم 1: بيانات الطالب */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{isAr ? "بيانات الطالب" : "Student Information"}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{isAr ? "الاسم الرباعي *" : "Full Name *"}</Label>
              <Input value={studentFullName} onChange={(e) => setStudentFullName(e.target.value)}
                placeholder={isAr ? "مثال: محمد أحمد سالم العتيبي" : "e.g. Mohammed Ahmed S. Al-Otaibi"} />
            </div>
            <div>
              <Label>{isAr ? "الكلية في AUT *" : "AUT College *"}</Label>
              <Input value={studentCollege} onChange={(e) => setStudentCollege(e.target.value)}
                placeholder={isAr ? "مثال: كلية تكنولوجيا المعلومات" : "e.g. College of IT"} />
            </div>
            <div>
              <Label>{isAr ? "نوع الانتقال *" : "Transfer Type *"}</Label>
              <Select value={transferType} onValueChange={(v) => setTransferType(v as TransferType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_major">{isAr ? "نفس التخصص" : "Same major"}</SelectItem>
                  <SelectItem value="different_major">{isAr ? "تخصص مختلف" : "Different major"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {transferType === "different_major" && (
              <div>
                <Label>{isAr ? "التخصص الجديد في AUT *" : "New Major at AUT *"}</Label>
                <Input value={studentMajor} onChange={(e) => setStudentMajor(e.target.value)}
                  placeholder={isAr ? "مثال: الذكاء الاصطناعي" : "e.g. Artificial Intelligence"} />
              </div>
            )}
            <div>
              <Label>{isAr ? "الجامعة السابقة *" : "Previous University *"}</Label>
              <Input value={previousUniversity} onChange={(e) => setPreviousUniversity(e.target.value)}
                placeholder={isAr ? "اسم الجامعة/الكلية السابقة" : "Previous university/college name"} />
            </div>
            <div>
              <Label>{isAr ? "التخصص السابق" : "Previous Major"}</Label>
              <Input value={previousMajorName} onChange={(e) => setPreviousMajorName(e.target.value)}
                placeholder={isAr ? "مثال: علوم الحاسب" : "e.g. Computer Science"} />
            </div>
            <div>
              <Label>{isAr ? "فصل / سنة الانتقال" : "Transfer Semester / Year"}</Label>
              <Input value={transferSemester} onChange={(e) => setTransferSemester(e.target.value)}
                placeholder={isAr ? "مثال: الفصل الأول 2025-2026" : "e.g. Fall 2025-2026"} />
            </div>
          </div>

          {/* تنبيه الحد الأقصى للمعادلة */}
          <Alert className="border-2 border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertTitle className="font-bold">
              {isAr
                ? `الحد الأقصى لمعادلة المواد: ${creditsCap} ساعة`
                : `Equivalency cap: ${creditsCap} credit hours`}
            </AlertTitle>
            <AlertDescription className="text-xs">
              {transferType === "same_major"
                ? (isAr
                    ? "للطلاب المنتقلين من نفس التخصص، الحد الأقصى للساعات التي يمكن معادلتها هو 66 ساعة معتمدة."
                    : "For students transferring within the same major, up to 66 AUT credit hours can be equated.")
                : (isAr
                    ? "للطلاب المنتقلين من تخصص مختلف، الحد الأقصى للساعات التي يمكن معادلتها هو 30 ساعة معتمدة."
                    : "For students transferring from a different major, up to 30 AUT credit hours can be equated.")}
            </AlertDescription>
          </Alert>
        </Card>

        {/* القسم 2: طريقة إدخال المواد */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">{isAr ? "المواد المُجتازة *" : "Completed Courses *"}</h2>
          </div>

          {/* اختيار وضع الإدخال */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => {
                setInputMode("manual");
                if (extractedCourses.length === 0) setExtractedCourses([emptyRow()]);
                setExtractionDone(true);
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition ${
                inputMode === "manual" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              {isAr ? "إدخال يدوي" : "Manual entry"}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode("file");
                setExtractedCourses([]);
                setExtractionDone(false);
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition ${
                inputMode === "file" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="h-4 w-4" />
              {isAr ? "رفع ملف / صورة" : "Upload file / image"}
            </button>
          </div>

          {inputMode === "file" && (
            !file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:bg-muted/40 transition"
              >
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <div className="font-medium">{isAr ? "اضغط لرفع الملف" : "Click to upload file"}</div>
                <div className="text-xs text-muted-foreground mt-1">PDF / JPG / PNG / WEBP</div>
                <input ref={fileInputRef} type="file" hidden accept=".pdf,image/*" onChange={handleFileChange} />
              </div>
            ) : (
              <div className="border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  ) : (
                    <FileType2 className="h-6 w-6 text-primary" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}><X className="h-4 w-4" /></Button>
                </div>

                {filePreviewUrl && (
                  <img src={filePreviewUrl} alt="preview" className="max-h-60 rounded border mx-auto" />
                )}

                {!extractionDone ? (
                  <div className="space-y-3">
                    <Button onClick={handleExtract} disabled={extracting} className="w-full">
                      {extracting ? (
                        <><Loader2 className="me-2 h-4 w-4 animate-spin" /> {isAr ? "جاري الاستخراج..." : "Extracting..."}</>
                      ) : (
                        <><Wand2 className="me-2 h-4 w-4" /> {isAr ? "استخراج المواد" : "Extract Courses"}</>
                      )}
                    </Button>

                    {isAiCreditError(error) && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{isAr ? "الإدخال اليدوي متاح" : "Manual entry available"}</AlertTitle>
                        <AlertDescription className="space-y-3">
                          <p>
                            {isAr
                              ? "تعذر تشغيل الاستخراج الذكي حالياً، لكن يمكنك إدخال المواد بنفسك ومتابعة إرسال الطلب بدون توقف."
                              : "Automatic extraction is unavailable right now, but you can still enter courses manually and continue."}
                          </p>
                          <Button type="button" variant="outline" onClick={handleEnableManualEntry}>
                            <Plus className="me-2 h-4 w-4" />
                            {isAr ? "إدخال المواد يدوياً" : "Enter courses manually"}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    {isAr ? `تم استخراج ${extractedCourses.length} مادة` : `Extracted ${extractedCourses.length} courses`}
                  </div>
                )}
              </div>
            )
          )}

          {inputMode === "manual" && (
            <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
              {isAr
                ? "أدخل المواد التي اجتزتها يدوياً في الجدول أدناه. يمكنك إضافة المزيد من الصفوف."
                : "Enter your completed courses manually in the table below. You can add more rows."}
            </div>
          )}
        </Card>

        {/* القسم 3: المواد المستخرجة (قابلة للتعديل) */}
        {(extractionDone || extractedCourses.length > 0) && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                {isAr ? "المواد المستخرجة (قابلة للتعديل)" : "Extracted Courses (editable)"}
              </h2>
              <Badge className="ms-auto" variant="secondary">
                {isAr ? `الإجمالي: ${totalSourceCredits} ساعة` : `Total: ${totalSourceCredits}h`}
              </Badge>
            </div>



            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-start">#</th>
                    <th className="p-2 text-start">{isAr ? "اسم المادة" : "Course Name"}</th>
                    <th className="p-2 text-start">{isAr ? "الرمز" : "Code"}</th>
                    <th className="p-2 text-start">{isAr ? "الساعات" : "Credits"}</th>
                    <th className="p-2 text-start">{isAr ? "الدرجة" : "Grade"}</th>
                    <th className="p-2 text-start">{isAr ? "الفصل" : "Semester"}</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {extractedCourses.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 align-middle">{i + 1}</td>
                      <td className="p-2"><Input value={row.source_course_name}
                        onChange={(e) => updateRow(i, { source_course_name: e.target.value })} /></td>
                      <td className="p-2"><Input value={row.source_course_code}
                        onChange={(e) => updateRow(i, { source_course_code: e.target.value })}
                        className="w-24" /></td>
                      <td className="p-2"><Input type="number" min={1} max={6} step={0.5}
                        value={row.source_credits}
                        onChange={(e) => updateRow(i, { source_credits: Number(e.target.value) })}
                        className="w-20" /></td>
                      <td className="p-2"><Input value={row.source_grade}
                        onChange={(e) => updateRow(i, { source_grade: e.target.value })}
                        className="w-20" /></td>
                      <td className="p-2"><Input value={row.source_semester ?? ""}
                        onChange={(e) => updateRow(i, { source_semester: e.target.value })}
                        className="w-24" /></td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="me-2 h-4 w-4" /> {isAr ? "إضافة مادة يدوياً" : "Add row manually"}
            </Button>
          </Card>
        )}

        {/* الإرسال */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/my-requests"><Arrow className="me-2 h-4 w-4" /> {isAr ? "طلباتي" : "My Requests"}</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} type="button">
            {submitting ? (
              <><Loader2 className="me-2 h-4 w-4 animate-spin" /> {isAr ? "جاري الإرسال..." : "Submitting..."}</>
            ) : role === "admin" ? (
              <><Sparkles className="me-2 h-4 w-4" /> {isAr ? "بدء المعادلة التلقائية" : "Start Auto-match"}</>
            ) : (
              <><Save className="me-2 h-4 w-4" /> {isAr ? "إرسال الطلب للمرشد" : "Submit to Advisor"}</>
            )}
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
