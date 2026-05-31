import type { TextStyle } from "react-native";
import { palettes, type ThemeColors, type ThemeName } from "./palette";
import {
  fontScale as fontScaleTokens,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  type FontScaleToken,
} from "./tokens";

export type TypographyVariant =
  | "display"
  | "hero"
  | "title2xl"
  | "titleXl"
  | "titleLg"
  | "titleMd"
  | "titleSm"
  | "bodyLg"
  | "body"
  | "bodySm"
  | "label"
  | "caption"
  | "overline"
  | "metric"
  | "metricLg"
  | "code";

export type TypographyStyle = Pick<
  TextStyle,
  "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing" | "fontVariant"
>;

const baseTypography: Record<TypographyVariant, TypographyStyle> = {
  display: {
    fontSize: fontSize.display,
    lineHeight: fontSize.display * lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
    fontVariant: ["tabular-nums"],
  },
  hero: {
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
    fontVariant: ["tabular-nums"],
  },
  metricLg: {
    fontSize: fontSize["4xl"],
    lineHeight: fontSize["4xl"] * lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    fontVariant: ["tabular-nums"],
  },
  metric: {
    fontSize: fontSize["3xl"],
    lineHeight: fontSize["3xl"] * lineHeight.tight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
    fontVariant: ["tabular-nums"],
  },
  title2xl: {
    fontSize: fontSize["3xl"],
    lineHeight: fontSize["3xl"] * lineHeight.snug,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  titleXl: {
    fontSize: fontSize["2xl"],
    lineHeight: fontSize["2xl"] * lineHeight.snug,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  titleLg: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.snug,
    fontWeight: fontWeight.semibold,
  },
  titleMd: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.snug,
    fontWeight: fontWeight.semibold,
  },
  titleSm: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.snug,
    fontWeight: fontWeight.semibold,
  },
  bodyLg: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
    fontWeight: fontWeight.regular,
  },
  body: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
    fontWeight: fontWeight.regular,
  },
  bodySm: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.regular,
  },
  label: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.snug,
    fontWeight: fontWeight.medium,
  },
  caption: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.snug,
    fontWeight: fontWeight.regular,
  },
  overline: {
    fontSize: fontSize["2xs"],
    lineHeight: fontSize["2xs"] * lineHeight.normal,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.widest,
  },
  code: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
    fontWeight: fontWeight.regular,
  },
};

function scaleTypography(
  base: Record<TypographyVariant, TypographyStyle>,
  factor: number,
): Record<TypographyVariant, TypographyStyle> {
  const scaled = {} as Record<TypographyVariant, TypographyStyle>;
  for (const key of Object.keys(base) as TypographyVariant[]) {
    const value = base[key];
    scaled[key] = {
      ...value,
      fontSize: value.fontSize ? value.fontSize * factor : value.fontSize,
      lineHeight: value.lineHeight ? value.lineHeight * factor : value.lineHeight,
    };
  }
  return scaled;
}

export type ResolvedTheme = {
  name: ThemeName;
  colors: ThemeColors;
  typography: Record<TypographyVariant, TypographyStyle>;
  fontScaleKey: FontScaleToken;
  fontScale: number;
};

export function buildTheme(
  name: ThemeName,
  fontScaleKey: FontScaleToken,
): ResolvedTheme {
  const factor = fontScaleTokens[fontScaleKey];
  return {
    name,
    colors: palettes[name],
    typography: scaleTypography(baseTypography, factor),
    fontScaleKey,
    fontScale: factor,
  };
}

export const defaultThemeLight = buildTheme("light", "base");
export const defaultThemeDark = buildTheme("dark", "base");
