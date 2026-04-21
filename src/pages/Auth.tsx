import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, LogIn, UserPlus, ArrowLeft, ArrowRight, ShieldCheck, Mail, Lock, User as UserIcon, Building2 } from "lucide-react";
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

const signInSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  saudi_university: z.string().trim().min(2).max(150),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const from = (location.state as { from?: string } | null)?.from || "/equivalency";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Sign in form
  const [siEmail, setSiEmail] = useState("");
  const [siPwd, setSiPwd] = useState("");

  // Sign up form
  const [suName, setSuName] = useState("");
  const [suUni, setSuUni] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPwd, setSuPwd] = useState("");

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true });
  }, [user, loading, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPwd });
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const parsed = signUpSchema.safeParse({
      full_name: suName,
      saudi_university: suUni,
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
          saudi_university: parsed.data.saudi_university,
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
                <Field id="su-uni" label={t("auth.saudiUni")} icon={Building2}>
                  <Input id="su-uni" type="text" required value={suUni} onChange={(e) => setSuUni(e.target.value)} placeholder={t("auth.saudiUniPh")} />
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
