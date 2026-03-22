/**
 * Mock vị trí khu vực theo house.png.
 * Khi BE chưa có position, dùng mapping theo areaType.
 * Sau khi BE cập nhật API trả position, có thể bỏ logic mock này.
 */
import type { FunctionalAreaFromApi, FunctionalAreaPosition } from "../../../shared/types/api";

/** Slots theo layout house.png – tâm chữ nằm giữa từng phòng (trên: phòng ngủ, bếp, toilet; dưới: phòng khách, hành lang). */
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
 * Lấy vị trí cho khu vực: ưu tiên position từ BE, nếu không có thì dùng mock theo areaType hoặc index.
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

/** Mock khu vực cho 3 tầng khi BE trả về rỗng (dùng làm mẫu). */
const MOCK_AREAS_TEMPLATE: Omit<FunctionalAreaFromApi, "houseId">[] = [
  { id: "mock-1", name: "Phòng ngủ", areaType: "BEDROOM", floorNo: "1", description: null },
  { id: "mock-2", name: "Bếp", areaType: "KITCHEN", floorNo: "1", description: null },
  { id: "mock-3", name: "Toilet", areaType: "BATHROOM", floorNo: "1", description: null },
  { id: "mock-4", name: "Phòng khách", areaType: "LIVINGROOM", floorNo: "1", description: null },
  { id: "mock-5", name: "Hành lang", areaType: "HALLWAY", floorNo: "1", description: null },
  { id: "mock-6", name: "Phòng ngủ", areaType: "BEDROOM", floorNo: "2", description: null },
  { id: "mock-7", name: "Bếp", areaType: "KITCHEN", floorNo: "2", description: null },
  { id: "mock-8", name: "Toilet", areaType: "BATHROOM", floorNo: "2", description: null },
  { id: "mock-9", name: "Phòng khách", areaType: "LIVINGROOM", floorNo: "2", description: null },
  { id: "mock-10", name: "Hành lang", areaType: "HALLWAY", floorNo: "2", description: null },
  { id: "mock-11", name: "Phòng ngủ", areaType: "BEDROOM", floorNo: "3", description: null },
  { id: "mock-12", name: "Bếp", areaType: "KITCHEN", floorNo: "3", description: null },
  { id: "mock-13", name: "Toilet", areaType: "BATHROOM", floorNo: "3", description: null },
  { id: "mock-14", name: "Phòng khách", areaType: "LIVINGROOM", floorNo: "3", description: null },
  { id: "mock-15", name: "Hành lang", areaType: "HALLWAY", floorNo: "3", description: null },
];

/**
 * Trả về mock functional areas cho 3 tầng khi BE chưa có dữ liệu.
 * Dùng làm mẫu demo floor plan.
 */
export function getMockFunctionalAreas(houseId: string): FunctionalAreaFromApi[] {
  return MOCK_AREAS_TEMPLATE.map((a) => ({ ...a, houseId }));
}
