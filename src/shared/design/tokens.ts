import type { TextStyle } from "react-native";

export const spacing = {
  none: 0,
  px: 1,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,
  "7xl": 96,
} as const;

export type SpacingToken = keyof typeof spacing;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  "2xl": 28,
  "3xl": 36,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

export const fontFamily = {
  base: undefined,
  mono: undefined,
} as const;

export const fontSize = {
  "2xs": 10,
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  hero: 56,
  display: 64,
} as const;

export type FontSizeToken = keyof typeof fontSize;

export const lineHeight = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1.25,
} as const;

export const motion = {
  duration: {
    instant: 80,
    fast: 150,
    base: 250,
    slow: 400,
    slower: 600,
    crawl: 900,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const,
    decelerate: [0, 0, 0, 1] as const,
    accelerate: [0.3, 0, 1, 1] as const,
    spring: { damping: 18, stiffness: 180, mass: 1 },
    bounce: { damping: 12, stiffness: 220, mass: 1 },
  },
} as const;

export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  raised: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modal: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  popover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
} as const;

export type ElevationToken = keyof typeof elevation;

export const opacity = {
  "0": 0,
  "5": 0.05,
  "10": 0.1,
  "20": 0.2,
  "30": 0.3,
  "40": 0.4,
  "50": 0.5,
  "60": 0.6,
  "70": 0.7,
  "80": 0.8,
  "90": 0.9,
  "100": 1,
} as const;

export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  overlay: 500,
  modal: 1000,
  popover: 1100,
  toast: 1200,
  tooltip: 1300,
} as const;

export const minTouch = 44;

export const fontScale = {
  xs: 0.85,
  sm: 0.92,
  base: 1,
  lg: 1.1,
  xl: 1.25,
  "2xl": 1.4,
} as const;

export type FontScaleToken = keyof typeof fontScale;

export const tokens = {
  spacing,
  radius,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  motion,
  elevation,
  opacity,
  zIndex,
  minTouch,
  fontScale,
} as const;

export type DesignTokens = typeof tokens;
