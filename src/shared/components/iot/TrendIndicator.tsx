import React from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { Text } from "../ui/Text";
import { useFormatters } from "../../hooks/useFormatters";

export type TrendIndicatorProps = {
  value: number;
  unit?: string;
  decimals?: number;
  invertedSemantic?: boolean;
  size?: "sm" | "md";
  variant?: "pill" | "inline";
  style?: ViewStyle;
};

export function TrendIndicator({
  value,
  unit,
  decimals,
  invertedSemantic,
  size = "sm",
  variant = "pill",
  style,
}: TrendIndicatorProps) {
  const colors = useColors();
  const fmt = useFormatters();

  const isPositive = value > 0;
  const isNeutral = value === 0;

  const isGood = invertedSemantic ? isPositive : value < 0;
  const isBad = invertedSemantic ? value < 0 : isPositive;

  const palette = isNeutral
    ? colors.status.neutral
    : isGood
      ? colors.status.success
      : isBad
        ? colors.status.warning
        : colors.status.neutral;

  const arrow = isPositive ? "▲" : value < 0 ? "▼" : "•";
  const text = `${arrow} ${fmt.delta(value, decimals)}${unit ? ` ${unit}` : ""}`;

  if (variant === "inline") {
    return (
      <Text
        variant={size === "sm" ? "caption" : "label"}
        weight="600"
        customColor={palette.fg}
        style={style}
      >
        {text}
      </Text>
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 2 : 4,
        },
        style,
      ]}
    >
      <Text
        variant={size === "sm" ? "caption" : "label"}
        weight="600"
        customColor={palette.fg}
      >
        {text}
      </Text>
    </View>
  );
}
