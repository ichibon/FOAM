import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, Radius, Shadows } from "@/constants/design";

export default function WelcomeScreen() {
  const cardAnim1 = useRef(new Animated.Value(0)).current;
  const cardAnim2 = useRef(new Animated.Value(0)).current;
  const cardAnim3 = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const nd = Platform.OS !== "web";
    const float = (anim: Animated.Value, delay: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, delay, useNativeDriver: nd }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: nd }),
        ])
      );

    float(cardAnim1, 0, 3000).start();
    float(cardAnim2, 500, 4000).start();
    float(cardAnim3, 1000, 3500).start();

    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: nd,
    }).start();
  }, []);

  const card1Y = cardAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const card2Y = cardAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const card3Y = cardAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <View style={styles.container}>
      <View style={styles.illustrationArea}>
        <View style={styles.blurCircle} />
        <Animated.View style={[styles.card3, { transform: [{ translateY: card3Y }, { rotate: "-12deg" }] }]} />
        <Animated.View style={[styles.card2, { transform: [{ translateY: card2Y }, { rotate: "6deg" }] }]} />
        <Animated.View style={[styles.card1, { transform: [{ translateY: card1Y }, { rotate: "-3deg" }] }]}>
          <View style={styles.card1Circle} />
          <View style={styles.card1Lines}>
            <View style={styles.card1Line1} />
            <View style={styles.card1Line2} />
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.contentArea,
          {
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
              },
            ],
          },
        ]}
      >
        <View style={styles.dragHandle} />

        <View style={styles.copyBlock}>
          <Text style={styles.headline}>Your car deserves better.</Text>
          <Text style={styles.subheadline}>
            Find the best mobile detailers near you and book in seconds.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/auth/signup")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => router.push("/auth/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.ghostButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.termsRow}>
          <Text style={styles.termsText}>By continuing, you agree to our Terms and Privacy Policy.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
  },
  illustrationArea: {
    height: "55%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  blurCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.foamBlueSubtle,
  },
  card3: {
    position: "absolute",
    width: 180,
    height: 240,
    borderRadius: 24,
    backgroundColor: Colors.foamLightBlue,
    left: "50%",
    marginLeft: -120,
    top: "50%",
    marginTop: -140,
  },
  card2: {
    position: "absolute",
    width: 190,
    height: 260,
    borderRadius: 24,
    backgroundColor: "#6BB8D4",
    left: "50%",
    marginLeft: -75,
    top: "50%",
    marginTop: -120,
    opacity: 0.9,
    ...Shadows.light.level2,
  },
  card1: {
    position: "absolute",
    width: 200,
    height: 280,
    borderRadius: 24,
    backgroundColor: Colors.foamBlue,
    left: "50%",
    marginLeft: -110,
    top: "50%",
    marginTop: -110,
    padding: 24,
    justifyContent: "space-between",
    ...Shadows.light.level3,
  },
  card1Circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  card1Lines: { gap: 8 },
  card1Line1: {
    width: "75%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  card1Line2: {
    width: "50%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  contentArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 24 : 0,
    ...Shadows.light.level3,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.borderSubtle,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  copyBlock: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  headline: {
    fontFamily: Typography.display,
    fontSize: 32,
    color: Colors.light.textPrimary,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  subheadline: {
    fontFamily: Typography.body,
    fontSize: Typography.size.bodyL,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },
  buttonGroup: {
    gap: Spacing.sm,
  },
  primaryButton: {
    height: 48,
    backgroundColor: Colors.foamBlue,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.light.level2,
  },
  primaryButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.white,
  },
  ghostButton: {
    height: 48,
    backgroundColor: Colors.transparent,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.foamBlue,
  },
  ghostButtonText: {
    fontFamily: Typography.bodySemiBold,
    fontSize: Typography.size.bodyM,
    color: Colors.foamBlue,
  },
  termsRow: {
    marginTop: 20,
    alignItems: "center",
  },
  termsText: {
    fontFamily: Typography.body,
    fontSize: Typography.size.label,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
  },
});
