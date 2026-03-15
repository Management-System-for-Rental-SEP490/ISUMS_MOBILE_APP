/**
 * Wrapper hiển thị sơ đồ nhà: ảnh house.png làm nền, các khu vực theo position.
 * Mặc định vào Tầng 1, hiển thị "Tất cả tầng" cho đến khi user bấm chọn khu vực cụ thể.
 */
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";
import FloorPlanSvg from "./FloorPlanSvg";

export interface FloorPlanViewProps {
  /** "1" | "2" | ... = tầng cụ thể (không còn "all"). */
  selectedFloor: string;
  /** ID khu vực đang chọn. "all" = tất cả tầng (không highlight khu vực nào). */
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
  const areasOfFloor = useMemo(
    () => safeAreas.filter((a) => a.floorNo === selectedFloor),
    [safeAreas, selectedFloor]
  );

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
  container: {
    marginBottom: 16,
  },
});

export default FloorPlanView;
