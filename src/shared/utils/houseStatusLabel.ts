import type { TFunction } from "i18next";

/**
 * Chuỗi hiển thị trạng thái căn nhà (theo mã API).
 * AVAILABLE: BE có thể dùng cho nhà tenant đang ở → hiển thị "Đang sử dụng" (tenant app).
 */
export function formatHouseStatusForDisplay(status: string | undefined, t: TFunction): string {
  if (!status?.trim()) {
    return t("staff_building_detail.house_status_other", { status: "—" });
  }
  const u = status.trim().toUpperCase();
  if (u === "AVAILABLE") return t("staff_building_detail.house_status_available");
  if (u === "RENTED") return t("staff_building_detail.house_status_rented");
  if (u === "VACANT" || u === "EMPTY" || u === "UNOCCUPIED") {
    return t("staff_building_detail.house_status_vacant");
  }
  if (u === "MAINTENANCE" || u === "UNDER_MAINTENANCE") {
    return t("staff_building_detail.house_status_maintenance");
  }
  if (u === "UNAVAILABLE" || u === "INACTIVE") {
    return t("staff_building_detail.house_status_unavailable");
  }
  return t("staff_building_detail.house_status_other", { status });
}
