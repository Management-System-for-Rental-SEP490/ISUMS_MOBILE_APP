import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTenantContext } from "../../../../../shared/hooks/useTenantContext";
import {
  useAreaTelemetry,
  useTenantIoTConnection,
  useTenantUsage,
} from "../../../hooks/useTenantIoT";
import { useTenantForecast } from "../../../hooks/useTenantForecast";
import { useColors, useDomainPalette } from "../../../../../shared/design";
import { spacing } from "../../../../../shared/design/tokens";
import {
  Badge,
  Card,
  Divider,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "../../../../../shared/components/ui";
import {
  AnimatedNumber,
  AreaUsageBar,
  CostBreakdownCard,
  ForecastLineChart,
  LiveBadge,
  MetricHero,
  Sparkline,
  StatusPill,
  type UtilityStatusKey,
} from "../../../../../shared/components/iot";
import { useFormatters } from "../../../../../shared/hooks/useFormatters";
import {
  useDisplayPreferences,
  useIotPreferences,
} from "../../../../../shared/hooks/usePreferences";
import { calculateCostFromTariff } from "../../../../../shared/utils/evnTariff";
import { getTenantAccessBlock } from "../../../../../shared/utils";
import { useWaterTariff } from "../../../../../shared/hooks/useTariff";
import type { ForecastDailyPoint } from "../../../../../shared/types/api";

export type WaterUsageScreenV2Props = {
  showHeader?: boolean;
};

type LeakSignal = {
  score: number;
  status: UtilityStatusKey;
  reasons: string[];
};

export default function WaterUsageScreenV2({
  showHeader: _showHeader = true,
}: WaterUsageScreenV2Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const palette = useDomainPalette("water");
  const fmt = useFormatters();
  const display = useDisplayPreferences();
  const iotPref = useIotPreferences();

  const tenant = useTenantContext();
  const { houseId, thingId, functionalAreas } = tenant;
  const accessBlock = useMemo(
    () => (tenant.house ? getTenantAccessBlock(tenant.house) : null),
    [tenant.house],
  );
  const runtimeHouseId = accessBlock ? null : houseId;
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const connected = useTenantIoTConnection(thingId);
  const telemetry = useAreaTelemetry(thingId, selectedAreaId);
  const usage = useTenantUsage({
    houseId: runtimeHouseId,
    metric: "water",
    areaId: selectedAreaId,
  });
  const forecast = useTenantForecast({
    houseId: runtimeHouseId,
    metric: "water",
    areaId: selectedAreaId,
  });

  const flowLpm = telemetry.water?.features?.w_lpm ?? 0;
  const totalLiters = telemetry.water?.features?.w_tot ?? 0;
  const deltaLiters = telemetry.water?.features?.d_w_tot ?? 0;
  const sensorLeakSuspected =
    telemetry.water?.features?.water_leak_suspected ?? false;
  const liveTimestamp = telemetry.water?.ts ?? null;

  const usageInM3 = usage.monthVal / 1000;
  const monthBudget = forecast.data
    ? Math.max(forecast.data.totalEstimate / 1000, 0.001)
    : null;

  const leakSignal = useMemo<LeakSignal>(() => {
    let score = 0;
    const reasons: string[] = [];
    const now = new Date();
    const hour = now.getHours();
    if (sensorLeakSuspected) {
      score += 50;
      reasons.push(t("smart.water.leak.sensor", { defaultValue: "Cảm biến phát hiện nghi ngờ rò rỉ" }));
    }
    if (flowLpm > 0 && hour >= 1 && hour <= 5) {
      score += 30;
      reasons.push(
        t("smart.water.leak.night_flow", {
          defaultValue: "Nước chảy lúc rạng sáng (1-5h)",
        }),
      );
    }
    const recentFlows = telemetry.waterHistory.slice(-12).filter((m) => (m.features?.w_lpm ?? 0) > 0);
    if (recentFlows.length >= 10) {
      score += 25;
      reasons.push(
        t("smart.water.leak.continuous", {
          defaultValue: "Nước chảy liên tục >10 lần đo gần nhất",
        }),
      );
    }
    score = Math.min(100, score);
    const status: UtilityStatusKey =
      score >= 70 ? "CRITICAL" : score >= 40 ? "WARNING" : score > 0 ? "WARNING" : "GOOD";
    return { score, status, reasons };
  }, [
    sensorLeakSuspected,
    flowLpm,
    telemetry.waterHistory,
    t,
  ]);

  const forecastSeries = useMemo(() => {
    const daily: ForecastDailyPoint[] = forecast.data?.dailyForecast ?? [];
    if (daily.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return daily.map((p) => {
      const d = new Date(p.ds);
      const isPast = d.getTime() < today.getTime();
      const yhatM3 = p.yhat / 1000;
      const lowerM3 = p.lower / 1000;
      const upperM3 = p.upper / 1000;
      return {
        date: d,
        actual: isPast ? yhatM3 : null,
        forecast: isPast ? null : yhatM3,
        lower: isPast ? null : lowerM3,
        upper: isPast ? null : upperM3,
      };
    });
  }, [forecast.data?.dailyForecast]);

  const todayIndex = useMemo(() => {
    if (forecastSeries.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ts = today.getTime();
    let best = 0;
    let bestDiff = Infinity;
    forecastSeries.forEach((p, i) => {
      const diff = Math.abs(p.date.getTime() - ts);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    });
    return best;
  }, [forecastSeries]);

  const flowSparklineData = useMemo(
    () =>
      telemetry.waterHistory
        .map((m) => m.features?.w_lpm ?? 0)
        .filter((v) => Number.isFinite(v))
        .slice(-30),
    [telemetry.waterHistory],
  );

  const waterTariff = useWaterTariff("HCM");

  const monthCost = useMemo(
    () =>
      iotPref.showCostEstimate
        ? calculateCostFromTariff(usageInM3, waterTariff.config)
        : null,
    [usageInM3, iotPref.showCostEstimate, waterTariff.config],
  );

  const monthlyForecastM3 = forecast.data
    ? forecast.data.totalEstimate / 1000
    : null;

  const areasWithRatio = useMemo(() => {
    return functionalAreas.map((a) => ({
      area: a,
      usageRatio: Math.random() * 0.7 + 0.05,
    }));
  }, [functionalAreas]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.canvas }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[palette.gradientFrom, palette.gradientTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <HStack justify="space-between" align="center">
            <VStack gap="xs">
              <Text
                variant="overline"
                customColor={palette.onPrimary}
                style={{ opacity: 0.85 }}
              >
                {tenant.house?.name ?? t("smart.water.title", { defaultValue: "Nước" })}
              </Text>
              <Text variant="titleLg" customColor={palette.onPrimary} weight="700">
                {t("smart.water.subtitle", { defaultValue: "Tiêu thụ tháng này" })}
              </Text>
            </VStack>
            <LiveBadge active={connected} domain="water" />
          </HStack>

          <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <MetricHero
              value={usageInM3}
              unit="m³"
              budget={monthBudget && monthBudget > 0 ? monthBudget : null}
              budgetLabel={
                monthBudget
                  ? `${t("smart.of", { defaultValue: "/" })}${fmt.decimal(monthBudget, 1)}`
                  : undefined
              }
              decimals={2}
              size={240}
              customColor={palette.onPrimary}
              caption={
                forecast.data
                  ? t("smart.water.budget_caption", {
                      defaultValue: "{{days}} ngày còn lại",
                      days: forecast.data.daysLeft,
                    })
                  : undefined
              }
            />
          </View>

          <HStack gap="sm" justify="space-between" style={{ marginTop: spacing.lg }}>
            <FlowTile
              label={t("smart.water.flow", { defaultValue: "Lưu lượng" })}
              value={flowLpm}
              unit="L/phút"
              decimals={2}
              accent={palette.onPrimary}
            />
            <FlowTile
              label={t("smart.water.delta", { defaultValue: "Vừa dùng" })}
              value={deltaLiters}
              unit="L"
              decimals={2}
              accent={palette.onPrimary}
            />
            <FlowTile
              label={t("smart.water.total", { defaultValue: "Tổng dồn" })}
              value={totalLiters}
              unit="L"
              decimals={0}
              accent={palette.onPrimary}
            />
          </HStack>

          {flowSparklineData.length > 1 ? (
            <View
              style={{
                marginTop: spacing.base,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 12,
                padding: spacing.sm,
              }}
            >
              <Text
                variant="caption"
                customColor={palette.onPrimary}
                style={{ opacity: 0.85, marginBottom: 4 }}
              >
                {t("smart.water.flow_trend", { defaultValue: "Lưu lượng 30 lần đo gần nhất" })}
              </Text>
              <Sparkline
                values={flowSparklineData}
                width={300}
                height={36}
                color={palette.onPrimary}
                fillGradient
                showLast
                intensity={false}
              />
            </View>
          ) : null}
        </LinearGradient>

        <VStack gap="base" style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}>
          <Card
            variant="outlined"
            style={{
              borderColor:
                leakSignal.status === "CRITICAL"
                  ? colors.status.critical.border
                  : leakSignal.status === "WARNING"
                    ? colors.status.warning.border
                    : colors.border.subtle,
              borderWidth: 1.5,
            }}
          >
            <HStack justify="space-between" align="center">
              <VStack gap="xs">
                <Text variant="overline" color="muted">
                  {t("smart.water.leak.title", { defaultValue: "Nguy cơ rò rỉ" })}
                </Text>
                <HStack align="baseline" gap="xs">
                  <AnimatedNumber
                    value={leakSignal.score}
                    decimals={0}
                    variant="metricLg"
                    customColor={
                      leakSignal.status === "CRITICAL"
                        ? colors.status.critical.fg
                        : leakSignal.status === "WARNING"
                          ? colors.status.warning.fg
                          : colors.status.success.fg
                    }
                  />
                  <Text variant="titleSm" color="muted">
                    /100
                  </Text>
                </HStack>
              </VStack>
              <StatusPill
                status={leakSignal.status}
                label={
                  leakSignal.status === "CRITICAL"
                    ? t("smart.water.leak.critical", { defaultValue: "Nguy hiểm" })
                    : leakSignal.status === "WARNING"
                      ? t("smart.water.leak.warning", { defaultValue: "Cảnh báo" })
                      : t("smart.water.leak.good", { defaultValue: "An toàn" })
                }
                size="md"
              />
            </HStack>
            {leakSignal.reasons.length > 0 ? (
              <VStack gap="xs" style={{ marginTop: spacing.sm }}>
                {leakSignal.reasons.map((r, i) => (
                  <Text key={i} variant="bodySm" color="secondary">
                    • {r}
                  </Text>
                ))}
              </VStack>
            ) : (
              <Text variant="bodySm" color="muted" style={{ marginTop: spacing.sm }}>
                {t("smart.water.leak.no_signals", {
                  defaultValue: "Không phát hiện dấu hiệu bất thường gần đây",
                })}
              </Text>
            )}
          </Card>

          {forecast.loading && !forecast.data ? (
            <Card variant="outlined">
              <Skeleton height={220} />
            </Card>
          ) : forecastSeries.length > 1 ? (
            <Card variant="outlined">
              <HStack justify="space-between" align="center">
                <VStack gap="xs">
                  <Text variant="overline" color="muted">
                    {t("smart.forecast.title", { defaultValue: "Dự đoán cuối tháng" })}
                  </Text>
                  <HStack align="baseline" gap="xs">
                    <AnimatedNumber
                      value={monthlyForecastM3 ?? 0}
                      decimals={2}
                      variant="metricLg"
                      customColor={palette.primary}
                    />
                    <Text variant="titleSm" color="muted">m³</Text>
                  </HStack>
                </VStack>
                <Badge
                  label={t("smart.forecast.method.ml", { defaultValue: "Prophet ML" })}
                  variant="soft"
                  domain="water"
                  size="sm"
                />
              </HStack>
              <View style={{ marginTop: spacing.md }}>
                <ForecastLineChart
                  series={forecastSeries}
                  unit="m³"
                  domain="water"
                  width={300}
                  height={200}
                  todayIndex={todayIndex}
                  yLabel={t("smart.forecast.daily", { defaultValue: "Mỗi ngày" })}
                />
              </View>
            </Card>
          ) : null}

          {iotPref.showCostEstimate ? (
            <CostBreakdownCard
              metric="water"
              usage={usageInM3}
              unit="m³"
              forecastTotal={monthlyForecastM3}
            />
          ) : null}

          {functionalAreas.length > 0 ? (
            <VStack gap="sm">
              <Text variant="overline" color="muted" style={{ paddingLeft: 4 }}>
                {t("smart.areas.title", { defaultValue: "Theo khu vực" })}
              </Text>
              <AreaUsageBar
                name={t("smart.areas.all", { defaultValue: "Toàn nhà" })}
                usage={usageInM3}
                unit="m³"
                ratio={1}
                domain="water"
                cost={monthCost?.totalVnd}
                onPress={() => setSelectedAreaId(null)}
                status={selectedAreaId === null ? "warning" : "normal"}
              />
              {areasWithRatio.map(({ area, usageRatio }) => (
                <AreaUsageBar
                  key={area.id}
                  name={area.name}
                  usage={usageInM3 * usageRatio}
                  unit="m³"
                  ratio={usageRatio}
                  domain="water"
                  cost={
                    monthCost ? Math.round(monthCost.totalVnd * usageRatio) : null
                  }
                  onPress={() => setSelectedAreaId(area.id)}
                  status={selectedAreaId === area.id ? "warning" : "normal"}
                />
              ))}
            </VStack>
          ) : null}

          {liveTimestamp && display.showLiveBadge ? (
            <Text
              variant="caption"
              color="muted"
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {t("smart.last_update", {
                defaultValue: "Cập nhật {{time}}",
                time: fmt.relativeTime(liveTimestamp),
              })}
            </Text>
          ) : null}
        </VStack>
      </ScrollView>
    </View>
  );
}

function FlowTile({
  label,
  value,
  unit,
  decimals,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  decimals: number;
  accent: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <Text variant="caption" customColor={accent} style={{ opacity: 0.8 }}>
        {label}
      </Text>
      <HStack align="baseline" gap="xs" style={{ marginTop: 4 }}>
        <AnimatedNumber
          value={value}
          decimals={decimals}
          variant="titleLg"
          customColor={accent}
          weight="700"
        />
        <Text variant="caption" customColor={accent} style={{ opacity: 0.85 }}>
          {unit}
        </Text>
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  heroGradient: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
