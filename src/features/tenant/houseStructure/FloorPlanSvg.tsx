/**
 * Sơ đồ mặt bằng một tầng – vẽ theo kiểu Figma (đường tường + khu vực).
 * Mỗi khu vực là Rect có thể bấm; khu vực được chọn sẽ highlight và scale nhẹ.
 */
import React from "react";
import { View, useWindowDimensions, Pressable, StyleSheet } from "react-native";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";

interface FloorPlanSvgProps {
  /** Các khu vực thuộc tầng này (từ functionalAreas filtered by floorNo). */
  areas: FunctionalAreaFromApi[];
  /** ID khu vực đang chọn. */
  selectedAreaId: string;
  /** Callback khi bấm vào khu vực. */
  onSelectArea: (areaId: string) => void;
  /** Màu accent khi highlight. */
  accentColor?: string;
}

type AreaLayout = { area: FunctionalAreaFromApi; rect: { x: number; y: number; w: number; h: number } };

/** Chuẩn hóa vị trí khu vực theo viewBox 0 0 100 100. Layout mẫu dạng lưới. */
function getAreaRects(areas: FunctionalAreaFromApi[]): AreaLayout[] {
  if (areas.length === 0) return [];
  if (areas.length === 1) {
    return [{ area: areas[0], rect: { x: 5, y: 5, w: 90, h: 90 } }];
  }
  if (areas.length === 2) {
    return [
      { area: areas[0], rect: { x: 5, y: 5, w: 44, h: 90 } },
      { area: areas[1], rect: { x: 51, y: 5, w: 44, h: 90 } },
    ];
  }
  if (areas.length === 3) {
    return [
      { area: areas[0], rect: { x: 5, y: 5, w: 44, h: 44 } },
      { area: areas[1], rect: { x: 51, y: 5, w: 44, h: 44 } },
      { area: areas[2], rect: { x: 5, y: 51, w: 90, h: 44 } },
    ];
  }
  const rows = Math.ceil(areas.length / 2);
  const cellW = 44;
  const cellH = Math.min(40, 90 / rows);
  return areas.map((area, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    return {
      area,
      rect: {
        x: 5 + col * (cellW + 2),
        y: 5 + row * (cellH + 2),
        w: cellW,
        h: cellH,
      },
    };
  });
}

const FloorPlanSvg: React.FC<FloorPlanSvgProps> = ({
  areas,
  selectedAreaId,
  onSelectArea,
  accentColor = "#82A762",
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const svgSize = Math.min(screenWidth - 40, 320);
  const layout = getAreaRects(areas);

  if (areas.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={{ width: svgSize, height: svgSize }} collapsable={false}>
        <Svg width={svgSize} height={svgSize} viewBox="0 0 100 100">
          <Rect x={1} y={1} width={98} height={98} fill="none" stroke="#1e293b" strokeWidth={2} />
          {layout.map(({ area, rect }) => {
            const isSelected = selectedAreaId === area.id;
            const fillColor = isSelected ? accentColor : "rgba(168, 213, 186, 0.6)";
            const strokeColor = isSelected ? accentColor : "#94a3b8";
            const strokeWidth = isSelected ? 2.5 : 1;
            return (
              <G key={area.id}>
                <Rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.w}
                  height={rect.h}
                  fill={fillColor}
                  fillOpacity={isSelected ? 0.5 : 0.4}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  rx={4}
                />
                <SvgText
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2}
                  textAnchor="middle"
                  fontSize={5}
                  fill="#334155"
                  fontWeight={isSelected ? "bold" : "normal"}
                >
                  {area.name.length > 12 ? area.name.slice(0, 10) + "…" : area.name}
                </SvgText>
              </G>
            );
          })}
        </Svg>
        {/* Overlay Pressable cho mỗi khu vực */}
        {layout.map(({ area, rect }) => {
          const isSelected = selectedAreaId === area.id;
          const scale = isSelected ? 1.05 : 1;
          const left = (rect.x / 100) * svgSize;
          const top = (rect.y / 100) * svgSize;
          const w = (rect.w / 100) * svgSize;
          const h = (rect.h / 100) * svgSize;
          return (
            <Pressable
              key={area.id}
              style={[
                styles.areaOverlay,
                {
                  left,
                  top,
                  width: w,
                  height: h,
                  transform: [{ scale }],
                },
              ]}
              onPress={() => onSelectArea(area.id)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 16 },
  areaOverlay: {
    position: "absolute",
    backgroundColor: "transparent",
  },
});

export default FloorPlanSvg;
