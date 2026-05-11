import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  onboardingComplete: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  isConfigured: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  onboardingComplete: false,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
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
      if (session) fetchUserProfile(session.user.id, supabase!);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session) {
          await fetchUserProfile(session.user.id, supabase!);
        } else {
          setRole(null);
          setOnboardingComplete(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string, supabase: any) {
    const { data } = await supabase
      .from("users")
      .select("role, onboarding_complete")
      .eq("id", userId)
      .single();

    setRole(data?.role ?? null);
    setOnboardingComplete(data?.onboarding_complete === true);
    setLoading(false);
  }

  async function refreshAuth() {
    try {
      const { getSupabase } = require("@/lib/supabase");
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await fetchUserProfile(user.id, supabase);
    } catch {}
  }

  async function signOut() {
    try {
      const { getSupabase } = require("@/lib/supabase");
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {}
    setRole(null);
    setOnboardingComplete(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        onboardingComplete,
        loading,
        signOut,
        isConfigured,
        refreshAuth,
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
