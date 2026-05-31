import React from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { Text } from "./Text";

export type BadgeStatus = "success" | "warning" | "critical" | "info" | "neutral";

export type BadgeProps = {
  label: string;
  status?: BadgeStatus;
  domain?: DomainKey;
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
  leadingIcon?: React.ReactNode;
  style?: ViewStyle;
};

export function Badge({
  label,
  status = "neutral",
  domain,
  variant = "soft",
  size = "sm",
  leadingIcon,
  style,
}: BadgeProps) {
  const colors = useColors();

  const palette = (() => {
    if (domain) {
      const d = colors.domain[domain];
      switch (variant) {
        case "solid":
          return { bg: d.primary, fg: d.onPrimary, border: d.primary };
        case "outline":
          return { bg: "transparent", fg: d.primary, border: d.primary };
        case "soft":
        default:
          return { bg: d.primarySoft, fg: d.primary, border: d.border };
      }
    }
    const s = colors.status[status];
    switch (variant) {
      case "solid":
        return { bg: s.solid, fg: s.solidFg, border: s.solid };
      case "outline":
        return { bg: "transparent", fg: s.fg, border: s.border };
      case "soft":
      default:
        return { bg: s.bg, fg: s.fg, border: s.border };
    }
  })();

  const sizing =
    size === "sm"
      ? { paddingVertical: 2, paddingHorizontal: 8, fontVariant: "caption" as const }
      : { paddingVertical: 4, paddingHorizontal: 10, fontVariant: "label" as const };

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === "outline" ? 1 : 0,
          borderRadius: 999,
          paddingVertical: sizing.paddingVertical,
          paddingHorizontal: sizing.paddingHorizontal,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {leadingIcon}
      <Text
        variant={sizing.fontVariant}
        weight="600"
        customColor={palette.fg}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
