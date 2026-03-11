/**
 * Wrapper hiển thị sơ đồ nhà:
 * - Khi chọn "Tất cả": hiển thị icon ngôi nhà (dữ liệu IoT tổng)
 * - Khi chọn tầng cụ thể: hiển thị sơ đồ mặt bằng tầng đó với các khu vực có thể bấm
 */
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";
import FloorPlanSvg from "./FloorPlanSvg";
import HouseIcon from "./HouseIcon";

export interface FloorPlanViewProps {
  /** "all" = tổng nhà, "1" | "2" | ... = tầng cụ thể. */
  selectedFloor: string;
  /** ID khu vực đang chọn (trong tầng). "all" = không chọn khu vực nào. */
  selectedAreaId: string;
  /** Danh sách khu vực từ API. */
  functionalAreas: FunctionalAreaFromApi[];
  /** Callback khi bấm vào khu vực trên sơ đồ. */
  onSelectArea: (areaId: string) => void;
  /** Màu accent (điện = #82A762, nước = #20B8EB). */
  accentColor?: string;
}

const FloorPlanView: React.FC<FloorPlanViewProps> = ({
  selectedFloor,
  selectedAreaId,
  functionalAreas,
  onSelectArea,
  accentColor = "#82A762",
}) => {
  const safeAreas = Array.isArray(functionalAreas) ? functionalAreas : [];
  const areasOfFloor = useMemo(() => {
    if (selectedFloor === "all") return [];
    return safeAreas.filter((a) => a.floorNo === selectedFloor);
  }, [safeAreas, selectedFloor]);

  if (selectedFloor === "all") {
    return (
      <View style={styles.allWrapper}>
        <HouseIcon color={accentColor} size={300} />
      </View>
    );
  }

  if (areasOfFloor.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FloorPlanSvg
        areas={areasOfFloor}
        selectedAreaId={selectedAreaId}
        onSelectArea={onSelectArea}
        accentColor={accentColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  allWrapper: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    marginBottom: 16,
    minHeight: 140,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default FloorPlanView;
