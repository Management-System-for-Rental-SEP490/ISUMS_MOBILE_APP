import React, { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { useFormatters } from "../../hooks/useFormatters";
import { useIotPreferences } from "../../hooks/usePreferences";
import { useElectricTariff, useWaterTariff } from "../../hooks/useTariff";
import { spacing } from "../../design/tokens";
import { Card } from "../ui/Card";
import { Text } from "../ui/Text";
import { Badge } from "../ui/Badge";
import { HStack, VStack } from "../ui/Stack";
import {
  calculateCostFromTariff,
  findUpcomingTier,
} from "../../utils/evnTariff";

const TIER_COLORS = ["#10B981", "#22C55E", "#FBBF24", "#F59E0B", "#F97316", "#DC2626"] as const;

export type CostBreakdownProps = {
  metric: "electricity" | "water";
  usage: number;
  unit: string;
  forecastTotal?: number | null;
  region?: string;
  style?: ViewStyle;
};

export function CostBreakdownCard({
  metric,
  usage,
  unit,
  forecastTotal,
  region = "HCM",
  style,
}: CostBreakdownProps) {
  const colors = useColors();
  const fmt = useFormatters();
  const iot = useIotPreferences();

  const electric = useElectricTariff();
  const water = useWaterTariff(region);
  const tariff = metric === "electricity" ? electric : water;

  const result = useMemo(
    () => calculateCostFromTariff(usage, tariff.config),
    [usage, tariff.config],
  );

  const forecastCost = useMemo(() => {
    if (forecastTotal == null) return null;
    return calculateCostFromTariff(forecastTotal, tariff.config).totalVnd;
  }, [forecastTotal, tariff.config]);

  if (!iot.showCostEstimate) return null;

  const segments = result.breakdown.filter((b) => b.unitsInTier > 0);
  const totalCostInBreakdown = segments.reduce((s, b) => s + b.costVnd, 0) || 1;
  const upcomingTier = findUpcomingTier(tariff.config, result.currentTierIndex);

  return (
    <Card variant="outlined" p="lg" style={style}>
      <HStack align="center" justify="space-between">
        <Text variant="overline" color="muted">
          Ước tính chi phí
        </Text>
        <Badge
          label={`${tariff.config.region} · ${tariff.config.plan}`}
          variant="soft"
          domain={metric === "electricity" ? "electric" : "water"}
        />
      </HStack>

      <View style={{ marginTop: spacing.sm }}>
        <Text variant="metricLg" weight="700">
          {fmt.currency(result.totalVnd)}
        </Text>
        <Text variant="bodySm" color="muted">
          {fmt.decimal(result.totalUnits, 1)} {unit} đã dùng đến hôm nay
        </Text>
      </View>

      {segments.length > 0 ? (
        <View style={{ marginTop: spacing.base }}>
          <View
            style={{
              flexDirection: "row",
              height: 14,
              borderRadius: 7,
              overflow: "hidden",
              backgroundColor: colors.bg.surfaceMuted,
            }}
          >
            {segments.map((seg, i) => (
              <View
                key={seg.tier.index}
                style={{
                  width: `${(seg.costVnd / totalCostInBreakdown) * 100}%`,
                  backgroundColor: TIER_COLORS[i] ?? colors.brand.primary,
                }}
                accessibilityLabel={`${seg.tier.label}: ${fmt.currency(seg.costVnd)}`}
              />
            ))}
          </View>
          <VStack gap="xs" style={{ marginTop: spacing.sm }}>
            {segments.map((seg, i) => (
              <HStack key={seg.tier.index} align="center" justify="space-between">
                <HStack align="center" gap="sm">
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: TIER_COLORS[i] ?? colors.brand.primary,
                    }}
                  />
                  <Text variant="bodySm">{seg.tier.label}</Text>
                </HStack>
                <Text variant="bodySm" weight="600">
                  {fmt.currency(seg.costVnd)}
                </Text>
              </HStack>
            ))}
          </VStack>
        </View>
      ) : null}

      <View
        style={{
          marginTop: spacing.base,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        }}
      >
        <HStack justify="space-between">
          <Text variant="caption" color="muted">Trước thuế/phí</Text>
          <Text variant="caption">{fmt.currency(result.preTaxVnd)}</Text>
        </HStack>
        {result.vatVnd > 0 ? (
          <HStack justify="space-between">
            <Text variant="caption" color="muted">
              VAT {fmt.percent(tariff.config.vatRate, 0)}
            </Text>
            <Text variant="caption">{fmt.currency(result.vatVnd)}</Text>
          </HStack>
        ) : null}
        {result.surchargeVnd > 0 ? (
          <HStack justify="space-between">
            <Text variant="caption" color="muted">
              {result.surchargeLabel ?? "Phụ phí"}{" "}
              {fmt.percent(tariff.config.surchargeRate, 0)}
            </Text>
            <Text variant="caption">{fmt.currency(result.surchargeVnd)}</Text>
          </HStack>
        ) : null}
      </View>

      {forecastCost != null ? (
        <View
          style={{
            marginTop: spacing.base,
            backgroundColor: colors.bg.subtle,
            borderRadius: 12,
            padding: spacing.md,
          }}
        >
          <Text variant="caption" color="muted">Dự kiến cuối tháng</Text>
          <Text variant="titleLg" weight="700" style={{ marginTop: 2 }}>
            {fmt.currency(forecastCost)}
          </Text>
        </View>
      ) : null}

      {upcomingTier && result.unitsUntilNextTier != null && result.unitsUntilNextTier < 30 ? (
        <View
          style={{
            marginTop: spacing.sm,
            backgroundColor: colors.status.warning.bg,
            borderColor: colors.status.warning.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: spacing.sm,
          }}
        >
          <Text variant="bodySm" customColor={colors.status.warning.fg} weight="600">
            ⚠ Sắp lên {upcomingTier.label}
          </Text>
          <Text variant="caption" customColor={colors.status.warning.fg}>
            Còn {fmt.decimal(result.unitsUntilNextTier, 1)} {unit} nữa giá sẽ tăng lên{" "}
            {fmt.number(upcomingTier.pricePerUnitVnd)}đ/{unit}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: spacing.base,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        }}
      >
        <Text variant="caption" color="muted">
          📚 Nguồn: {result.source}
        </Text>
        <HStack justify="space-between" style={{ marginTop: 2 }}>
          <Text variant="caption" color="muted">
            Hiệu lực từ {fmt.date(result.effectiveFrom)}
          </Text>
          {tariff.isFallback ? (
            <Text variant="caption" customColor={colors.status.warning.fg}>
              ⚠ Offline
            </Text>
          ) : (
            <Text variant="caption" color="muted">
              v{result.version}
            </Text>
          )}
        </HStack>
      </View>
    </Card>
  );
}
