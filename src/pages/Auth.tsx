import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, LogIn, UserPlus, ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock, User as UserIcon, KeyRound, Copy, Check, Zap } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/i18n/LanguageProvider";

const DEMO_ACCOUNTS = [
  { role: "admin" as const, email: "admin@aut.test", password: "admin123", labelAr: "مسؤول لجنة المعادلات", labelEn: "Committee Admin" },
  { role: "student" as const, email: "student@aut.test", password: "student123", labelAr: "حساب طالب", labelEn: "Student Account" },
];

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const locState = (location.state as { from?: string; requireAdmin?: boolean; notAdmin?: boolean } | null) || {};
  const adminFlow = !!locState.requireAdmin;
  const from = locState.from || (adminFlow ? "/admin" : "/equivalency");

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Sign in form
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");

  // Sign up form
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPwd, setSuPwd] = useState("");

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const doSignIn = async (email: string, password: string) => {
    setErr(null);
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErr(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast({ title: t("auth.welcomeBack") });
    navigate(from, { replace: true });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSignIn(siEmail, siPwd);
  };

  const fillAndLogin = async (email: string, password: string) => {
    setSiEmail(email);
    setSiPwd(password);
    setTab("signin");
    await doSignIn(email, password);
  };

  const [copied, setCopied] = useState<string | null>(null);
  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const parsed = signUpSchema.safeParse({
      full_name: suName,
      email: suEmail,
      password: suPwd,
    });
    if (!parsed.success) {
      setErr(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
        },
      },
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    toast({ title: t("auth.created"), description: t("auth.createdDesc") });
    navigate(from, { replace: true });
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/" className="inline-block text-primary-foreground/70 hover:text-primary-foreground text-sm mb-3">
            {t("eq.back")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="bg-primary-foreground/15 backdrop-blur-md p-4 rounded-2xl">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{t("auth.title")}</h1>
              <p className="text-primary-foreground/85 text-sm md:text-base mt-1">{t("auth.subtitle")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 max-w-xl">
        {/* DEMO ACCOUNTS — quick access for project discussion */}
        <Card className="mb-5 p-5 border-2 border-gold/50 bg-gradient-to-br from-gold/10 via-card to-primary/5 shadow-warm">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-gold text-gold-foreground p-1.5 rounded-lg">
              <KeyRound className="h-4 w-4" />
            </div>
            <h3 className="font-heading font-bold text-foreground text-sm md:text-base">
              {dir === "rtl" ? "حسابات تجريبية للمناقشة" : "Demo accounts for review"}
            </h3>
            <span className="text-[10px] font-bold bg-gold/20 text-gold-foreground px-2 py-0.5 rounded-full">
              {dir === "rtl" ? "اختصار" : "Shortcut"}
            </span>
          </div>
          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <div
                key={acc.email}
                className="rounded-xl border bg-card/80 backdrop-blur-sm p-3 flex flex-col sm:flex-row sm:items-center gap-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {acc.role === "admin" ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-gold shrink-0" />
                    ) : (
                      <UserIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    <span className="font-heading font-bold text-xs text-foreground">
                      {dir === "rtl" ? acc.labelAr : acc.labelEn}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyText(acc.email, `${acc.role}-email`)}
                      className="text-[11px] font-mono text-start truncate bg-muted hover:bg-accent px-2 py-1 rounded flex items-center justify-between gap-1 transition"
                      dir="ltr"
                    >
                      <span className="truncate">{acc.email}</span>
                      {copied === `${acc.role}-email` ? (
                        <Check className="h-3 w-3 text-success shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-50 shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(acc.password, `${acc.role}-pwd`)}
                      className="text-[11px] font-mono text-start truncate bg-muted hover:bg-accent px-2 py-1 rounded flex items-center justify-between gap-1 transition"
                      dir="ltr"
                    >
                      <span className="truncate">{acc.password}</span>
                      {copied === `${acc.role}-pwd` ? (
                        <Check className="h-3 w-3 text-success shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-50 shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fillAndLogin(acc.email, acc.password)}
                  disabled={busy}
                  className={
                    acc.role === "admin"
                      ? "bg-gold text-gold-foreground hover:bg-gold/90 gap-1.5 shrink-0"
                      : "gap-1.5 shrink-0"
                  }
                >
                  <Zap className="h-3.5 w-3.5" />
                  {dir === "rtl" ? "دخول سريع" : "Quick login"}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
            {dir === "rtl"
              ? "اضغط على البريد أو كلمة السر لنسخها، أو على «دخول سريع» للدخول مباشرة."
              : "Tap email/password to copy, or use \"Quick login\" to sign in instantly."}
          </p>
        </Card>

        {adminFlow && (
          <Alert className="mb-5 border-2 border-gold/60 bg-gold/10">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <AlertDescription className="font-heading text-sm">
              <strong>{t("auth.adminBannerTitle")}</strong>
              <br />
              {locState.notAdmin ? t("auth.adminBannerDeniedDesc") : t("auth.adminBannerDesc")}
            </AlertDescription>
          </Alert>
        )}
        <Card className="p-6 md:p-8 border-2 shadow-elegant">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "signin" | "signup"); setErr(null); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="gap-2">
                <LogIn className="h-4 w-4" /> {t("auth.signin")}
              </TabsTrigger>
              <TabsTrigger value="signup" className="gap-2">
                <UserPlus className="h-4 w-4" /> {t("auth.signup")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field id="si-email" label={t("auth.email")} icon={Mail}>
                  <Input id="si-email" type="email" autoComplete="email" required value={siEmail} onChange={(e) => setSiEmail(e.target.value)} dir="ltr" />
                </Field>
                <Field id="si-pwd" label={t("auth.password")} icon={Lock}>
                  <Input id="si-pwd" type="password" autoComplete="current-password" required value={siPwd} onChange={(e) => setSiPwd(e.target.value)} dir="ltr" />
                </Field>
                {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
                <Button type="submit" className="w-full gap-2" size="lg" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {t("auth.signin")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <Field id="su-name" label={t("auth.fullName")} icon={UserIcon}>
                  <Input id="su-name" type="text" required value={suName} onChange={(e) => setSuName(e.target.value)} />
                </Field>
                <Field id="su-email" label={t("auth.email")} icon={Mail}>
                  <Input id="su-email" type="email" autoComplete="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} dir="ltr" />
                </Field>
                <Field id="su-pwd" label={t("auth.password")} icon={Lock}>
                  <Input id="su-pwd" type="password" autoComplete="new-password" required value={suPwd} onChange={(e) => setSuPwd(e.target.value)} dir="ltr" />
                  <p className="text-xs text-muted-foreground mt-1">{t("auth.pwdHint")}</p>
                </Field>
                {err && <Alert variant="destructive"><AlertDescription>{err}</AlertDescription></Alert>}
                <Button type="submit" className="w-full gap-2" size="lg" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {t("auth.createAcct")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-5 leading-relaxed">
          {t("auth.notice")}
        </p>
      </section>
    </SiteLayout>
  );
}

function Field({
  id, label, icon: Icon, children,
}: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-2 font-heading">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      {children}
    </div>
  );
}
