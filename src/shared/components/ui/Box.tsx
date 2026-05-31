import React from "react";
import { StyleSheet, View, type ViewProps, type ViewStyle } from "react-native";
import { spacing, type SpacingToken, radius, type RadiusToken } from "../../design/tokens";
import { useColors } from "../../design/ThemeProvider";

type BgToken =
  | "canvas"
  | "subtle"
  | "surface"
  | "surfaceRaised"
  | "surfaceMuted"
  | "transparent";

type BorderToken = "subtle" | "default" | "strong" | "none";

export type BoxProps = ViewProps & {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pr?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mr?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  rounded?: RadiusToken;
  bg?: BgToken;
  borderColor?: BorderToken;
  borderWidth?: number;
  flex?: number;
  width?: number | "auto" | `${number}%`;
  height?: number | "auto" | `${number}%`;
  minHeight?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
};

export function Box({
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  rounded,
  bg,
  borderColor,
  borderWidth,
  flex,
  width,
  height,
  minHeight,
  align,
  justify,
  style,
  children,
  ...rest
}: BoxProps) {
  const colors = useColors();

  const resolvedBg =
    bg === undefined
      ? undefined
      : bg === "transparent"
        ? "transparent"
        : colors.bg[bg];

  const resolvedBorder =
    borderColor === undefined || borderColor === "none"
      ? undefined
      : colors.border[borderColor];

  const computed: ViewStyle = {
    paddingTop: pt !== undefined ? spacing[pt] : py !== undefined ? spacing[py] : p !== undefined ? spacing[p] : undefined,
    paddingRight: pr !== undefined ? spacing[pr] : px !== undefined ? spacing[px] : p !== undefined ? spacing[p] : undefined,
    paddingBottom: pb !== undefined ? spacing[pb] : py !== undefined ? spacing[py] : p !== undefined ? spacing[p] : undefined,
    paddingLeft: pl !== undefined ? spacing[pl] : px !== undefined ? spacing[px] : p !== undefined ? spacing[p] : undefined,
    marginTop: mt !== undefined ? spacing[mt] : my !== undefined ? spacing[my] : m !== undefined ? spacing[m] : undefined,
    marginRight: mr !== undefined ? spacing[mr] : mx !== undefined ? spacing[mx] : m !== undefined ? spacing[m] : undefined,
    marginBottom: mb !== undefined ? spacing[mb] : my !== undefined ? spacing[my] : m !== undefined ? spacing[m] : undefined,
    marginLeft: ml !== undefined ? spacing[ml] : mx !== undefined ? spacing[mx] : m !== undefined ? spacing[m] : undefined,
    borderRadius: rounded !== undefined ? radius[rounded] : undefined,
    backgroundColor: resolvedBg,
    borderColor: resolvedBorder,
    borderWidth:
      borderWidth !== undefined
        ? borderWidth
        : resolvedBorder
          ? StyleSheet.hairlineWidth
          : undefined,
    flex,
    width,
    height,
    minHeight,
    alignItems: align,
    justifyContent: justify,
  };

  return (
    <View {...rest} style={[computed, style]}>
      {children}
    </View>
  );
}
