import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  onboardingComplete: boolean;
  pendingApproval: boolean;
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
  pendingApproval: false,
  loading: true,
  signOut: async () => {},
  isConfigured: false,
  refreshAuth: async () => {},
});

async function checkPendingApproval(
  userId: string,
  role: UserRole | null,
  client: SupabaseClient
): Promise<boolean> {
  if (role === "operator" || role === "manager") {
    const { data } = await client
      .from("detailer_profiles")
      .select("is_approved")
      .eq("user_id", userId)
      .single();
    return data != null && data.is_approved !== true;
  }
  if (role === "team_member") {
    const { data } = await client
      .from("team_members")
      .select("status")
      .eq("user_id", userId)
      .single();
    return data != null && data.status !== "active";
  }
  return false;
}

async function fetchUserProfile(
  userId: string,
  client: SupabaseClient,
  setRole: (r: UserRole | null) => void,
  setOnboardingComplete: (v: boolean) => void,
  setPendingApproval: (v: boolean) => void,
  setLoading: (v: boolean) => void
) {
  const { data } = await client
    .from("users")
    .select("role, onboarding_complete")
    .eq("id", userId)
    .single();

  const resolvedRole = (data?.role as UserRole) ?? null;
  const resolvedOnboarding = data?.onboarding_complete === true;

  setRole(resolvedRole);
  setOnboardingComplete(resolvedOnboarding);

  if (resolvedOnboarding && resolvedRole) {
    const pending = await checkPendingApproval(userId, resolvedRole, client);
    setPendingApproval(pending);
  } else {
    setPendingApproval(false);
  }

  setLoading(false);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    let client: SupabaseClient | null = null;

    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      client = getSupabase();
      setIsConfigured(true);
    } catch {
      setLoading(false);
      return;
    }

    const c = client;

    c.auth.getSession().then(({ data: { session: s } }: { data: { session: Session | null } }) => {
      setSession(s);
      if (s) {
        fetchUserProfile(s.user.id, c, setRole, setOnboardingComplete, setPendingApproval, setLoading);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = c.auth.onAuthStateChange(
      (_event: string, s: Session | null) => {
        setSession(s);
        if (s) {
          fetchUserProfile(s.user.id, c, setRole, setOnboardingComplete, setPendingApproval, setLoading);
        } else {
          setRole(null);
          setOnboardingComplete(false);
          setPendingApproval(false);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function refreshAuth() {
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const c = getSupabase();
      const { data: { user } } = await c.auth.getUser();
      if (user) {
        await fetchUserProfile(user.id, c, setRole, setOnboardingComplete, setPendingApproval, () => {});
      }
    } catch {}
  }

  async function signOut() {
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const c = getSupabase();
      await c.auth.signOut();
    } catch {}
    setRole(null);
    setOnboardingComplete(false);
    setPendingApproval(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        onboardingComplete,
        pendingApproval,
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
