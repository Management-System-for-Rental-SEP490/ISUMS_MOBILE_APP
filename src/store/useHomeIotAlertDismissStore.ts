import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ID cảnh báo IoT đã gỡ banner trên Home theo từng nhà.
 * Khi `latestAlert.alertId` khác với id đã gỡ → hiện banner mới.
 */
type State = {
  dismissedAlertIdByHouseId: Record<string, string>;
  dismissAlertForHouse: (houseId: string, alertId: string) => void;
  /** Đăng xuất — tránh giữ id đã gỡ giữa các tài khoản. */
  clearAllDismissed: () => void;
};

export const useHomeIotAlertDismissStore = create<State>()(
  persist(
    (set) => ({
      dismissedAlertIdByHouseId: {},
      dismissAlertForHouse: (houseId, alertId) => {
        const hid = String(houseId ?? "").trim();
        const aid = String(alertId ?? "").trim();
        if (!hid || !aid) return;
        set((s) => ({
          dismissedAlertIdByHouseId: {
            ...s.dismissedAlertIdByHouseId,
            [hid]: aid,
          },
        }));
      },
      clearAllDismissed: () => set({ dismissedAlertIdByHouseId: {} }),
    }),
    {
      name: "home-iot-alert-dismiss",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
