import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FontScaleToken } from "../shared/design/tokens";

export type ThemeMode = "system" | "light" | "dark";

export type MotionPreference = "system" | "full" | "reduced";

export type DensityMode = "comfortable" | "compact";

export type IotTimeRange = "1h" | "24h" | "7d" | "30d" | "90d";

export type LiveInterval = 5 | 10 | 30 | 60 | 0;

export type DomainKey = "electric" | "water" | "air" | "security" | "gas";

export type QuietHoursRange = {
  enabled: boolean;
  start: string;
  end: string;
};

export type PreferencesState = {
  themeMode: ThemeMode;
  fontScale: FontScaleToken;
  density: DensityMode;
  motion: MotionPreference;
  hapticEnabled: boolean;
  hapticIntensity: "light" | "medium";
  alertSoundEnabled: boolean;
  iot: {
    defaultRange: IotTimeRange;
    liveIntervalSeconds: LiveInterval;
    showCostEstimate: boolean;
    showCarbonFootprint: boolean;
    showForecastConfidence: boolean;
    chartCurveStyle: "smooth" | "linear" | "step";
    showThresholdBands: boolean;
    autoRefreshOnFocus: boolean;
  };
  notifications: {
    pushEnabled: boolean;
    quietHours: QuietHoursRange;
    criticalOverride: boolean;
    domainEnabled: Record<DomainKey, boolean>;
    weeklyDigestEnabled: boolean;
    digestDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  };
  privacy: {
    analyticsOptIn: boolean;
    crashReportsOptIn: boolean;
    locationOptIn: boolean;
  };
  bills: {
    tariffPlan: "residential_tier" | "flat" | "tou";
    currency: "VND" | "USD" | "JPY";
    monthlyBudgetVnd: number | null;
    waterBudgetM3: number | null;
    electricBudgetKwh: number | null;
  };
  display: {
    showLiveBadge: boolean;
    showAreaSparklines: boolean;
    decimalPrecision: 0 | 1 | 2;
    use24HourTime: boolean;
    weekStartsOn: 0 | 1;
  };
  hydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScaleToken) => void;
  setDensity: (density: DensityMode) => void;
  setMotion: (motion: MotionPreference) => void;
  setHapticEnabled: (value: boolean) => void;
  setHapticIntensity: (value: "light" | "medium") => void;
  setAlertSoundEnabled: (value: boolean) => void;
  updateIot: (patch: Partial<PreferencesState["iot"]>) => void;
  updateNotifications: (patch: Partial<PreferencesState["notifications"]>) => void;
  setDomainNotification: (domain: DomainKey, enabled: boolean) => void;
  setQuietHours: (value: QuietHoursRange) => void;
  updatePrivacy: (patch: Partial<PreferencesState["privacy"]>) => void;
  updateBills: (patch: Partial<PreferencesState["bills"]>) => void;
  updateDisplay: (patch: Partial<PreferencesState["display"]>) => void;
  resetAll: () => void;
};

const DEFAULTS: Omit<
  PreferencesState,
  | "hydrated"
  | "setThemeMode"
  | "setFontScale"
  | "setDensity"
  | "setMotion"
  | "setHapticEnabled"
  | "setHapticIntensity"
  | "setAlertSoundEnabled"
  | "updateIot"
  | "updateNotifications"
  | "setDomainNotification"
  | "setQuietHours"
  | "updatePrivacy"
  | "updateBills"
  | "updateDisplay"
  | "resetAll"
> = {
  themeMode: "system",
  fontScale: "base",
  density: "comfortable",
  motion: "system",
  hapticEnabled: true,
  hapticIntensity: "light",
  alertSoundEnabled: true,
  iot: {
    defaultRange: "24h",
    liveIntervalSeconds: 10,
    showCostEstimate: true,
    showCarbonFootprint: true,
    showForecastConfidence: true,
    chartCurveStyle: "smooth",
    showThresholdBands: true,
    autoRefreshOnFocus: true,
  },
  notifications: {
    pushEnabled: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
    },
    criticalOverride: true,
    domainEnabled: {
      electric: true,
      water: true,
      air: true,
      security: true,
      gas: true,
    },
    weeklyDigestEnabled: true,
    digestDay: 1,
  },
  privacy: {
    analyticsOptIn: true,
    crashReportsOptIn: true,
    locationOptIn: false,
  },
  bills: {
    tariffPlan: "residential_tier",
    currency: "VND",
    monthlyBudgetVnd: null,
    waterBudgetM3: null,
    electricBudgetKwh: null,
  },
  display: {
    showLiveBadge: true,
    showAreaSparklines: true,
    decimalPrecision: 1,
    use24HourTime: true,
    weekStartsOn: 1,
  },
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setFontScale: (fontScale) => set({ fontScale }),
      setDensity: (density) => set({ density }),
      setMotion: (motion) => set({ motion }),
      setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
      setHapticIntensity: (hapticIntensity) => set({ hapticIntensity }),
      setAlertSoundEnabled: (alertSoundEnabled) => set({ alertSoundEnabled }),
      updateIot: (patch) =>
        set((state) => ({ iot: { ...state.iot, ...patch } })),
      updateNotifications: (patch) =>
        set((state) => ({
          notifications: { ...state.notifications, ...patch },
        })),
      setDomainNotification: (domain, enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            domainEnabled: {
              ...state.notifications.domainEnabled,
              [domain]: enabled,
            },
          },
        })),
      setQuietHours: (quietHours) =>
        set((state) => ({
          notifications: { ...state.notifications, quietHours },
        })),
      updatePrivacy: (patch) =>
        set((state) => ({ privacy: { ...state.privacy, ...patch } })),
      updateBills: (patch) =>
        set((state) => ({ bills: { ...state.bills, ...patch } })),
      updateDisplay: (patch) =>
        set((state) => ({ display: { ...state.display, ...patch } })),
      resetAll: () => set(DEFAULTS),
    }),
    {
      name: "isums.preferences.v1",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => {
        const {
          hydrated: _hydrated,
          setThemeMode: _a,
          setFontScale: _b,
          setDensity: _c,
          setMotion: _d,
          setHapticEnabled: _e,
          setHapticIntensity: _f,
          setAlertSoundEnabled: _g,
          updateIot: _h,
          updateNotifications: _i,
          setDomainNotification: _j,
          setQuietHours: _k,
          updatePrivacy: _l,
          updateBills: _m,
          updateDisplay: _n,
          resetAll: _o,
          ...persistable
        } = state;
        return persistable;
      },
      onRehydrateStorage: () => () => {
        usePreferencesStore.setState({ hydrated: true });
      },
    },
  ),
);

export const preferencesSelectors = {
  themeMode: (s: PreferencesState) => s.themeMode,
  fontScale: (s: PreferencesState) => s.fontScale,
  density: (s: PreferencesState) => s.density,
  motion: (s: PreferencesState) => s.motion,
  hapticEnabled: (s: PreferencesState) => s.hapticEnabled,
  hapticIntensity: (s: PreferencesState) => s.hapticIntensity,
  iot: (s: PreferencesState) => s.iot,
  notifications: (s: PreferencesState) => s.notifications,
  privacy: (s: PreferencesState) => s.privacy,
  bills: (s: PreferencesState) => s.bills,
  display: (s: PreferencesState) => s.display,
  hydrated: (s: PreferencesState) => s.hydrated,
};
