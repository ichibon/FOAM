import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Colors, ErrorStateTokens, Layout } from "@/constants/design";
import { LucideIcon } from "./LucideIcon";

/**
 * Severity:
 *   "warning"  — non-blocking soft failure, outlined FOAM Blue CTA
 *   "error"    — actionable hard failure, filled Error Red CTA
 *   "info"     — informational / upgrade state, filled FOAM Blue CTA
 *
 * Use fullScreen={true} for blocking errors (no internet, suspended, update
 * required) that should cover the entire viewport with no nav chrome.
 *
 * Recovery semantic contract — ctaAction MUST fulfil:
 *   "retry"    — re-fires the failed operation; must be debounced by caller
 *   "navigate" — navigates to the resolution screen; call router.push inside
 *   "support"  — opens in-app chat or mailto:support@foamauto.app
 *
 * CTA execution is fully owned by the caller via ctaAction — no routing
 * logic lives in this component. ghostAction follows the same contract.
 */
export interface ErrorStateProps {
  severity: "error" | "warning" | "info";
  /**
   * Semantic label for the recovery path. Does not change component
   * behaviour — the caller's ctaAction callback owns execution.
   * Callers MUST implement the contract documented above.
   */
  recovery: "retry" | "navigate" | "support";
  icon: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaAction: () => void;
  ghostLabel?: string;
  ghostAction?: () => void;
  /** Default false. Set true for blocking errors (no internet, suspended). */
  fullScreen?: boolean;
  /** Optional support reference displayed in small tertiary text. */
  errorCode?: string;
}

const SEVERITY_TOKENS = {
  warning: ErrorStateTokens.warning,
  error: ErrorStateTokens.error,
  info: ErrorStateTokens.info,
} as const;

export function ErrorState({
  severity,
  recovery,
  icon,
  headline,
  body,
  ctaLabel,
  ctaAction,
  ghostLabel,
  ghostAction,
  fullScreen = false,
  errorCode,
}: ErrorStateProps) {
  const colors = SEVERITY_TOKENS[severity];
  const isWarning = severity === "warning";
  const ctaBgColor = isWarning ? "transparent" : severity === "info" ? Colors.foamBlue : Colors.errorLight;

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.iconBg }]}>
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
            {
              backgroundColor: ctaBgColor,
              borderWidth: isWarning ? 1.5 : 0,
              borderColor: Colors.foamBlue,
            },
          ]}
          onPress={ctaAction}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaText,
              { color: isWarning ? Colors.foamBlue : Colors.white },
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
