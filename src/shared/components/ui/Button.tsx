import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { useColors, useTypography } from "../../design/ThemeProvider";
import { radius } from "../../design/tokens";
import { Pressable, type PressableProps } from "./Pressable";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth,
  leadingIcon,
  trailingIcon,
  style,
  haptic = "selection",
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const typography = useTypography();

  const palette = (() => {
    switch (variant) {
      case "primary":
        return {
          bg: colors.brand.primary,
          fg: colors.brand.onPrimary,
          border: colors.brand.primary,
        };
      case "secondary":
        return {
          bg: colors.brand.primarySoft,
          fg: colors.brand.primary,
          border: colors.brand.primarySoft,
        };
      case "outline":
        return {
          bg: "transparent",
          fg: colors.text.primary,
          border: colors.border.strong,
        };
      case "ghost":
        return {
          bg: "transparent",
          fg: colors.text.primary,
          border: "transparent",
        };
      case "destructive":
        return {
          bg: colors.status.critical.solid,
          fg: colors.status.critical.solidFg,
          border: colors.status.critical.solid,
        };
      default:
        return {
          bg: colors.brand.primary,
          fg: colors.brand.onPrimary,
          border: colors.brand.primary,
        };
    }
  })();

  const sizing = (() => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          minHeight: 36,
          textVariant: "label" as const,
        };
      case "lg":
        return {
          paddingVertical: 14,
          paddingHorizontal: 22,
          minHeight: 52,
          textVariant: "titleSm" as const,
        };
      case "md":
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 18,
          minHeight: 44,
          textVariant: "label" as const,
        };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      haptic={disabled || loading ? false : haptic}
      style={({ pressed }) => ({
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: variant === "outline" ? 1 : 0,
        borderRadius: radius.md,
        paddingVertical: sizing.paddingVertical,
        paddingHorizontal: sizing.paddingHorizontal,
        minHeight: sizing.minHeight,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        alignSelf: fullWidth ? "stretch" : "flex-start",
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        ...style,
      })}
      pressedOpacity={1}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {leadingIcon}
          <Text
            variant={sizing.textVariant}
            weight="600"
            customColor={palette.fg}
            numberOfLines={1}
            style={styles.label}
          >
            {label}
          </Text>
          {trailingIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    flexShrink: 1,
  },
});
