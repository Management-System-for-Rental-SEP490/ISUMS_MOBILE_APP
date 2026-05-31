export type StatusKey = "success" | "warning" | "critical" | "info" | "neutral";

export type StatusPalette = {
  bg: string;
  bgStrong: string;
  fg: string;
  border: string;
  solid: string;
  solidFg: string;
};

export type DomainKey = "electric" | "water" | "air" | "security" | "gas";

export type DomainPalette = {
  primary: string;
  primarySoft: string;
  surface: string;
  border: string;
  onPrimary: string;
  gradientFrom: string;
  gradientTo: string;
};

export type IntensityKey = "low" | "moderate" | "high" | "critical";

export type ThemeName = "light" | "dark";

export type ThemeColors = {
  bg: {
    canvas: string;
    subtle: string;
    surface: string;
    surfaceRaised: string;
    surfaceMuted: string;
    inverse: string;
    backdrop: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
    link: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
    inverse: string;
  };
  status: Record<StatusKey, StatusPalette>;
  brand: {
    primary: string;
    primarySoft: string;
    secondary: string;
    secondarySoft: string;
    onPrimary: string;
    gradientFrom: string;
    gradientTo: string;
    focusRing: string;
  };
  domain: Record<DomainKey, DomainPalette>;
  intensity: Record<IntensityKey, string>;
  overlay: {
    scrim: string;
    glassLight: string;
    glassDark: string;
  };
};

const lightStatus: Record<StatusKey, StatusPalette> = {
  success: {
    bg: "#ECFDF5",
    bgStrong: "#A7F3D0",
    fg: "#047857",
    border: "#86EFAC",
    solid: "#10B981",
    solidFg: "#FFFFFF",
  },
  warning: {
    bg: "#FFFBEB",
    bgStrong: "#FDE68A",
    fg: "#B45309",
    border: "#FCD34D",
    solid: "#F59E0B",
    solidFg: "#1F2937",
  },
  critical: {
    bg: "#FEF2F2",
    bgStrong: "#FECACA",
    fg: "#B91C1C",
    border: "#FCA5A5",
    solid: "#DC2626",
    solidFg: "#FFFFFF",
  },
  info: {
    bg: "#EFF6FF",
    bgStrong: "#BFDBFE",
    fg: "#1D4ED8",
    border: "#93C5FD",
    solid: "#2563EB",
    solidFg: "#FFFFFF",
  },
  neutral: {
    bg: "#F1F5F9",
    bgStrong: "#CBD5E1",
    fg: "#334155",
    border: "#CBD5E1",
    solid: "#64748B",
    solidFg: "#FFFFFF",
  },
};

const darkStatus: Record<StatusKey, StatusPalette> = {
  success: {
    bg: "rgba(16, 185, 129, 0.12)",
    bgStrong: "rgba(16, 185, 129, 0.24)",
    fg: "#6EE7B7",
    border: "rgba(110, 231, 183, 0.4)",
    solid: "#10B981",
    solidFg: "#022C22",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.14)",
    bgStrong: "rgba(245, 158, 11, 0.26)",
    fg: "#FCD34D",
    border: "rgba(252, 211, 77, 0.4)",
    solid: "#F59E0B",
    solidFg: "#1F1306",
  },
  critical: {
    bg: "rgba(239, 68, 68, 0.14)",
    bgStrong: "rgba(239, 68, 68, 0.26)",
    fg: "#FCA5A5",
    border: "rgba(252, 165, 165, 0.4)",
    solid: "#EF4444",
    solidFg: "#FFFFFF",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.14)",
    bgStrong: "rgba(59, 130, 246, 0.26)",
    fg: "#93C5FD",
    border: "rgba(147, 197, 253, 0.4)",
    solid: "#3B82F6",
    solidFg: "#FFFFFF",
  },
  neutral: {
    bg: "rgba(148, 163, 184, 0.12)",
    bgStrong: "rgba(148, 163, 184, 0.22)",
    fg: "#CBD5E1",
    border: "rgba(203, 213, 225, 0.3)",
    solid: "#94A3B8",
    solidFg: "#0F172A",
  },
};

const lightDomain: Record<DomainKey, DomainPalette> = {
  electric: {
    primary: "#F59E0B",
    primarySoft: "#FEF3C7",
    surface: "#FFFBEB",
    border: "#FDE68A",
    onPrimary: "#1F1306",
    gradientFrom: "#FBBF24",
    gradientTo: "#F97316",
  },
  water: {
    primary: "#06B6D4",
    primarySoft: "#CFFAFE",
    surface: "#ECFEFF",
    border: "#A5F3FC",
    onPrimary: "#FFFFFF",
    gradientFrom: "#22D3EE",
    gradientTo: "#0284C7",
  },
  air: {
    primary: "#10B981",
    primarySoft: "#D1FAE5",
    surface: "#ECFDF5",
    border: "#A7F3D0",
    onPrimary: "#FFFFFF",
    gradientFrom: "#34D399",
    gradientTo: "#059669",
  },
  security: {
    primary: "#8B5CF6",
    primarySoft: "#EDE9FE",
    surface: "#F5F3FF",
    border: "#C4B5FD",
    onPrimary: "#FFFFFF",
    gradientFrom: "#A78BFA",
    gradientTo: "#7C3AED",
  },
  gas: {
    primary: "#DC2626",
    primarySoft: "#FEE2E2",
    surface: "#FEF2F2",
    border: "#FCA5A5",
    onPrimary: "#FFFFFF",
    gradientFrom: "#F87171",
    gradientTo: "#B91C1C",
  },
};

