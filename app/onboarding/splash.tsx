import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { router } from "expo-router";
import { Colors, Typography } from "@/constants/design";

const nd = Platform.OS !== "web";

export default function SplashScreen() {
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordmarkAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: nd,
      }),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 200,
        delay: 0,
        useNativeDriver: nd,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        delay: 200,
        useNativeDriver: nd,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/auth/welcome");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.Text
          style={[
            styles.wordmark,
            {
              opacity: wordmarkAnim,
              transform: [
                {
                  scale: wordmarkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          FOAM
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineAnim }]}>
          The operating system for clean cars.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
        <View style={styles.dropletContainer}>
          <View style={styles.droplet} />
        </View>
        <Text style={styles.company}>By FOAM Technologies</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: Typography.display,
    fontSize: 52,
    color: Colors.light.textPrimary,
    letterSpacing: -1,
    lineHeight: 60,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: Typography.body,
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 48,
    alignItems: "center",
  },
  dropletContainer: {
    marginBottom: 8,
  },
  droplet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.foamBlue,
  },
  company: {
    fontFamily: Typography.body,
    fontSize: 11,
    color: Colors.light.textTertiary,
  },
});
