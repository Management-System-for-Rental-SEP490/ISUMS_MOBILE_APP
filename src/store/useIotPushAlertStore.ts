import { create } from "zustand";

type IotPushState = {
  /** Cảnh báo cần hiện banner sau khi mở app từ push. */
  pendingHouseId: string | null;
  pendingAlertId: string | null;
  setPending: (houseId: string, alertId: string) => void;
  clearPending: () => void;
};

export const useIotPushAlertStore = create<IotPushState>((set) => ({
  pendingHouseId: null,
  pendingAlertId: null,
  setPending: (houseId, alertId) =>
    set({ pendingHouseId: houseId, pendingAlertId: alertId }),
  clearPending: () => set({ pendingHouseId: null, pendingAlertId: null }),
}));
