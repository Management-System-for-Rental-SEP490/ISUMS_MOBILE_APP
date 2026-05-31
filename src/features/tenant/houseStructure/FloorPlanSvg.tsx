/**
 * Khu vực chức năng một tầng: một dải nền nhạt + các ô cạnh nhau (không mái, không lồng nhiều viền).
 * **Tất cả khu trên một hàng ngang** (bếp | gara | phòng khách…), chia đều bề ngang; chỉ ô đang chọn có viền accent.
 */
import React from "react";
import { View, useWindowDimensions, Pressable, StyleSheet, Text } from "react-native";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";
import { brandPrimary, brandTintBg, neutral } from "../../../shared/theme/color";
import { mapLabelForFunctionalArea } from "../../../shared/utils";
import { appTypography } from "../../../shared/utils/typography";

/** Padding hai bên của dải (px × 2 được trừ khi chia chip). */
const BAND_PAD_X2 = 20;
const BAND_PAD_X2_COMPACT = 16;

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
  const hPad = compact ? 56 : 32;
  const maxW = compact ? 280 : 440;
  const frameWidth = Math.min(screenWidth - hPad, maxW);

  if (areas.length === 0) {
    return null;
  }

  const bandPadX2 = compact ? BAND_PAD_X2_COMPACT : BAND_PAD_X2;
  const innerContentW = frameWidth - bandPadX2;
  const gap = 6;
  const n = areas.length;
  const totalGap = (n - 1) * gap;
  const baseChipW = Math.max(1, Math.floor((innerContentW - totalGap) / n));
  /** Pixel dư sau floor — gom vào ô cuối để hàng khít khung (đồng bộ Staff). */
  const lastChipW = baseChipW + (innerContentW - totalGap - baseChipW * n);

  const chipTextStyle = compact ? appTypography.captionStrong : appTypography.chip;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.floorBand, compact && styles.floorBandCompact, { width: frameWidth }]}>
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
                    backgroundColor: isSelected ? brandTintBg : neutral.surface,
                    borderColor: isSelected ? accentColor : "transparent",
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
  );
};

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 4 },
  containerCompact: { paddingVertical: 2 },
  /** Một lớp nền nhạt, không viền ngoài — tách chip bằng khoảng trống + nền ô trắng. */
  floorBand: {
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: neutral.tileMuted,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  floorBandCompact: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 44,
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
