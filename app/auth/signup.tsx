import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, UserRole } from "@/lib/supabase";
import { signInWithGoogle, signInWithApple } from "@/lib/auth";
import { useAuth, PENDING_SSO_ROLE_KEY } from "@/hooks/useAuth";
import { LucideIcon } from "@/components/LucideIcon";

const VALID_ROLES: UserRole[] = ["customer", "operator", "team_member"];

function onboardingEntryFor(role: UserRole): string {
  switch (role) {
    case "customer": return "/onboarding/customer/vehicle";
    case "operator": return "/onboarding/operator/build";
    case "team_member": return "/onboarding/crew/invite";
  }
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as Record<string, unknown>).message);
  }
  return fallback;
}

function toErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return String((err as Record<string, unknown>).code);
  }
  return "";
}

export default function SignupScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role: string }>();
  const role = VALID_ROLES.includes(roleParam as UserRole)
    ? (roleParam as UserRole)
    : null;

  const { refreshAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!role) {
      router.replace("/auth/role-select");
    }
  }, [role]);

  async function handleGoogle() {
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      await AsyncStorage.setItem(PENDING_SSO_ROLE_KEY, role);
      await signInWithGoogle();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}
        setLoading(false);
        return;
      }
      setLoading(false);
    } catch (err: unknown) {
      try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}
      const msg = toErrorMessage(err, "Google sign-in failed. Please try again.");
      if (msg !== "BROWSER_CLOSED") setError(msg);
      setLoading(false);
    }
  }

  async function handleApple() {
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      await AsyncStorage.setItem(PENDING_SSO_ROLE_KEY, role);
      await signInWithApple();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}
        setLoading(false);
        return;
      }
      setLoading(false);
    } catch (err: unknown) {
      try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}
      const code = toErrorCode(err);
      if (code !== "ERR_REQUEST_CANCELED" && code !== "1001") {
        setError(toErrorMessage(err, "Apple sign-in failed. Please try again."));
      }
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!role) {
      router.replace("/auth/role-select");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: { user: existingUser } } = await supabase.auth.getUser();

    if (existingUser) {
      await writeRoleAndNavigate(existingUser.id, existingUser.user_metadata?.full_name ?? "");
      setLoading(false);
      return;
    }

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setError("Account created — please check your email to confirm.");
      setLoading(false);
      return;
    }

    await writeRoleAndNavigate(userId, fullName.trim());
    setLoading(false);
  }

  async function writeRoleAndNavigate(userId: string, displayName: string): Promise<boolean> {
    if (!role) return false;

    const { error: userError } = await supabase
      .from("users")
      .upsert(
        { id: userId, role, display_name: displayName || undefined },
        { onConflict: "id" }
      );
    if (userError) {
      setError("Failed to save your role. Please try again.");
      return false;
    }

    if (role === "customer") {
      const { error: profileError } = await supabase
        .from("customer_profiles")
        .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
      if (profileError) {
        setError("Failed to create your profile. Please try again.");
        return false;
      }
    } else if (role === "operator") {
      const { error: profileError } = await supabase
        .from("detailer_profiles")
        .upsert(
          { user_id: userId, operation_type: "mobile" },
          { onConflict: "user_id", ignoreDuplicates: false }
        );
      if (profileError) {
        setError("Failed to create your profile. Please try again.");
        return false;
      }
    }

    try { await AsyncStorage.removeItem(PENDING_SSO_ROLE_KEY); } catch {}

    await refreshAuth();

    router.replace(
      onboardingEntryFor(role) as Parameters<typeof router.replace>[0]
    );
    return true;
  }

  if (!role) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <LucideIcon name="ChevronLeft" size={20} color={Colors.light.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerBlock}>
            <Text style={styles.heading}>Create your account</Text>
            <View style={styles.subRow}>
              <Text style={styles.subheading}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.replace("/auth/login")}
                activeOpacity={0.7}
              >
                <Text style={styles.subLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.ssoRow}>
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={Radius.sm}
                style={styles.ssoHalf}
                onPress={handleApple}
              />
            )}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                Platform.OS !== "ios" && styles.ssoFull,
              ]}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>
                {Platform.OS === "ios" ? "Google" : "Continue with Google"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Marcus Thompson"
                placeholderTextColor={Colors.light.textTertiary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="marcus@example.com"
                placeholderTextColor={Colors.light.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8+ characters"
                  placeholderTextColor={Colors.light.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <LucideIcon
                    name={showPassword ? "EyeOff" : "Eye"}
                    size={20}
                    color={Colors.light.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>At least 8 characters</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.trustText}>We'll never sell your data. Ever.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl2,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: -6,
    marginBottom: Spacing.md,
  },
  headerBlock: {
    marginBottom: Spacing.lg,
  },
  heading: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 20,
    color: Colors.light.textPrimary,
    marginBottom: Spacing.xs,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subheading: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textSecondary,
  },
  subLink: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
    textDecorationLine: "underline",
  },
  errorBox: {
    backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.2)",
  },
  errorText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
  },
  ssoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ssoHalf: {
    flex: 1,
    height: 48,
  },
  googleBtn: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ssoFull: {
    flex: 1,
  },
  googleG: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: "#4285F4",
    lineHeight: 20,
  },
  googleText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.borderSubtle,
  },
  dividerLabel: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
  },
  form: { gap: Spacing.md },
  inputGroup: { gap: Spacing.xs },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    marginLeft: 4,
  },
  input: {
    height: 52,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textPrimary,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
  },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: "absolute",
    right: 4,
    top: 4,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  inputHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    marginLeft: 4,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 16,
    paddingTop: Spacing.md,
    backgroundColor: Colors.light.bgPrimary,
    gap: Spacing.mdSm,
  },
  primaryButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  trustText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.light.textTertiary,
    textAlign: "center",
  },
});
