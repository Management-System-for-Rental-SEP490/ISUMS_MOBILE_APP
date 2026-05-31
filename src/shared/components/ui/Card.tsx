import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { elevation, radius, spacing, type SpacingToken } from "../../design/tokens";

export type CardVariant = "flat" | "outlined" | "elevated" | "raised" | "subtle";

export type CardProps = ViewProps & {
  variant?: CardVariant;
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  rounded?: keyof typeof radius;
};

export function Card({
  variant = "outlined",
  p = "base",
  px,
  py,
  rounded = "lg",
  style,
  children,
  ...rest
}: CardProps) {
  const colors = useColors();

  const baseStyle: ViewStyle = {
    backgroundColor: colors.bg.surface,
    borderRadius: radius[rounded],
    paddingTop: py !== undefined ? spacing[py] : spacing[p],
    paddingBottom: py !== undefined ? spacing[py] : spacing[p],
    paddingLeft: px !== undefined ? spacing[px] : spacing[p],
    paddingRight: px !== undefined ? spacing[px] : spacing[p],
  };

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case "flat":
        return {};
      case "subtle":
        return { backgroundColor: colors.bg.subtle };
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: colors.border.subtle,
        };
      case "elevated":
        return {
          ...elevation.card,
          shadowColor: colors.text.primary,
        };
      case "raised":
        return {
          ...elevation.raised,
          shadowColor: colors.text.primary,
        };
      default:
        return {};
    }
  })();

  return (
    <View {...rest} style={[baseStyle, variantStyle, style]}>
      {children}
    </View>
  );
}
