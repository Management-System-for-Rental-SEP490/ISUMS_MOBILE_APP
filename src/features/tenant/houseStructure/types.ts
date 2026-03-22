import type { FunctionalAreaFromApi } from "../../../shared/types/api";

/** Khu vực trên sơ đồ với vị trí SVG (viewBox 0 0 100 100). */
export interface AreaZone {
  /** ID trùng với functionalArea.id để map dữ liệu IoT. */
  id: string;
  /** Tên hiển thị. */
  name: string;
  /** Path dạng polygon (điểm) hoặc rect: x, y, width, height. */
  rect: { x: number; y: number; w: number; h: number };
}

/** Cấu hình sơ đồ cho một tầng. */
export interface FloorPlanConfig {
  floorNo: string;
  areas: AreaZone[];
}

/** Props chung cho FloorPlanView. */
export interface FloorPlanViewProps {
  /** Khu vực đang chọn (id hoặc "all"). */
  selectedAreaId: string;
  /** Tầng đang chọn ("all" | "1" | "2" | ...). */
  selectedFloor: string;
  /** Danh sách khu vực chức năng từ API (để map với sơ đồ). */
  functionalAreas: FunctionalAreaFromApi[];
  /** Callback khi bấm vào khu vực trên sơ đồ. */
  onSelectArea: (areaId: string) => void;
  /** Màu chủ đạo khi highlight (điện = xanh lá, nước = xanh dương). */
  accentColor?: string;
}
