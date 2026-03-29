/**
 * Vị trí khu vực trên sơ đồ mặt bằng (Cover_Floor_Plan.png, viewBox 0–100).
 * Ưu tiên `position` từ BE; nếu thiếu thì đặt theo areaType hoặc chỉ số (layout mặc định).
 */
import type { FunctionalAreaFromApi, FunctionalAreaPosition } from "../../../shared/types/api";

/** width/height của assets/Cover_Floor_Plan.png (945×831) — giữ tỉ lệ khung hiển thị. */
export const FLOOR_PLAN_IMAGE_ASPECT = 945 / 831;

/** Slots theo layout mặt bằng – tâm chữ giữa từng khu (trên: ngủ, bếp, tắm; dưới: khách, hành lang). */
const SLOTS_BY_AREA_TYPE: Record<string, FunctionalAreaPosition> = {
  BEDROOM: { x: 4, y: 20, width: 30, height: 34 },
  KITCHEN: { x: 45, y: 20, width: 30, height: 34 },
  BATHROOM: { x: 70, y: 20, width: 34, height: 34 },
  LIVINGROOM: { x: 2, y: 53, width: 46, height: 34 },
  HALLWAY: { x: 54, y: 53, width: 46, height: 34 },
};

/** Slots dự phòng (khi có nhiều khu vực hơn 5). */
const FALLBACK_SLOTS: FunctionalAreaPosition[] = [
  { x: 2, y: 14, width: 30, height: 34 },
  { x: 27, y: 14, width: 30, height: 34 },
  { x: 58, y: 14, width: 34, height: 34 },
  { x: 2, y: 55, width: 46, height: 34 },
  { x: 52, y: 55, width: 46, height: 34 },
];

/**
 * Lấy vị trí cho khu vực: ưu tiên position từ BE, nếu không có thì layout theo areaType hoặc index.
 */
export function getPositionForArea(
  area: FunctionalAreaFromApi,
  index: number
): FunctionalAreaPosition {
  if (area.position) {
    return area.position;
  }
  const slot = SLOTS_BY_AREA_TYPE[area.areaType ?? ""];
  if (slot) return slot;
  return FALLBACK_SLOTS[index % FALLBACK_SLOTS.length];
}
