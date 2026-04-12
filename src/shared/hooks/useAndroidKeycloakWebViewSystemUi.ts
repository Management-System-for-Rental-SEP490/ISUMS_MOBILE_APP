import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { isEdgeToEdge } from "react-native-is-edge-to-edge";
import * as NavigationBar from "expo-navigation-bar";
import type { NavigationBarButtonStyle, NavigationBarPosition } from "expo-navigation-bar";

type SavedChrome = {
  position: NavigationBarPosition;
  backgroundColor: string;
  buttonStyle: NavigationBarButtonStyle;
};

/**
 * Android: khi **không** bật edge-to-edge, chỉnh thanh điều hướng trong lúc WebView Keycloak mở rồi khôi phục khi đóng.
 * Khi edge-to-edge đã bật (`app.json` → `android.edgeToEdgeEnabled`), thanh được cấu hình toàn app; không gọi API
 * `expo-navigation-bar` (tránh WARN và no-op từ thư viện).
 */
export function useAndroidKeycloakWebViewSystemUi(active: boolean) {
  const savedRef = useRef<SavedChrome | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android" || !active) return;
    if (isEdgeToEdge()) return;

    let cancelled = false;

    void (async () => {
      try {
        const [position, backgroundColor, buttonStyle] = await Promise.all([
          NavigationBar.unstable_getPositionAsync(),
          NavigationBar.getBackgroundColorAsync(),
          NavigationBar.getButtonStyleAsync(),
        ]);
        if (cancelled) return;
        savedRef.current = { position, backgroundColor, buttonStyle };

        await NavigationBar.setPositionAsync("absolute");
        await NavigationBar.setBackgroundColorAsync("#00000000");
        await NavigationBar.setButtonStyleAsync("light");
        try {
          NavigationBar.setStyle("dark");
        } catch {
          /* edge-to-edge / thiết bị không hỗ trợ setStyle */
        }
      } catch {
        /* Expo Go hoặc API không khả dụng */
      }
    })();

    return () => {
      cancelled = true;
      const saved = savedRef.current;
      savedRef.current = null;
      if (!saved) return;
      void (async () => {
        try {
          await NavigationBar.setPositionAsync(saved.position);
          await NavigationBar.setBackgroundColorAsync(saved.backgroundColor);
          await NavigationBar.setButtonStyleAsync(saved.buttonStyle);
        } catch {
          /* ignore */
        }
      })();
    };
  }, [active]);
}
