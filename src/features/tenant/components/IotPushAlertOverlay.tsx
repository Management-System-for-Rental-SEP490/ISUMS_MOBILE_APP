/**
 * Push IoT: listener + (tuỳ chọn) banner trên Home sau khi mở từ push.
 *
 * Lưu ý hệ thống:
 * - Android 8+: cần kênh có importance cao mới hiện heads-up / khay.
 * - Android 13+: cần quyền POST_NOTIFICATIONS (đã khai báo manifest; xin runtime qua expo-notifications).
 * - Khi app đang mở (foreground), Android thường KHÔNG đưa push lên khay — ta schedule thêm local notification để hiện trên khay.
 * - FCM chỉ gửi `data` (không có `notification.title/body`) thì OS không hiện khay — BE nên gửi cả `notification` hoặc ít nhất title/body;
 *   phía app vẫn cố gắng lấy tiêu đề từ API khi có `houseId` + `alertId` trong data.
 * - BE nên gửi `android.channel_id` (hoặc tương đương FCM) = IOT_PUSH_ANDROID_CHANNEL_ID để đồng bộ kênh.
 */

import React, { useEffect, useState } from "react";
import {
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import { navigationRef } from "../../../navigation/navigationRef";
import { useIotPushAlertStore } from "../../../store/useIotPushAlertStore";
import alertApi from "../../../shared/services/alertApi";
import { brandPrimary, neutral } from "../../../shared/theme/color";

/** Dùng chung với payload FCM `android.notification.channel_id` (khớp kênh đã tạo). */
export const IOT_PUSH_ANDROID_CHANNEL_ID = "iot-alerts";

function isRemotePushTrigger(trigger: Notifications.Notification["request"]["trigger"]): boolean {
  return Boolean(trigger && typeof trigger === "object" && "type" in trigger && trigger.type === "push");
}

async function ensureIotAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(IOT_PUSH_ANDROID_CHANNEL_ID, {
    name: "Cảnh báo IoT",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });
}

/**
 * Foreground: đẩy bản sao lên khay hệ thống (Android/iOS đều có thể không hiện tray khi app đang mở).
 * Không mirror lại thông báo local do chính ta vừa schedule (trigger không phải push).
 */
async function mirrorRemotePushToSystemTray(notification: Notifications.Notification): Promise<void> {
  if (AppState.currentState !== "active") return;
  if (!isRemotePushTrigger(notification.request.trigger)) return;

  const content = notification.request.content;
  const data = { ...(content.data ?? {}) } as Record<string, unknown>;
  if (data.__iotTrayMirrored) return;

  let title = String(content.title ?? "").trim();
  let body = String(content.body ?? "").trim();
  const houseId = typeof data.houseId === "string" ? data.houseId : "";
  const alertId = typeof data.alertId === "string" ? data.alertId : "";

  if (!title && !body && houseId && alertId) {
    try {
      const a = await alertApi.getAlertDetail(houseId, alertId);
      title = (a.title ?? "").trim() || title;
      body = (a.detail ?? "").trim() || body;
    } catch {
      /* giữ title/body rỗng → có thể bỏ qua bên dưới */
    }
  }

  if (!title && !body) return;

  data.__iotTrayMirrored = true;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: title || "IoT",
      body: body || " ",
      data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Đăng ký listener push + cold start — gọi một lần trong Navigation. */
export function useSetupIotNotifications(): void {
  const setPending = useIotPushAlertStore((s) => s.setPending);

  useEffect(() => {
    let receivedSub: { remove: () => void } | undefined;

    void (async () => {
      await ensureIotAndroidChannel();
      const perm = await Notifications.getPermissionsAsync();
      if (perm.status !== "granted" && perm.canAskAgain !== false) {
        await Notifications.requestPermissionsAsync();
      }
      receivedSub = Notifications.addNotificationReceivedListener((n) => {
        void mirrorRemotePushToSystemTray(n);
      });
    })();

    const parse = (data: Record<string, unknown> | undefined) => {
      const houseId = typeof data?.houseId === "string" ? data.houseId : "";
      const alertId = typeof data?.alertId === "string" ? data.alertId : "";
      if (houseId && alertId) setPending(houseId, alertId);
    };

    const responseSub = Notifications.addNotificationResponseReceivedListener((res) => {
      parse(res.notification.request.content.data as Record<string, unknown>);
    });

    try {
      const last = Notifications.getLastNotificationResponse();
      if (last) {
        parse(last.notification.request.content.data as Record<string, unknown>);
      }
    } catch {
      /* Expo Go / môi trường không có native module */
    }

    return () => {
      receivedSub?.remove();
      responseSub.remove();
    };
  }, [setPending]);
}

/** Banner đơn trên Home — sau khi mở app từ push; chạm → chi tiết cảnh báo (chỉ mount khi đang ở Main/Home). */
export function IotPushAlertOverlay() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { pendingHouseId, pendingAlertId, clearPending } = useIotPushAlertStore();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!pendingHouseId || !pendingAlertId) {
      setTitle("");
      return;
    }
    let cancelled = false;
    alertApi
      .getAlertDetail(pendingHouseId, pendingAlertId)
      .then((a) => {
        if (!cancelled) setTitle(a.title);
      })
      .catch(() => {
        if (!cancelled) setTitle(t("notification.section_iot"));
      });
    return () => {
      cancelled = true;
    };
  }, [pendingHouseId, pendingAlertId, t]);

  if (!pendingHouseId || !pendingAlertId) return null;

  const openDetail = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("IotAlertDetail", {
        houseId: pendingHouseId,
        alertId: pendingAlertId,
      });
    }
    clearPending();
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: insets.top + 6 }]}
    >
      <Pressable
        accessibilityRole="button"
        onPress={openDetail}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      >
        <Text style={styles.kicker}>{t("notification.section_iot")}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title || t("common.loading")}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
    alignItems: "center",
    paddingHorizontal: 14,
  },
  banner: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: neutral.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: neutral.borderMuted,
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 4,
    shadowColor: neutral.black,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  bannerPressed: {
    opacity: 0.92,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: brandPrimary,
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: "600", color: neutral.slate900, lineHeight: 20 },
});
