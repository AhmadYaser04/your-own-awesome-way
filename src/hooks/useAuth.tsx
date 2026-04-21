import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "user" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string): Promise<Role> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    if (!data || data.length === 0) return "user";
    if (data.some((r) => r.role === "admin")) return "admin";
    return "user";
  };

  const refreshRole = async () => {
    if (!user) return setRole(null);
    setRole(await fetchRole(user.id));
  };

  useEffect(() => {
    // Set listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // defer Supabase call to avoid recursion
        setTimeout(() => {
          fetchRole(sess.user.id).then(setRole);
        }, 0);
      } else {
        setRole(null);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchRole(sess.user.id).then((r) => {
          setRole(r);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
