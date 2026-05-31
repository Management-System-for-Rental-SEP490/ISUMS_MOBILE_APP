import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { spacing, type SpacingToken } from "../../design/tokens";

export type DividerProps = {
  orientation?: "horizontal" | "vertical";
  inset?: SpacingToken;
  variant?: "subtle" | "default" | "strong";
  style?: ViewStyle;
};

export function Divider({
  orientation = "horizontal",
  inset = "none",
  variant = "subtle",
  style,
}: DividerProps) {
  const colors = useColors();
  const color = colors.border[variant];
  const isHorizontal = orientation === "horizontal";

  return (
    <View
      style={[
        isHorizontal
          ? {
              height: StyleSheet.hairlineWidth,
              backgroundColor: color,
              marginLeft: spacing[inset],
            }
          : {
              width: StyleSheet.hairlineWidth,
              backgroundColor: color,
              marginTop: spacing[inset],
            },
        style,
      ]}
    />
  );
}
