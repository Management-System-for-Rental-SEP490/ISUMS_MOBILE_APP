import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import type { FunctionalAreaFromApi } from "../../../shared/types/api";
import { brandPrimary, brandTintBg, neutral } from "../../../shared/theme/color";
import { mapLabelForFunctionalArea } from "../../../shared/utils";
import { appTypography } from "../../../shared/utils/typography";

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
  if (areas.length === 0) return null;

  const gap = compact ? 6 : 8;
  const chipTextStyle = compact ? appTypography.captionStrong : appTypography.chip;

  return (
    <View style={styles.container}>
      <View style={[styles.chipsRow, { gap }]}>
        {areas.map((area) => {
          const isSelected = selectedAreaId === area.id;
          const label = mapLabelForFunctionalArea(area.name);
          return (
            <Pressable
              key={area.id}
              accessibilityRole="button"
              onPress={() => onSelectArea(area.id)}
              style={({ pressed }) => [
                styles.chip,
                compact && styles.chipCompact,
                isSelected
                  ? { borderColor: accentColor, backgroundColor: brandTintBg }
                  : { borderColor: neutral.border, backgroundColor: neutral.surface },
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[
                  chipTextStyle,
                  styles.chipLabel,
                  { color: isSelected ? accentColor : neutral.slate600 },
                  isSelected && { fontWeight: "700" },
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
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderWidth: 1,
    borderColor: neutral.border,
    borderRadius: 12,
    backgroundColor: neutral.backgroundSubtle,
    padding: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
  },
  chip: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  chipCompact: {
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 9,
  },
  chipLabel: { textAlign: "center" },
  chipPressed: { opacity: 0.75 },
});

export default FloorPlanSvg;
