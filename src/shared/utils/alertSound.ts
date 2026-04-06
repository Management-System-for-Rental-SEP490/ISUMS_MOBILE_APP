// src/features/tenant/utils/alertSound.ts
// Haptic feedback + sound cho các loại alert TPHCM

import * as Haptics from "expo-haptics";
import { AlertLevel, IAlert } from "../types/alert";

// ================================================================
//  Haptic patterns
// ================================================================

export async function playAlertHaptic(level: AlertLevel): Promise<void> {
  try {
    switch (level) {
      case "CRITICAL":
        // 3 lần rung mạnh — nguy hiểm
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await delay(200);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        await delay(200);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;

      case "WARNING":
        // 1 lần rung vừa — cảnh báo
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;

      case "INFO":
        // Rung nhẹ — thông tin
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  } catch {
    // Haptics không khả dụng trên một số thiết bị
  }
}

// ================================================================
//  Special haptics cho từng loại event
// ================================================================

export async function playAlertHapticForAlert(alert: IAlert): Promise<void> {
  // Mất điện: rung dài 1 lần
  if (alert.metric === "power_lost") {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await delay(400);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    return;
  }

  // Có điện lại: rung vui nhẹ
  if (alert.metric === "power_restored") {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    return;
  }

  // Rò rỉ nước: rung 2 lần vừa
  if (alert.metric === "water_leak") {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await delay(250);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    return;
  }

  // Mặc định theo level
  await playAlertHaptic(alert.level);
}

// ================================================================
//  Helper
// ================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}