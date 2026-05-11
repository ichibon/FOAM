import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { Colors, Drawer, Layout } from "@/constants/design";
import { ErrorStateProps } from "./ErrorState";
import { LucideIcon } from "./LucideIcon";
import { ErrorStateTokens } from "@/constants/design";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAWER_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

export interface ErrorDrawerProps extends ErrorStateProps {
  visible: boolean;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const SEVERITY_MAP = {
  warning: ErrorStateTokens.warning,
  error: ErrorStateTokens.error,
  blocking: ErrorStateTokens.blocking,
} as const;

export function ErrorDrawer({
  visible,
  onDismiss,
  severity,
  recovery,
  icon,
  headline,
  body,
  ctaLabel,
  retryAction,
  navigateTo,
  ghostLabel,
  ghostAction,
  errorCode,
  children,
}: ErrorDrawerProps) {
  const translateY = useRef(new Animated.Value(DRAWER_MAX_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const lastRetry = useRef(0);

  const colors = SEVERITY_MAP[severity];
  const isErrorSeverity = severity === "error" || severity === "blocking";
  const ctaBgColor = isErrorSeverity ? Colors.errorLight : Colors.foamBlue;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: Drawer.animationDuration,
          useNativeDriver: true,
          easing: (t) => {
            return 1 - Math.pow(1 - t, 3);
          },
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: Drawer.animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: DRAWER_MAX_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleCta = () => {
    if (recovery === "retry") {
      const now = Date.now();
      if (now - lastRetry.current < 1000) return;
      lastRetry.current = now;
      retryAction?.();
    } else if (recovery === "navigate" && navigateTo) {
      const { router } = require("expo-router");
      onDismiss?.();
      setTimeout(() => router.push(navigateTo), 250);
    } else if (recovery === "support") {
      const { Linking } = require("react-native");
      Linking.openURL("mailto:support@foamauto.app");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.modalRoot}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateY }], maxHeight: DRAWER_MAX_HEIGHT },
          ]}
        >
          <View style={styles.dragHandleRow}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.iconCircle}>
              <LucideIcon
                name={icon}
                size={ErrorStateTokens.iconSize}
                color={colors.iconColor}
                strokeWidth={1.75}
              />
            </View>

            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.body}>{body}</Text>

            {errorCode && (
              <Text style={styles.errorCode}>Ref: {errorCode}</Text>
            )}

            {children && (
              <View style={styles.childrenContainer}>{children}</View>
            )}

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={[
                  styles.ctaBase,
                  {
                    backgroundColor:
                      severity === "warning" ? "transparent" : ctaBgColor,
                    borderWidth: severity === "warning" ? 1.5 : 0,
                    borderColor: Colors.foamBlue,
                  },
                ]}
                onPress={handleCta}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.ctaText,
                    {
                      color:
                        severity === "warning" ? Colors.foamBlue : Colors.white,
                    },
                  ]}
                >
                  {ctaLabel}
                </Text>
              </TouchableOpacity>

              {ghostLabel && ghostAction && (
                <TouchableOpacity
                  style={styles.ghostCta}
                  onPress={ghostAction}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ghostCtaText}>{ghostLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Drawer.backdropError,
  },
  drawer: {
    backgroundColor: Drawer.background,
    borderTopLeftRadius: Drawer.borderRadius,
    borderTopRightRadius: Drawer.borderRadius,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  dragHandleRow: {
    width: "100%",
    alignItems: "center",
    paddingTop: Drawer.dragHandleTopOffset,
    paddingBottom: 4,
  },
  dragHandle: {
    width: Drawer.dragHandleWidth,
    height: Drawer.dragHandleHeight,
    borderRadius: 2,
    backgroundColor: Drawer.dragHandleColor,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: 16,
    paddingBottom: 40,
  },
  iconCircle: {
    width: ErrorStateTokens.iconCircleSize,
    height: ErrorStateTokens.iconCircleSize,
    borderRadius: ErrorStateTokens.iconCircleSize / 2,
    backgroundColor: ErrorStateTokens.error.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  headline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    lineHeight: 26,
    color: Colors.light.textPrimary,
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  errorCode: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.light.textTertiary,
    marginTop: 8,
    textAlign: "center",
  },
  childrenContainer: {
    width: "100%",
    marginTop: 20,
  },
  ctaContainer: {
    width: "100%",
    marginTop: 28,
  },
  ctaBase: {
    height: Layout.ctaHeight,
    borderRadius: Layout.ctaRadius,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  ctaText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Layout.ctaFontSize,
  },
  ghostCta: {
    marginTop: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostCtaText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.foamBlue,
  },
});
