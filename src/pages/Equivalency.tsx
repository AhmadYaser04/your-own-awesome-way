import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, Loader2, AlertCircle, Brain, ArrowLeft, ArrowRight,
  Upload, Image as ImageIcon, FileType2, X, Plus, Trash2, Save, LogIn,
  GraduationCap, FileText,
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

type StudentType = "same_major" | "different_major";

interface CourseRow {
  source_course_name: string;
  source_course_code: string;
  source_credits: number;
  source_grade: string;
}

const emptyRow = (): CourseRow => ({
  source_course_name: "",
  source_course_code: "",
  source_credits: 3,
  source_grade: "",
});

export default function Equivalency() {
  const { dir, lang } = useLang();
  const { user } = useAuth();
  const nav = useNavigate();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  // Student header
  const [studentFullName, setStudentFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentCollege, setStudentCollege] = useState("");
  const [studentMajor, setStudentMajor] = useState("");
  const [previousDiplomaSource, setPreviousDiplomaSource] = useState("");
  const [cumulativeGpa, setCumulativeGpa] = useState("");
  const [diplomaGpa, setDiplomaGpa] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [studentType, setStudentType] = useState<StudentType>("different_major");

  // Courses table
  const [rows, setRows] = useState<CourseRow[]>([emptyRow()]);

  // Optional file upload (transcript scan for advisor)
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creditsCap = studentType === "same_major" ? 66 : 30;
  const totalSourceCredits = rows.reduce((s, r) => s + (Number(r.source_credits) || 0), 0);

  const updateRow = (i: number, patch: Partial<CourseRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      toast({ title: "خطأ", description: lang === "ar" ? "الحد الأقصى 50MB" : "Max 50MB", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const validate = (): string | null => {
    if (!studentFullName.trim()) return lang === "ar" ? "اسم الطالب مطلوب" : "Student name is required";
    if (!previousDiplomaSource.trim()) return lang === "ar" ? "الجامعة/الدبلوم السابق مطلوب" : "Previous diploma source is required";
    const validRows = rows.filter((r) => r.source_course_name.trim().length > 0);
    if (validRows.length === 0) return lang === "ar" ? "أضف مادة واحدة على الأقل" : "Add at least one course";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!user) {
      toast({ title: lang === "ar" ? "سجّل دخولك أولاً" : "Please sign in first", variant: "destructive" });
      nav("/auth");
      return;
    }
    const err = validate();
    if (err) {
      setError(err);
      toast({ title: err, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 1) Optional: upload transcript file
      let uploadedFileUrl: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("equivalency-uploads")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        uploadedFileUrl = path;
      }

      // 2) Insert request
      const { data: reqData, error: reqErr } = await supabase
        .from("equivalency_requests")
        .insert({
          user_id: user.id,
          student_full_name: studentFullName.trim(),
          student_id: studentId.trim() || null,
          student_college: studentCollege.trim() || null,
          student_major: studentMajor.trim() || null,
          previous_diploma_source: previousDiplomaSource.trim(),
          cumulative_gpa: cumulativeGpa ? Number(cumulativeGpa) : null,
          diploma_gpa: diplomaGpa ? Number(diplomaGpa) : null,
          academic_year: academicYear.trim() || null,
          semester: semester.trim() || null,
          student_type: studentType,
          credits_cap: creditsCap,
          input_mode: file ? "file" : "manual",
          uploaded_file_url: uploadedFileUrl,
          ai_result: {} as never,
          status: "pending",
        })
        .select("id")
        .single();
      if (reqErr) throw reqErr;
      const requestId = reqData!.id;

      // 3) Insert items
      const validRows = rows.filter((r) => r.source_course_name.trim().length > 0);
      const itemsPayload = validRows.map((r, idx) => ({
        request_id: requestId,
        source_course_name: r.source_course_name.trim(),
        source_course_code: r.source_course_code.trim() || null,
        source_credits: Number(r.source_credits) || 0,
        source_grade: r.source_grade.trim() || null,
        display_order: idx,
      }));
      const { error: itemsErr } = await supabase
        .from("equivalency_request_items")
        .insert(itemsPayload);
      if (itemsErr) throw itemsErr;

      toast({
        title: lang === "ar" ? "تم إرسال طلبك بنجاح" : "Request submitted successfully",
        description: lang === "ar"
          ? "سيقوم المرشد الأكاديمي بمراجعة طلبك قريباً."
          : "Your academic advisor will review your request soon.",
      });
      nav("/my-requests");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      toast({ title: lang === "ar" ? "تعذّر إرسال الطلب" : "Failed to submit", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            ← {lang === "ar" ? "الرئيسية" : "Home"}
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl">
              <Brain className="h-10 w-10" />
            </div>
            <div>
              <Badge className="bg-gold text-gold-foreground border-0 mb-2">
                {lang === "ar" ? "نموذج معادلة المواد للطلبة المجسرين" : "Bridging Students Equivalency Form"}
              </Badge>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">
                {lang === "ar" ? "طلب معادلة مواد" : "Course Equivalency Request"}
              </h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1">
                {lang === "ar"
                  ? "أدخل بيانات الطالب ومواد الدبلوم السابقة، وسيقوم المرشد الأكاديمي بإجراء المعادلة الرسمية."
                  : "Provide student info and prior diploma courses; the academic advisor will perform the official equivalency."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-5xl space-y-6">
        {!user && (
          <Alert className="border-2 border-gold/40 bg-gold/5">
            <LogIn className="h-4 w-4" />
            <AlertTitle>{lang === "ar" ? "سجّل دخولك لتقديم الطلب" : "Sign in to submit a request"}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
              <span>{lang === "ar"
                ? "تحتاج لحساب طالب لتقديم طلب معادلة وحفظه في صفحة طلباتي."
                : "You need a student account to submit and track the request."}</span>
              <Button asChild size="sm">
                <Link to="/auth">{lang === "ar" ? "دخول" : "Sign in"}</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Section 1: Student header */}
        <Card className="p-6 md:p-7 border-2">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="font-heading font-bold text-lg text-foreground">
              {lang === "ar" ? "بيانات الطالب" : "Student Information"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>{lang === "ar" ? "اسم الطالب الكامل" : "Full Name"} *</Label>
              <Input value={studentFullName} onChange={(e) => setStudentFullName(e.target.value)} />
            </div>
            <div>
              <Label>{lang === "ar" ? "الرقم الجامعي" : "Student ID"}</Label>
              <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            </div>
            <div>
              <Label>{lang === "ar" ? "الكلية في AUT" : "AUT College"}</Label>
              <Input value={studentCollege} onChange={(e) => setStudentCollege(e.target.value)}
                placeholder={lang === "ar" ? "كلية تكنولوجيا المعلومات" : "Faculty of IT"} />
            </div>
            <div>
              <Label>{lang === "ar" ? "التخصص في AUT" : "AUT Major"}</Label>
              <Input value={studentMajor} onChange={(e) => setStudentMajor(e.target.value)}
                placeholder={lang === "ar" ? "الذكاء الاصطناعي" : "Artificial Intelligence"} />
            </div>
            <div className="md:col-span-2">
              <Label>{lang === "ar" ? "الجامعة / الدبلوم السابق" : "Previous University / Diploma"} *</Label>
              <Input value={previousDiplomaSource} onChange={(e) => setPreviousDiplomaSource(e.target.value)}
                placeholder={lang === "ar" ? "مثال: جامعة الملك سعود — دبلوم علوم الحاسب" : "e.g. King Saud University — CS Diploma"} />
            </div>
            <div>
              <Label>{lang === "ar" ? "المعدل التراكمي" : "Cumulative GPA"}</Label>
              <Input type="number" step="0.01" min="0" max="4" value={cumulativeGpa} onChange={(e) => setCumulativeGpa(e.target.value)} />
            </div>
            <div>
              <Label>{lang === "ar" ? "معدل الدبلوم" : "Diploma GPA"}</Label>
              <Input type="number" step="0.01" min="0" max="4" value={diplomaGpa} onChange={(e) => setDiplomaGpa(e.target.value)} />
            </div>
            <div>
              <Label>{lang === "ar" ? "العام الأكاديمي" : "Academic Year"}</Label>
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025/2026" />
            </div>
            <div>
              <Label>{lang === "ar" ? "الفصل" : "Semester"}</Label>
              <Input value={semester} onChange={(e) => setSemester(e.target.value)}
                placeholder={lang === "ar" ? "الأول / الثاني / الصيفي" : "1st / 2nd / Summer"} />
            </div>
            <div className="md:col-span-2">
              <Label>{lang === "ar" ? "نوع الانتقال" : "Transfer type"} *</Label>
              <Select value={studentType} onValueChange={(v) => setStudentType(v as StudentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_major">
                    {lang === "ar" ? "نفس التخصص — سقف 66 ساعة" : "Same major — cap 66 credits"}
                  </SelectItem>
                  <SelectItem value="different_major">
                    {lang === "ar" ? "تخصص مختلف — سقف 30 ساعة" : "Different major — cap 30 credits"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === "ar"
                  ? `الحد الأقصى للساعات المعادَلة: ${creditsCap} ساعة معتمدة.`
                  : `Maximum equivalent credits: ${creditsCap} credit hours.`}
              </p>
            </div>
          </div>
        </Card>

        {/* Section 2: Courses table */}
        <Card className="p-6 md:p-7 border-2">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-heading font-bold text-lg text-foreground">
                {lang === "ar" ? "مواد الدبلوم السابق" : "Prior Diploma Courses"}
              </h2>
              <Badge variant="outline">
                {rows.length} {lang === "ar" ? "مادة" : "courses"} · {totalSourceCredits} {lang === "ar" ? "ساعة" : "hrs"}
              </Badge>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-1">
              <Plus className="h-4 w-4" /> {lang === "ar" ? "إضافة مادة" : "Add course"}
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header row (md+) */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-bold text-muted-foreground px-2">
              <div className="md:col-span-5">{lang === "ar" ? "اسم المادة" : "Course name"}</div>
              <div className="md:col-span-2">{lang === "ar" ? "الرقم" : "Code"}</div>
              <div className="md:col-span-2">{lang === "ar" ? "الساعات" : "Credits"}</div>
              <div className="md:col-span-2">{lang === "ar" ? "العلامة" : "Grade"}</div>
              <div className="md:col-span-1"></div>
            </div>

            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 md:p-2 rounded-lg border bg-accent/20">
                <div className="md:col-span-5">
                  <Label className="md:hidden text-xs">{lang === "ar" ? "اسم المادة" : "Course name"}</Label>
                  <Input value={r.source_course_name} onChange={(e) => updateRow(i, { source_course_name: e.target.value })}
                    placeholder={lang === "ar" ? "مثال: مقدمة في الذكاء الاصطناعي" : "e.g. Introduction to AI"} />
                </div>
                <div className="md:col-span-2">
                  <Label className="md:hidden text-xs">{lang === "ar" ? "الرقم" : "Code"}</Label>
                  <Input value={r.source_course_code} onChange={(e) => updateRow(i, { source_course_code: e.target.value })}
                    placeholder="CS101" />
                </div>
                <div className="md:col-span-2">
                  <Label className="md:hidden text-xs">{lang === "ar" ? "الساعات" : "Credits"}</Label>
                  <Input type="number" min="0" max="10" step="1" value={r.source_credits}
                    onChange={(e) => updateRow(i, { source_credits: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <Label className="md:hidden text-xs">{lang === "ar" ? "العلامة" : "Grade"}</Label>
                  <Input value={r.source_grade} onChange={(e) => updateRow(i, { source_grade: e.target.value })}
                    placeholder="A / 85 / جيد جداً" />
                </div>
                <div className="md:col-span-1 flex md:justify-center">
                  <Button type="button" variant="ghost" size="sm" className="text-destructive"
                    onClick={() => removeRow(i)} disabled={rows.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {lang === "ar"
              ? "💡 لا حاجة لكتابة وصف المادة — المرشد الأكاديمي سيقوم بمطابقتها يدوياً مع مواد AUT."
              : "💡 No course description needed — the academic advisor will manually match each course to AUT courses."}
          </div>
        </Card>

        {/* Section 3: Optional transcript upload */}
        <Card className="p-6 md:p-7 border-2 border-dashed">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-secondary" />
            <h2 className="font-heading font-bold text-lg text-foreground">
              {lang === "ar" ? "رفع كشف العلامات (اختياري)" : "Upload Transcript (optional)"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === "ar"
              ? "ارفع صورة أو PDF لكشف علامات الدبلوم. يفيد المرشد الأكاديمي عند المراجعة، وسيتم استخراج المواد تلقائياً عبر OCR لاحقاً (حد أقصى 50MB)."
              : "Upload a transcript image or PDF. Helps the advisor during review; OCR auto-extraction available later (max 50MB)."}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:bg-accent/40 hover:border-primary transition-colors flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-foreground text-sm">
                {lang === "ar" ? "اختر ملف PDF أو صورة" : "Choose PDF or image"}
              </span>
              <span className="text-xs text-muted-foreground">PDF / JPG / PNG · 50MB</span>
            </button>
          ) : (
            <div className="border rounded-xl p-4 bg-accent/30 flex items-center gap-3">
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-8 w-8 text-primary shrink-0" />
              ) : (
                <FileType2 className="h-8 w-8 text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-heading font-bold text-foreground text-sm truncate">{file.name}</div>
                <div className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-destructive gap-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Errors */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{lang === "ar" ? "خطأ" : "Error"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {lang === "ar"
              ? `سيقوم المرشد الأكاديمي بمراجعة طلبك ضمن سقف ${creditsCap} ساعة معتمدة.`
              : `The advisor will review within a ${creditsCap}-credit cap.`}
          </div>
          <Button onClick={handleSubmit} disabled={submitting} size="lg" className="gap-2 shadow-elegant">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {submitting
              ? (lang === "ar" ? "جارٍ الإرسال..." : "Submitting...")
              : (lang === "ar" ? "إرسال الطلب للمرشد الأكاديمي" : "Submit to Academic Advisor")}
          </Button>
        </div>

        <div className="text-center pt-4">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/college">
              <Sparkles className="h-4 w-4" />
              {lang === "ar" ? "تصفح خطة AUT الكاملة" : "Browse AUT full curriculum"}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