const darkDomain: Record<DomainKey, DomainPalette> = {
  electric: {
    primary: "#FBBF24",
    primarySoft: "rgba(251, 191, 36, 0.18)",
    surface: "rgba(251, 191, 36, 0.08)",
    border: "rgba(251, 191, 36, 0.32)",
    onPrimary: "#1F1306",
    gradientFrom: "#FCD34D",
    gradientTo: "#F59E0B",
  },
  water: {
    primary: "#22D3EE",
    primarySoft: "rgba(34, 211, 238, 0.18)",
    surface: "rgba(34, 211, 238, 0.08)",
    border: "rgba(34, 211, 238, 0.32)",
    onPrimary: "#04263A",
    gradientFrom: "#67E8F9",
    gradientTo: "#0891B2",
  },
  air: {
    primary: "#34D399",
    primarySoft: "rgba(52, 211, 153, 0.18)",
    surface: "rgba(52, 211, 153, 0.08)",
    border: "rgba(52, 211, 153, 0.32)",
    onPrimary: "#022C22",
    gradientFrom: "#6EE7B7",
    gradientTo: "#10B981",
  },
  security: {
    primary: "#A78BFA",
    primarySoft: "rgba(167, 139, 250, 0.18)",
    surface: "rgba(167, 139, 250, 0.08)",
    border: "rgba(167, 139, 250, 0.32)",
    onPrimary: "#2E1065",
    gradientFrom: "#C4B5FD",
    gradientTo: "#8B5CF6",
  },
  gas: {
    primary: "#F87171",
    primarySoft: "rgba(248, 113, 113, 0.18)",
    surface: "rgba(248, 113, 113, 0.08)",
    border: "rgba(248, 113, 113, 0.32)",
    onPrimary: "#3F0808",
    gradientFrom: "#FCA5A5",
    gradientTo: "#DC2626",
  },
};

export const lightPalette: ThemeColors = {
  bg: {
    canvas: "#F5F7FA",
    subtle: "#F1F5F9",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceMuted: "#F8FAFC",
    inverse: "#0F172A",
    backdrop: "rgba(15, 23, 42, 0.45)",
  },
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    muted: "#94A3B8",
    disabled: "#CBD5E1",
    inverse: "#F8FAFC",
    link: "#2096D8",
  },
  border: {
    subtle: "#F1F5F9",
    default: "#E2E8F0",
    strong: "#CBD5E1",
    focus: "#2096D8",
    inverse: "rgba(255, 255, 255, 0.16)",
  },
  status: lightStatus,
  brand: {
    primary: "#3BB582",
    primarySoft: "rgba(59, 181, 130, 0.14)",
    secondary: "#2096D8",
    secondarySoft: "rgba(32, 150, 216, 0.12)",
    onPrimary: "#FFFFFF",
    gradientFrom: "#3BB582",
    gradientTo: "rgba(32, 150, 216, 0.92)",
    focusRing: "rgba(59, 181, 130, 0.32)",
  },
  domain: lightDomain,
  intensity: {
    low: "#10B981",
    moderate: "#F59E0B",
    high: "#F97316",
    critical: "#DC2626",
  },
  overlay: {
    scrim: "rgba(15, 23, 42, 0.5)",
    glassLight: "rgba(255, 255, 255, 0.7)",
    glassDark: "rgba(15, 23, 42, 0.6)",
  },
};

export const darkPalette: ThemeColors = {
  bg: {
    canvas: "#0A0E14",
    subtle: "#11161F",
    surface: "#1A1F2E",
    surfaceRaised: "#222837",
    surfaceMuted: "#161B26",
    inverse: "#F8FAFC",
    backdrop: "rgba(0, 0, 0, 0.65)",
  },
  text: {
    primary: "#F1F5F9",
    secondary: "#CBD5E1",
    muted: "#94A3B8",
    disabled: "#475569",
    inverse: "#0F172A",
    link: "#67E8F9",
  },
  border: {
    subtle: "rgba(255, 255, 255, 0.06)",
    default: "rgba(255, 255, 255, 0.1)",
    strong: "rgba(255, 255, 255, 0.18)",
    focus: "#67E8F9",
    inverse: "rgba(15, 23, 42, 0.12)",
  },
  status: darkStatus,
  brand: {
    primary: "#5DD3A6",
    primarySoft: "rgba(93, 211, 166, 0.16)",
    secondary: "#5BB7E5",
    secondarySoft: "rgba(91, 183, 229, 0.16)",
    onPrimary: "#022C22",
    gradientFrom: "#5DD3A6",
    gradientTo: "rgba(91, 183, 229, 0.85)",
    focusRing: "rgba(93, 211, 166, 0.4)",
  },
  domain: darkDomain,
  intensity: {
    low: "#34D399",
    moderate: "#FBBF24",
    high: "#FB923C",
    critical: "#F87171",
  },
  overlay: {
    scrim: "rgba(0, 0, 0, 0.7)",
    glassLight: "rgba(255, 255, 255, 0.08)",
    glassDark: "rgba(0, 0, 0, 0.5)",
  },
};

export const palettes = {
  light: lightPalette,
  dark: darkPalette,
} as const;
