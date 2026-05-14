import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Typography, Spacing } from "@/constants/design";
import { LucideIcon } from "@/components/LucideIcon";

interface DrawerHeaderProps {
  title: string;
  onClose?: () => void;
  rightAction?: React.ReactNode;
}

export function DrawerHeader({ title, onClose, rightAction }: DrawerHeaderProps) {
  if (!onClose) {
    return <Text style={styles.centeredTitle}>{title}</Text>;
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
        <LucideIcon name="X" size={18} color={Colors.light.textSecondary} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      {rightAction != null ? rightAction : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredTitle: {
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
    textAlign: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  title: {
    flex: 1,
    fontFamily: Typography.bodySemiBold,
    fontSize: 17,
    color: Colors.light.textPrimary,
    marginHorizontal: Spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 32,
  },
});
