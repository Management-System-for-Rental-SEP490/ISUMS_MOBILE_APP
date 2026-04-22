/**
 * Khu vực chức năng một tầng: mái + khung ngoài + sàn trong.
 * **Tất cả khu trên một hàng ngang** (bếp | gara | phòng khách…), chia đều bề ngang trong khung.
 */
import React from "react";
import { View, useWindowDimensions, Pressable, StyleSheet, Text } from "react-native";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";
import { brandPrimary, brandTintBg, neutral } from "../../../shared/theme/color";
import { mapLabelForFunctionalArea } from "../../../shared/utils";
import { appTypography } from "../../../shared/utils/typography";

/** Tổng padding ngang/đọc (trái+phải hoặc trên+dưới) để tính `innerContentW` / `innerMinH`. */
const OUTER_PAD_X2 = 16;
const INNER_PAD_FULL_X2 = 20;
const INNER_PAD_COMPACT_X2 = 16;
const INNER_BORDER_X2 = 2;

interface FloorPlanSvgProps {
  areas: FunctionalAreaFromApi[];
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
  accentColor?: string;
  compact?: boolean;
}

const FloorPlanSvg: React.FC<FloorPlanSvgProps> = ({
  areas,
  selectedAreaId,
  onSelectArea,
  accentColor = brandPrimary,
  compact = false,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const hPad = compact ? 56 : 24;
  const maxW = compact ? 280 : 440;
  const frameWidth = Math.min(screenWidth - hPad, maxW);

  if (areas.length === 0) {
    return null;
  }

  const gap = compact ? 6 : 8;
  const innerPadY2 = compact ? INNER_PAD_COMPACT_X2 : INNER_PAD_FULL_X2;
  const innerPadX2 = innerPadY2;
  const innerContentW =
    frameWidth - OUTER_PAD_X2 - innerPadX2 - INNER_BORDER_X2;

  const n = areas.length;
  const totalGap = (n - 1) * gap;
  const baseChipW = Math.max(1, Math.floor((innerContentW - totalGap) / n));
  /** Pixel dư sau floor — gom vào ô cuối để hàng khít khung (đồng bộ Staff). */
  const lastChipW = baseChipW + (innerContentW - totalGap - baseChipW * n);

  /** Một hàng chip — giữ thấp (tenant: “map” / sơ đồ không chiếm dọc quá nhiều). */
  const rowStride = compact ? 36 : 40;
  const innerMinH = innerPadY2 + rowStride;

  const chipTextStyle = compact ? appTypography.captionStrong : appTypography.chip;
  const roofW = frameWidth * (compact ? 0.5 : 0.54);
  const roofH = compact ? 6 : 8;

  return (
    <View style={styles.container}>
      <View style={[styles.houseColumn, { width: frameWidth }]}>
        <View style={[styles.roofCap, { width: roofW, height: roofH }]} />
        <View style={styles.outerShell}>
          <View
            style={[
              styles.innerFloor,
              compact && styles.innerFloorCompact,
              { minHeight: innerMinH },
            ]}
          >
            <View style={[styles.chipsRow, { gap }]}>
              {areas.map((area, index) => {
                const isSelected = selectedAreaId === area.id;
                const label = mapLabelForFunctionalArea(area.name);
                const cellW = index === n - 1 ? lastChipW : baseChipW;
                return (
                  <Pressable
                    key={area.id}
                    accessibilityRole="button"
                    onPress={() => onSelectArea(area.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      compact && styles.chipCompact,
                      { width: cellW },
                      {
                        borderColor: isSelected ? accentColor : neutral.border,
                        backgroundColor: isSelected ? brandTintBg : neutral.surface,
                      },
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        chipTextStyle,
                        styles.chipLabel,
                        { color: isSelected ? accentColor : neutral.slate900 },
                      ]}
                      numberOfLines={2}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 2 },
  houseColumn: { alignSelf: "center", alignItems: "center" },
  roofCap: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: neutral.slate300,
    marginBottom: 2,
  },
  outerShell: {
    width: "100%",
    borderWidth: 2,
    borderColor: neutral.slate300,
    borderRadius: 12,
    backgroundColor: neutral.backgroundSubtle,
    paddingTop: 6,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  innerFloor: {
    borderWidth: 1,
    borderColor: neutral.border,
    borderRadius: 10,
    backgroundColor: neutral.backgroundElevated,
    padding: 10,
  },
  innerFloorCompact: {
    padding: 8,
    borderRadius: 9,
  },
  /** Một hàng ngang duy nhất — không wrap xuống dòng. */
  chipsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  chipCompact: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: 9,
  },
  chipLabel: { textAlign: "center" },
  chipPressed: { opacity: 0.88 },
});

export default FloorPlanSvg;
