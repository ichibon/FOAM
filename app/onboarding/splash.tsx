import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { router } from "expo-router";
import { Colors, Typography } from "@/constants/design";

const nd = Platform.OS !== "web";

export default function SplashScreen() {
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(logoAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: nd,
    }).start();

    const timer = setTimeout(() => {
      router.replace("/auth/welcome");
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.wordmark,
          {
            opacity: logoAnim,
            transform: [
              {
                scale: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.94, 1],
                }),
              },
            ],
          },
        ]}
      >
        FOAM
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.foamDarkTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: Typography.display,
    fontSize: 52,
    color: Colors.white,
    letterSpacing: -1,
    lineHeight: 60,
  },
});
