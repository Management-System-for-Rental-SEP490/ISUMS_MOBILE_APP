import alertApi from "../../../shared/services/alertApi";
import { useHomeIotAlertDismissStore } from "../../../store/useHomeIotAlertDismissStore";

/**
 * Gỡ banner IoT toàn app cho đúng `alertId` (đã mở chi tiết / coi như đã xử lý).
 */
export function dismissIotHomeBannerForAlert(houseId: string, alertId: string): void {
  const hid = String(houseId ?? "").trim();
  const aid = String(alertId ?? "").trim();
  if (!hid || !aid) return;
  useHomeIotAlertDismissStore.getState().dismissAlertForHouse(hid, aid);
}

/**
 * Lấy cảnh báo chưa xử lý mới nhất (theo `ts` giống `useTenantAlerts`) và gỡ banner cho id đó —
 * dùng khi người dùng vào trang Thông báo (đã “vào danh sách”).
 */
export async function dismissLatestIotHomeBannerForHouse(houseId: string): Promise<void> {
  const hid = String(houseId ?? "").trim();
  if (!hid) return;
  try {
    const res = await alertApi.getAlerts({
      houseId: hid,
      size: 30,
      page: 0,
      resolved: false,
    });
    const raw = res?.content ?? [];
    const sorted = [...raw].sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0));
    const top = sorted[0];
    if (top?.alertId) {
      useHomeIotAlertDismissStore.getState().dismissAlertForHouse(hid, top.alertId);
    }
  } catch {
    /* ignore */
  }
}
