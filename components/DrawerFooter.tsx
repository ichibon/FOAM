import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Colors, Spacing } from "@/constants/design";

interface DrawerFooterProps {
  children: React.ReactNode;
}

export function DrawerFooter({ children }: DrawerFooterProps) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    paddingBottom: Platform.OS === "web" ? 16 : 32,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderSubtle,
  },
});
