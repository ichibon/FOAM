import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { Colors, ErrorStateTokens, Layout } from "@/constants/design";
import { LucideIcon } from "./LucideIcon";

/**
 * severity values:
 *   "warning"  — non-blocking issue, outlined CTA
 *   "error"    — actionable failure, filled red CTA
 *   "blocking" — full-screen hard stop (no nav, no dismiss), filled red CTA
 *
 * Note: the UX spec uses "blocking" (not "info") for unrecoverable states
 * such as offline or auth-expired screens. This is intentional.
 */
export interface ErrorStateProps {
  severity: "warning" | "error" | "blocking";
  recovery: "retry" | "navigate" | "support";
  icon: string;
  headline: string;
  body: string;
  ctaLabel: string;
  retryAction?: () => void;
  navigateTo?: string;
  ghostLabel?: string;
  ghostAction?: () => void;
  fullScreen?: boolean;
  errorCode?: string;
  onCtaPress?: () => void;
}

const SEVERITY_TOKENS = {
  warning: ErrorStateTokens.warning,
  error: ErrorStateTokens.error,
  blocking: ErrorStateTokens.blocking,
} as const;

export function ErrorState({
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
  fullScreen = false,
  errorCode,
  onCtaPress,
}: ErrorStateProps) {
  const lastRetry = useRef(0);
  const colors = SEVERITY_TOKENS[severity];

  const handleCta = () => {
    if (onCtaPress) {
      onCtaPress();
      return;
    }
    if (recovery === "retry") {
      const now = Date.now();
      if (now - lastRetry.current < 1000) return;
      lastRetry.current = now;
      retryAction?.();
    } else if (recovery === "navigate" && navigateTo) {
      router.push(navigateTo as Parameters<typeof router.push>[0]);
    } else if (recovery === "support") {
      Linking.openURL("mailto:support@foamauto.app");
    }
  };

  const isErrorSeverity = severity === "error" || severity === "blocking";

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View
        style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}
      >
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

      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[
            styles.ctaBase,
            severity === "warning"
              ? styles.ctaOutlined
              : { backgroundColor: isErrorSeverity ? Colors.errorLight : Colors.foamBlue },
          ]}
          onPress={handleCta}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaText,
              { color: severity === "warning" ? Colors.foamBlue : Colors.white },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: 32,
    backgroundColor: Colors.light.bgPrimary,
  },
  fullScreen: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  iconCircle: {
    width: ErrorStateTokens.iconCircleSize,
    height: ErrorStateTokens.iconCircleSize,
    borderRadius: ErrorStateTokens.iconCircleSize / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
  ctaOutlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.foamBlue,
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
