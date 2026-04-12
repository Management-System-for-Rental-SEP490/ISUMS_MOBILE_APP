import * as Haptics from "expo-haptics";

export async function playAlertSound(level: string): Promise<void> {
  try {
    if (level === "CRITICAL") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(
        () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        400
      );
      setTimeout(
        () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        800
      );
    } else if (level === "WARNING") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    /* ignore */
  }
}
