import { useState } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";
import { supabase } from "@/lib/supabase";
import { LucideIcon } from "@/components/LucideIcon";

type AuthMode = "login" | "signup";

export default function WelcomeScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email above, then tap Forgot Password.");
      return;
    }
    setLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
    } else {
      Alert.alert("Check your email", "We sent a password reset link to " + email.trim());
    }
  }

  async function handleSubmit() {
    setError(null);

    if (mode === "login") {
      if (!email.trim() || !password) {
        setError("Please enter your email and password.");
        return;
      }
      setLoading(true);
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (signInErr) setError(signInErr.message);
    } else {
      if (!fullName.trim() || !email.trim() || !password) {
        setError("Please fill in all fields.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      setLoading(true);
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      setLoading(false);
      if (signUpErr) {
        setError(signUpErr.message);
        return;
      }
      router.replace("/auth/role-select");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Text style={styles.wordmark}>FOAM</Text>
            <Text style={styles.tagline}>The operating system for clean cars.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleTab, mode === "login" && styles.toggleTabActive]}
                onPress={() => switchMode("login")}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleTabText, mode === "login" && styles.toggleTabTextActive]}>
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, mode === "signup" && styles.toggleTabActive]}
                onPress={() => switchMode("signup")}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleTabText, mode === "signup" && styles.toggleTabTextActive]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <LucideIcon name="AlertCircle" size={14} color={Colors.errorLight} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.form}>
              {mode === "signup" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Marcus Thompson"
                    placeholderTextColor={Colors.light.textTertiary}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.light.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  {mode === "login" && (
                    <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
                    placeholderTextColor={Colors.light.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <LucideIcon
                      name={showPassword ? "EyeOff" : "Eye"}
                      size={20}
                      color={Colors.light.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {mode === "signup" && password.length > 0 && password.length < 8 && (
                  <Text style={styles.passwordHint}>
                    Password must be at least 8 characters ({8 - password.length} more needed)
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === "login" ? "Log In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our Terms and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.bgPrimary },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 48,
    paddingBottom: Platform.OS === "web" ? 32 : 0,
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 40,
  },
  wordmark: {
    fontFamily: Typography.display,
    fontSize: 40,
    color: Colors.light.textPrimary,
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.borderSubtle,
    ...Shadows.light.level2,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: Colors.light.bgSecondary,
    borderRadius: Radius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  toggleTab: {
    flex: 1,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
  },
  toggleTabActive: {
    backgroundColor: Colors.light.surface,
    ...Shadows.light.level1,
  },
  toggleTabText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.bodyM,
    color: Colors.light.textTertiary,
  },
  toggleTabTextActive: {
    color: Colors.light.textPrimary,
    fontFamily: Typography.bodySemiBold,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(220,38,38,0.07)",
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyS,
    color: Colors.errorLight,
    lineHeight: 18,
  },
  form: { gap: Spacing.sm, marginBottom: Spacing.md },
  inputGroup: { gap: 5 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.light.textSecondary,
  },
  forgotText: {
    fontFamily: Typography.bodyMedium,
    fontSize: Typography.size.caption,
    color: Colors.foamBlue,
  },
  input: {
    height: 50,
    backgroundColor: Colors.light.bgPrimary,
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
  submitButton: {
    height: 50,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Shadows.light.level2,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  passwordHint: {
    fontFamily: Typography.body,
    fontSize: Typography.size.caption,
    color: Colors.warningLight,
    marginTop: 4,
    marginLeft: 2,
  },
  terms: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
  },
});
