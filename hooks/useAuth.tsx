import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let supabase: ReturnType<typeof import("@/lib/supabase").getSupabase> | null = null;

    try {
      const { getSupabase } = require("@/lib/supabase");
      supabase = getSupabase();
      setIsConfigured(true);
    } catch {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id, supabase!);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session) {
          await fetchUserRole(session.user.id, supabase!);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserRole(userId: string, supabase: any) {
    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    setRole(data?.role ?? null);
    setLoading(false);
  }

  async function signOut() {
    try {
      const { getSupabase } = require("@/lib/supabase");
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {}
    setRole(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        loading,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
