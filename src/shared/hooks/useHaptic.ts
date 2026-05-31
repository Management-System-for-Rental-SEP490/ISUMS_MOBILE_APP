import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { usePreferencesStore } from "../../store/usePreferencesStore";

export type HapticEvent =
  | "selection"
  | "tap"
  | "success"
  | "warning"
  | "error"
  | "impactLight"
  | "impactMedium"
  | "impactHeavy";

export function useHaptic() {
  const enabled = usePreferencesStore((s) => s.hapticEnabled);
  const intensity = usePreferencesStore((s) => s.hapticIntensity);

  return useCallback(
    (event: HapticEvent = "tap") => {
      if (!enabled) return;
      const tapStyle =
        intensity === "medium"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
      switch (event) {
        case "selection":
          Haptics.selectionAsync().catch(() => undefined);
          return;
        case "tap":
        case "impactLight":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => undefined,
          );
          return;
        case "impactMedium":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
            () => undefined,
          );
          return;
        case "impactHeavy":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
            () => undefined,
          );
          return;
        case "success":
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => undefined);
          return;
        case "warning":
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => undefined);
          return;
        case "error":
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => undefined);
          return;
        default:
          Haptics.impactAsync(tapStyle).catch(() => undefined);
      }
    },
    [enabled, intensity],
  );
}
