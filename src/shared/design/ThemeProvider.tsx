import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Appearance,
  type ColorSchemeName,
} from "react-native";
import { usePreferencesStore } from "../../store/usePreferencesStore";
import { buildTheme, type ResolvedTheme } from "./theme";
import { tokens, type DesignTokens } from "./tokens";
import type { ThemeName } from "./palette";

type ThemeContextValue = {
  theme: ResolvedTheme;
  tokens: DesignTokens;
  isDark: boolean;
  systemScheme: ColorSchemeName;
  reduceMotion: boolean;
  resolvedScheme: ThemeName;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(
  mode: "system" | "light" | "dark",
  systemScheme: ColorSchemeName,
): ThemeName {
  if (mode === "light" || mode === "dark") return mode;
  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const fontScale = usePreferencesStore((s) => s.fontScale);
  const motionPref = usePreferencesStore((s) => s.motion);

  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme(),
  );
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) setSystemReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => setSystemReduceMotion(value),
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const resolvedScheme = useMemo(
    () => resolveScheme(themeMode, systemScheme),
    [themeMode, systemScheme],
  );

  const theme = useMemo(
    () => buildTheme(resolvedScheme, fontScale),
    [resolvedScheme, fontScale],
  );

  const reduceMotion = useMemo(() => {
    if (motionPref === "full") return false;
    if (motionPref === "reduced") return true;
    return systemReduceMotion;
  }, [motionPref, systemReduceMotion]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      tokens,
      isDark: resolvedScheme === "dark",
      systemScheme,
      reduceMotion,
      resolvedScheme,
    }),
    [theme, resolvedScheme, systemScheme, reduceMotion],
  );

  const subscribed = useRef(false);
  if (!subscribed.current) {
    subscribed.current = true;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}

export function useColors() {
  return useTheme().theme.colors;
}

export function useTypography() {
  return useTheme().theme.typography;
}

export function useDomainPalette(domain: keyof ResolvedTheme["colors"]["domain"]) {
  const { theme } = useTheme();
  return theme.colors.domain[domain];
}

export function useStatusPalette(status: keyof ResolvedTheme["colors"]["status"]) {
  const { theme } = useTheme();
  return theme.colors.status[status];
}
