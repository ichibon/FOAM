import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/supabase";

export const PENDING_SSO_ROLE_KEY = "foam_pending_sso_role";
const VALID_SSO_ROLES: UserRole[] = ["customer", "operator", "team_member"];

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
      .select("approval_status")
      .eq("user_id", userId)
      .single();
    return data != null && data.approval_status !== "approved";
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

  if (!data) {
    const { error: authErr } = await client.auth.getUser();
    if (authErr) {
      await client.auth.signOut();
      setRole(null);
      setOnboardingComplete(false);
      setPendingApproval(false);
      setLoading(false);
      return;
    }

    // No users row yet — check if we're mid-SSO-signup (role stored before OAuth started)
    let pendingRole: string | null = null;
    try { pendingRole = await AsyncStorage.getItem(PENDING_SSO_ROLE_KEY); } catch {}

    if (pendingRole && VALID_SSO_ROLES.includes(pendingRole as UserRole)) {
      try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}

      await client.from("users").upsert(
        { id: userId, role: pendingRole },
        { onConflict: "id" }
      );

      if (pendingRole === "customer") {
        await client.from("customer_profiles").upsert(
          { user_id: userId },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      } else if (pendingRole === "operator") {
        await client.from("detailer_profiles").upsert(
          { user_id: userId, operation_type: "mobile" },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      }

      // Re-fetch the freshly written row and continue normally
      const { data: freshData } = await client
        .from("users")
        .select("role, onboarding_complete")
        .eq("id", userId)
        .single();

      if (freshData) {
        const resolvedRole = (freshData.role as UserRole) ?? null;
        setRole(resolvedRole);
        setOnboardingComplete(freshData.onboarding_complete === true);
        setPendingApproval(false);
        setLoading(false);
        return;
      }
    }

    setRole(null);
    setOnboardingComplete(false);
    setPendingApproval(false);
    setLoading(false);
    return;
  }

  let resolvedRole = (data?.role as UserRole) ?? null;
  const resolvedOnboarding = data?.onboarding_complete === true;

  // Row exists but role is null — trigger created it before the user picked a role.
  // Check AsyncStorage for a pending SSO role and write it now.
  if (!resolvedRole) {
    let pendingRole: string | null = null;
    try { pendingRole = await AsyncStorage.getItem(PENDING_SSO_ROLE_KEY); } catch {}

    if (pendingRole && VALID_SSO_ROLES.includes(pendingRole as UserRole)) {
      try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}

      await client.from("users").upsert(
        { id: userId, role: pendingRole },
        { onConflict: "id" }
      );

      if (pendingRole === "customer") {
        await client.from("customer_profiles").upsert(
          { user_id: userId },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      } else if (pendingRole === "operator") {
        await client.from("detailer_profiles").upsert(
          { user_id: userId, operation_type: "mobile" },
          { onConflict: "user_id", ignoreDuplicates: true }
        );
      }

      resolvedRole = pendingRole as UserRole;
    }
  }

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
      if (s) {
        // loading starts as true in initial state — keep it true while fetchUserProfile runs.
        setSession(s);
        fetchUserProfile(s.user.id, c, setRole, setOnboardingComplete, setPendingApproval, setLoading);
      } else {
        setLoading(false);
        setSession(s);
      }
    });

    const { data: { subscription } } = c.auth.onAuthStateChange(
      (_event: string, s: Session | null) => {
        if (s) {
          // CRITICAL: set loading=true BEFORE setSession so layout never sees
          // {session, role=null, loading=false} (would route to role-select).
          setLoading(true);
          setSession(s);
          fetchUserProfile(s.user.id, c, setRole, setOnboardingComplete, setPendingApproval, setLoading);
        } else {
          setLoading(false);
          setSession(s);
          setRole(null);
          setOnboardingComplete(false);
          setPendingApproval(false);
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
    } catch (err) {
      console.warn("[useAuth] refreshAuth failed", err);
    }
  }

  async function signOut() {
    try {
      const { getSupabase } = require("@/lib/supabase") as typeof import("@/lib/supabase");
      const c = getSupabase();
      await c.auth.signOut();
    } catch (err) {
      console.warn("[useAuth] signOut failed", err);
    }
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
