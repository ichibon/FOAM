import * as LucideIcons from "lucide-react-native";
import React from "react";

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

interface LucideIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function LucideIcon({
  name,
  size = 24,
  color = "#0A0A0A",
  strokeWidth = 2,
}: LucideIconProps) {
  const pascalName = toPascalCase(name);
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[pascalName];

  if (!IconComponent) {
    const Fallback = LucideIcons.HelpCircle;
    return <Fallback size={size} color={color} strokeWidth={strokeWidth} />;
  }

  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
