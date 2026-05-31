import React from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { Text } from "../ui/Text";

export type UtilityStatusKey =
  | "GOOD"
  | "WARNING"
  | "CRITICAL"
  | "NO_DATA"
  | "OFFLINE";

const ICON_BY_STATUS: Record<UtilityStatusKey, string> = {
  GOOD: "✓",
  WARNING: "⚠",
  CRITICAL: "✕",
  NO_DATA: "—",
  OFFLINE: "⌀",
};

export type StatusPillProps = {
  status: UtilityStatusKey;
  label: string;
  size?: "sm" | "md";
  style?: ViewStyle;
};

export function StatusPill({ status, label, size = "sm", style }: StatusPillProps) {
  const colors = useColors();

  const palette = (() => {
    switch (status) {
      case "GOOD":
        return colors.status.success;
      case "WARNING":
        return colors.status.warning;
      case "CRITICAL":
        return colors.status.critical;
      case "OFFLINE":
        return colors.status.neutral;
      case "NO_DATA":
      default:
        return colors.status.neutral;
    }
  })();

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: size === "sm" ? 10 : 14,
          paddingVertical: size === "sm" ? 4 : 6,
        },
        style,
      ]}
    >
      <Text
        variant="label"
        weight="700"
        customColor={palette.fg}
        accessibilityElementsHidden
      >
        {ICON_BY_STATUS[status]}
      </Text>
      <Text
        variant={size === "sm" ? "caption" : "label"}
        weight="600"
        customColor={palette.fg}
      >
        {label}
      </Text>
    </View>
  );
}
