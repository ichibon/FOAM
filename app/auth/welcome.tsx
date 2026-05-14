import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Typography, Spacing, Radius } from "@/constants/design";
import { signInWithGoogle, signInWithApple } from "@/lib/auth";
import * as AppleAuthentication from "expo-apple-authentication";

const nd = Platform.OS !== "web";
const { height: SCREEN_H } = Dimensions.get("window");

export default function WelcomeScreen() {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  const card1BaseY = useRef(new Animated.Value(30)).current;
  const card2BaseY = useRef(new Animated.Value(10)).current;
  const card3BaseY = useRef(new Animated.Value(-20)).current;

  const sheetY = useRef(new Animated.Value(SCREEN_H * 0.5)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function makeFloat(val: Animated.Value, duration: number, delay = 0) {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: -10,
            duration: duration / 2,
            delay,
            useNativeDriver: nd,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: nd,
          }),
        ])
      );
    }

    const f1 = makeFloat(float1, 6000);
    const f2 = makeFloat(float2, 8000);
    const f3 = makeFloat(float3, 7000, 1000);
    f1.start();
    f2.start();
    f3.start();

    Animated.timing(sheetY, {
      toValue: 0,
      duration: 400,
      useNativeDriver: nd,
    }).start();

    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 300,
      delay: 250,
      useNativeDriver: nd,
    }).start();

    return () => {
      f1.stop();
      f2.stop();
      f3.stop();
    };
  }, []);

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch {}
  }

  async function handleApple() {
    try {
      await signInWithApple();
    } catch {}
  }

  return (
    <View style={styles.root}>
      <View style={styles.illustrationArea}>
        <View style={styles.glow} />

        <Animated.View
          style={[
            styles.cardBase,
            styles.card3,
            {
              transform: [
                { rotate: "-12deg" },
                { translateX: -30 },
                { translateY: Animated.add(card3BaseY, float3) },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.cardBase,
            styles.card2,
            {
              transform: [
                { rotate: "6deg" },
                { translateX: 40 },
                { translateY: Animated.add(card2BaseY, float2) },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.cardBase,
            styles.card1,
            {
              transform: [
                { rotate: "-3deg" },
                { translateX: -10 },
                { translateY: Animated.add(card1BaseY, float1) },
              ],
            },
          ]}
        >
          <View style={styles.cardDot} />
          <View style={styles.cardLines}>
            <View style={[styles.cardLine, { width: "75%" }]} />
            <View style={[styles.cardLine, { width: "50%", opacity: 0.65 }]} />
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
          <View style={styles.valueProp}>
            <Text style={styles.headline}>Your car deserves{"\n"}better.</Text>
            <Text style={styles.subheadline}>
              Find the best mobile detailers near you and book in seconds.
            </Text>
          </View>

          <View style={styles.primaryActions}>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={() => router.push("/auth/role-select")}
              activeOpacity={0.85}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/auth/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.ssoActions}>
            {Platform.OS === "ios" && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={Radius.sm}
                style={styles.appleBtn}
                onPress={handleApple}
              />
            )}

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogle}
              activeOpacity={0.85}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },

  illustrationArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  glow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(51,157,199,0.10)",
  },

  cardBase: {
    position: "absolute",
    borderRadius: 24,
  },

  card3: {
    width: 180,
    height: 240,
    backgroundColor: Colors.foamLightBlue,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  card2: {
    width: 190,
    height: 260,
    backgroundColor: "#6BB8D4",
    opacity: 0.9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },

  card1: {
    width: 200,
    height: 280,
    backgroundColor: Colors.foamBlue,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: Colors.foamBlue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: "space-between",
    padding: 24,
  },

  cardDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  cardLines: {
    gap: 10,
  },

  cardLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.30)",
  },

  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 8,
    minHeight: SCREEN_H * 0.44,
  },

  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderSubtle,
  },

  valueProp: {
    paddingTop: Spacing.mdLg,
    paddingBottom: Spacing.lg,
  },

  headline: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: Colors.light.textPrimary,
    lineHeight: 36,
    marginBottom: 10,
  },

  subheadline: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },

  primaryActions: {
    gap: Spacing.mdSm,
    marginBottom: Spacing.md,
  },

  getStartedBtn: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  getStartedText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },

  loginBtn: {
    height: 48,
    backgroundColor: Colors.transparent,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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

  ssoActions: {
    gap: Spacing.sm,
  },

  appleBtn: {
    width: "100%",
    height: 48,
  },

  googleBtn: {
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.light.borderDefault,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
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

  terms: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    paddingTop: Spacing.md,
  },
});
