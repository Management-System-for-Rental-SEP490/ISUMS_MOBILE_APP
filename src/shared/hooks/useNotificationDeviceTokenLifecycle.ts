/**
 * Vòng đời đăng ký thiết bị cho push nghiệp vụ (FCM/Expo).
 *
 * **Mục đích:** khi `enabled` (tenant đã đăng nhập), gọi `registerNotificationDeviceTokenIfEnabled`
 * nếu `EXPO_PUBLIC_NOTIFICATION_DEVICE_TOKEN_ENABLED`; lắng nghe `addPushTokenListener` để gửi token mới
 * lên BE khi OS đổi token. Khi `enabled` false (logout), `unregisterStoredNotificationDeviceToken` (DELETE + xóa storage).
 *
 * **Hành vi:** không await trong render; lỗi mạng/404 được nuốt trong service — không crash.
 */
import { useEffect } from "react";
import {
  registerNotificationDeviceTokenIfEnabled,
  subscribeExpoPushTokenRefresh,
  unregisterStoredNotificationDeviceToken,
} from "../services/notificationPush";

export function useNotificationDeviceTokenLifecycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      void unregisterStoredNotificationDeviceToken();
      return;
    }

    void registerNotificationDeviceTokenIfEnabled();

    const sub = subscribeExpoPushTokenRefresh(() => {
      void registerNotificationDeviceTokenIfEnabled();
    });

    return () => {
      sub.remove();
    };
  }, [enabled]);
}
