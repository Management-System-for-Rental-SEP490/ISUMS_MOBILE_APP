import React from "react";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import { useColors, useTypography } from "../../design/ThemeProvider";
import type { TypographyVariant } from "../../design/theme";

type TextColorToken =
  | "primary"
  | "secondary"
  | "muted"
  | "disabled"
  | "inverse"
  | "link";

type StatusColorToken = "success" | "warning" | "critical" | "info" | "neutral";

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColorToken;
  status?: StatusColorToken;
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
  italic?: boolean;
  underline?: boolean;
  uppercase?: boolean;
  numberOfLines?: number;
  customColor?: string;
};

export function Text({
  variant = "body",
  color = "primary",
  status,
  align,
  weight,
  italic,
  underline,
  uppercase,
  customColor,
  style,
  children,
  ...rest
}: TextProps) {
  const colors = useColors();
  const typography = useTypography();

  const resolvedColor =
    customColor ?? (status ? colors.status[status].fg : colors.text[color]);

  const computed: TextStyle = {
    color: resolvedColor,
    textAlign: align,
    fontWeight: weight,
    fontStyle: italic ? "italic" : undefined,
    textDecorationLine: underline ? "underline" : undefined,
    textTransform: uppercase ? "uppercase" : undefined,
  };

  return (
    <RNText
      allowFontScaling
      {...rest}
      style={[typography[variant], computed, style]}
    >
      {children}
    </RNText>
  );
}
