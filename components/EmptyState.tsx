import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Colors, EmptyStateTokens, Layout } from "@/constants/design";
import { LucideIcon } from "./LucideIcon";

export interface EmptyStateProps {
  variant: "first_run" | "functional";
  icon: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
  ghostLabel?: string;
  ghostRoute?: string;
  fullScreen?: boolean;
  iconColor?: string;
}

export function EmptyState({
  variant,
  icon,
  headline,
  body,
  ctaLabel,
  ctaRoute,
  ghostLabel,
  ghostRoute,
  fullScreen = true,
  iconColor,
}: EmptyStateProps) {
  const isFirstRun = variant === "first_run";
  const tokens = isFirstRun
    ? EmptyStateTokens.firstRun
    : EmptyStateTokens.functional;

  const resolvedIconColor =
    iconColor ?? tokens.iconColor;

  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreenContainer,
  ];

  return (
    <View style={containerStyle}>
      {isFirstRun ? (
        <View style={styles.firstRunCircle}>
          <LucideIcon
            name={icon}
            size={tokens.iconSize}
            color={resolvedIconColor}
            strokeWidth={1.75}
          />
        </View>
      ) : (
        <LucideIcon
          name={icon}
          size={tokens.iconSize}
          color={resolvedIconColor}
          strokeWidth={1.75}
        />
      )}

      <Text
        style={[
          styles.headline,
          isFirstRun ? styles.headlineFirstRun : styles.headlineFunctional,
          { marginTop: tokens.iconToHeadline },
        ]}
      >
        {headline}
      </Text>

      <Text
        style={[
          styles.body,
          { marginTop: tokens.headlineToBody },
        ]}
      >
        {body}
      </Text>

      <View style={{ marginTop: tokens.bodyToCta, width: "100%" }}>
        {isFirstRun ? (
          <TouchableOpacity
            style={styles.ctaPill}
            onPress={() => router.push(ctaRoute as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaPillText}>{ctaLabel}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.ctaStandard}
            onPress={() => router.push(ctaRoute as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaStandardText}>{ctaLabel}</Text>
          </TouchableOpacity>
        )}

        {ghostLabel && ghostRoute && (
          <TouchableOpacity
            style={styles.ghostCta}
            onPress={() => router.push(ghostRoute as any)}
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
    backgroundColor: EmptyStateTokens.background,
    paddingVertical: 48,
  },
  fullScreenContainer: {
    flex: 1,
  },
  firstRunCircle: {
    width: EmptyStateTokens.firstRun.circleSize,
    height: EmptyStateTokens.firstRun.circleSize,
    borderRadius: EmptyStateTokens.firstRun.circleSize / 2,
    backgroundColor: EmptyStateTokens.firstRun.circleColor,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    textAlign: "center",
    color: Colors.light.textPrimary,
    letterSpacing: -0.3,
  },
  headlineFirstRun: {
    fontFamily: EmptyStateTokens.firstRun.headlineFont,
    fontSize: EmptyStateTokens.firstRun.headlineFontSize,
    lineHeight: 30,
  },
  headlineFunctional: {
    fontFamily: EmptyStateTokens.functional.headlineFont,
    fontSize: EmptyStateTokens.functional.headlineFontSize,
    lineHeight: 26,
  },
  body: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: EmptyStateTokens.bodyMaxWidth,
  },
  ctaPill: {
    height: Layout.ctaHeight,
    borderRadius: 9999,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: EmptyStateTokens.firstRun.ctaPaddingH,
    alignSelf: "center",
    minWidth: 180,
  },
  ctaPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.white,
  },
  ctaStandard: {
    height: Layout.ctaHeight,
    borderRadius: Layout.ctaRadius,
    backgroundColor: Colors.foamBlue,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  ctaStandardText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: Layout.ctaFontSize,
    color: Colors.white,
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
