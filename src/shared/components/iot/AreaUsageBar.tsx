import React from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { spacing } from "../../design/tokens";
import { useFormatters } from "../../hooks/useFormatters";
import { useDisplayPreferences } from "../../hooks/usePreferences";
import { Pressable } from "../ui/Pressable";
import { Text } from "../ui/Text";
import { HStack, VStack } from "../ui/Stack";
import { Sparkline } from "./Sparkline";

export type AreaUsageBarProps = {
  name: string;
  usage: number;
  unit: string;
  ratio: number;
  domain?: DomainKey;
  trend?: ReadonlyArray<number>;
  cost?: number | null;
  status?: "normal" | "warning" | "critical" | "offline";
  onPress?: () => void;
  style?: ViewStyle;
};

export function AreaUsageBar({
  name,
  usage,
  unit,
  ratio,
  domain = "electric",
  trend,
  cost,
  status = "normal",
  onPress,
  style,
}: AreaUsageBarProps) {
  const colors = useColors();
  const fmt = useFormatters();
  const display = useDisplayPreferences();
  const palette = colors.domain[domain];

  const fill = (() => {
    switch (status) {
      case "critical":
        return colors.status.critical.solid;
      case "warning":
        return colors.status.warning.solid;
      case "offline":
        return colors.text.muted;
      default:
        return palette.primary;
    }
  })();

  const fillRatio = Math.max(0.02, Math.min(1, ratio));

  return (
    <Pressable
      onPress={onPress}
      haptic="selection"
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.bg.surfaceMuted : colors.bg.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        ...style,
      })}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${fmt.decimal(usage)} ${unit}`}
    >
      <HStack align="center" justify="space-between">
        <VStack gap="xs" flex={1}>
          <Text variant="titleSm" weight="600" numberOfLines={1}>
            {name}
          </Text>
          <HStack align="baseline" gap="xs">
            <Text variant="titleLg" weight="700" customColor={fill}>
              {fmt.decimal(usage)}
            </Text>
            <Text variant="caption" color="muted">
              {unit}
            </Text>
          </HStack>
          {cost != null ? (
            <Text variant="caption" color="muted">
              ≈ {fmt.currency(cost)}
            </Text>
          ) : null}
        </VStack>
        {display.showAreaSparklines && trend && trend.length > 1 ? (
          <Sparkline values={trend} width={70} height={32} color={fill} />
        ) : null}
      </HStack>
      <View
        style={{
          marginTop: spacing.sm,
          height: 6,
          backgroundColor: colors.bg.surfaceMuted,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${fillRatio * 100}%`,
            height: "100%",
            backgroundColor: fill,
            borderRadius: 3,
          }}
        />
      </View>
    </Pressable>
  );
}
