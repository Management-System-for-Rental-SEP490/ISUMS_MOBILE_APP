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
  usePowerControl,
} from "../../../hooks/useTenantIoT";
import { useTenantForecast } from "../../../hooks/useTenantForecast";
import { useColors, useDomainPalette } from "../../../../../shared/design";
import { spacing } from "../../../../../shared/design/tokens";
import {
  Badge,
  Box,
  Button,
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
  CalendarHeatmap,
  CostBreakdownCard,
  ForecastLineChart,
  LiveBadge,
  MetricHero,
  Sparkline,
  StatusPill,
  TrendIndicator,
} from "../../../../../shared/components/iot";
import { useFormatters } from "../../../../../shared/hooks/useFormatters";
import {
  useDisplayPreferences,
  useIotPreferences,
} from "../../../../../shared/hooks/usePreferences";
import { calculateCostFromTariff } from "../../../../../shared/utils/evnTariff";
import { getTenantAccessBlock } from "../../../../../shared/utils";
import { useElectricTariff } from "../../../../../shared/hooks/useTariff";
import { carbonImpactFromKwh } from "../../../../../shared/utils/carbon";
import type { ForecastDailyPoint } from "../../../../../shared/types/api";
import type { TelemetryMessage } from "../../../../../shared/types";

type Period = "day" | "week" | "month";

const PERIOD_LABEL_KEY: Record<Period, string> = {
  day: "smart.period.today",
  week: "smart.period.week",
  month: "smart.period.month",
};

export type ElectricUsageScreenV2Props = {
  showHeader?: boolean;
};

export default function ElectricUsageScreenV2({
  showHeader: _showHeader = true,
}: ElectricUsageScreenV2Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const palette = useDomainPalette("electric");
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
  const [period, setPeriod] = useState<Period>("day");

  const connected = useTenantIoTConnection(thingId);
  const telemetry = useAreaTelemetry(thingId, selectedAreaId);
  const usage = useTenantUsage({
    houseId: runtimeHouseId,
    metric: "electricity",
    areaId: selectedAreaId,
  });
  const forecast = useTenantForecast({
    houseId: runtimeHouseId,
    metric: "electricity",
    areaId: selectedAreaId,
  });
  const power = usePowerControl(runtimeHouseId);

  const periodValue =
    period === "day"
      ? usage.dayVal
      : period === "week"
        ? usage.weekVal
        : usage.monthVal;
  const periodLabel = t(PERIOD_LABEL_KEY[period]);

  const liveV = telemetry.power?.features?.v ?? 0;
  const liveA = telemetry.power?.features?.i ?? 0;
  const liveW = telemetry.power?.features?.p ?? 0;
  const liveDeltaKwh = telemetry.power?.features?.d_kwh ?? 0;
  const liveTimestamp = telemetry.power?.ts ?? null;

  const monthBudget = forecast.data?.totalEstimate ?? null;
  const monthlyForecastTotal = forecast.data?.totalEstimate ?? null;

  const forecastSeries = useMemo(() => {
    const daily: ForecastDailyPoint[] = forecast.data?.dailyForecast ?? [];
    if (daily.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return daily.map((p) => {
      const d = new Date(p.ds);
      const isPast = d.getTime() < today.getTime();
      return {
        date: d,
        actual: isPast ? p.yhat : null,
        forecast: isPast ? null : p.yhat,
        lower: isPast ? null : p.lower,
        upper: isPast ? null : p.upper,
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

  const heatmapData = useMemo(() => {
    return forecastSeries
      .filter((p) => p.actual != null)
      .map((p) => ({
        date: p.date.toISOString().slice(0, 10),
        value: p.actual ?? 0,
      }));
  }, [forecastSeries]);

  const sparklineHistory = useMemo(() => {
    return telemetry.powerHistory
      .map((m) => m.features?.p ?? 0)
      .filter((v) => Number.isFinite(v))
      .slice(-30);
  }, [telemetry.powerHistory]);

  const powerEvents = useMemo(() => {
    const events: Array<{ ts: number; kind: "lost" | "restored"; areaName?: string }> = [];
    telemetry.powerHistory.forEach((m) => {
      if (m.features?.power_lost) {
        events.push({ ts: m.ts, kind: "lost", areaName: m.areaName });
      }
      if (m.features?.power_restored) {
        events.push({ ts: m.ts, kind: "restored", areaName: m.areaName });
      }
    });
    return events.sort((a, b) => b.ts - a.ts).slice(0, 10);
  }, [telemetry.powerHistory]);

  const carbonImpact = useMemo(
    () => carbonImpactFromKwh(usage.monthVal),
    [usage.monthVal],
  );

  const electricTariff = useElectricTariff();

  const monthCost = useMemo(
    () =>
      iotPref.showCostEstimate
        ? calculateCostFromTariff(usage.monthVal, electricTariff.config)
        : null,
    [usage.monthVal, iotPref.showCostEstimate, electricTariff.config],
  );

  const areasWithRatio = useMemo(() => {
    const totals = functionalAreas.map((a) => ({
      area: a,
      usageRatio: Math.random() * 0.8 + 0.05,
    }));
    return totals;
  }, [functionalAreas]);

  const isLoading = tenant.isLoading || (usage.loading && usage.monthVal === 0);

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
                {tenant.house?.name ?? t("smart.electric.title", { defaultValue: "Điện" })}
              </Text>
              <Text variant="titleLg" customColor={palette.onPrimary} weight="700">
                {t("smart.electric.subtitle", { defaultValue: "Tiêu thụ tháng này" })}
              </Text>
            </VStack>
            <LiveBadge active={connected} domain="electric" />
          </HStack>

          <View style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <MetricHero
              value={usage.monthVal}
              unit="kWh"
              budget={monthBudget && monthBudget > 0 ? monthBudget : null}
              budgetLabel={
                monthBudget
                  ? `${t("smart.of", { defaultValue: "/" })}${fmt.decimal(monthBudget, 0)}`
                  : undefined
              }
              decimals={1}
              size={240}
              customColor={palette.onPrimary}
              caption={
                forecast.data
                  ? t("smart.electric.budget_caption", {
                      defaultValue: "{{days}} ngày còn lại trong tháng",
                      days: forecast.data.daysLeft,
                    })
                  : undefined
              }
            />
          </View>

          <HStack gap="sm" justify="space-between" style={{ marginTop: spacing.lg }}>
            <LiveTile
              label={t("smart.live.voltage", { defaultValue: "Điện áp" })}
              value={liveV}
              unit="V"
              decimals={0}
              accent={palette.onPrimary}
            />
            <LiveTile
              label={t("smart.live.current", { defaultValue: "Dòng điện" })}
              value={liveA}
              unit="A"
              decimals={1}
              accent={palette.onPrimary}
            />
            <LiveTile
              label={t("smart.live.power", { defaultValue: "Công suất" })}
              value={liveW}
              unit="W"
              decimals={0}
              accent={palette.onPrimary}
            />
          </HStack>

          {sparklineHistory.length > 1 ? (
            <View
              style={{
                marginTop: spacing.base,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 12,
                padding: spacing.sm,
              }}
            >
              <HStack justify="space-between" align="center" style={{ marginBottom: 4 }}>
                <Text
                  variant="caption"
                  customColor={palette.onPrimary}
                  style={{ opacity: 0.85 }}
                >
                  {t("smart.live.power_trend", { defaultValue: "Công suất 30 lần đo gần nhất" })}
                </Text>
                {liveDeltaKwh > 0 ? (
                  <Text variant="caption" customColor={palette.onPrimary} weight="600">
                    +{fmt.decimal(liveDeltaKwh, 3)} kWh
                  </Text>
                ) : null}
              </HStack>
              <Sparkline
                values={sparklineHistory}
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
          <PeriodPicker
            current={period}
            onChange={setPeriod}
            day={usage.dayVal}
            week={usage.weekVal}
            month={usage.monthVal}
            unit="kWh"
            loading={usage.loading}
          />

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
                      value={forecast.data?.totalEstimate ?? 0}
                      decimals={0}
                      variant="metricLg"
                      customColor={palette.primary}
                    />
                    <Text variant="titleSm" color="muted">kWh</Text>
                  </HStack>
                </VStack>
                {forecast.data?.trend ? (
                  <TrendIndicator
                    value={
                      forecast.data.trend === "up"
                        ? +forecast.data.forecastRemaining
                        : forecast.data.trend === "down"
                          ? -forecast.data.forecastRemaining
                          : 0
                    }
                    unit="kWh"
                    decimals={1}
                    invertedSemantic
                  />
                ) : null}
              </HStack>
              <Box mt="md">
                <ForecastLineChart
                  series={forecastSeries}
                  unit="kWh"
                  domain="electric"
                  width={300}
                  height={200}
                  todayIndex={todayIndex}
                  yLabel={t("smart.forecast.daily", { defaultValue: "Mỗi ngày" })}
                />
              </Box>
              <HStack justify="space-between" align="center" style={{ marginTop: spacing.sm }}>
                <Badge
                  label={
                    forecast.data?.method === "prophet_weekly" ||
                    forecast.data?.method === "prophet_monthly"
                      ? t("smart.forecast.method.ml", { defaultValue: "Prophet ML" })
                      : t("smart.forecast.method.statistical", { defaultValue: "Thống kê" })
                  }
                  variant="soft"
                  domain="electric"
                  size="sm"
                />
                <Text variant="caption" color="muted">
                  {t("smart.forecast.training_rows", {
                    defaultValue: "{{rows}} ngày dữ liệu",
                    rows: forecast.data?.trainingRows ?? 0,
                  })}
                </Text>
              </HStack>
            </Card>
          ) : null}

          {iotPref.showCostEstimate ? (
            <CostBreakdownCard
              metric="electricity"
              usage={usage.monthVal}
              unit="kWh"
              forecastTotal={monthlyForecastTotal}
            />
          ) : null}

          {iotPref.showCarbonFootprint ? (
            <Card variant="outlined">
              <HStack justify="space-between" align="center">
                <VStack gap="xs">
                  <Text variant="overline" color="muted">
                    {t("smart.carbon.title", { defaultValue: "Dấu chân carbon" })}
                  </Text>
                  <HStack align="baseline" gap="xs">
                    <Text variant="metric" weight="700" status="warning">
                      {fmt.decimal(carbonImpact.kgCo2, 1)}
                    </Text>
                    <Text variant="titleSm" color="muted">kg CO₂</Text>
                  </HStack>
                </VStack>
                <Box align="flex-end">
                  <Text variant="caption" color="muted" align="right">
                    🌳 {fmt.decimal(carbonImpact.treesEquivalent, 1)} {t("smart.carbon.trees", { defaultValue: "cây hấp thụ/năm" })}
                  </Text>
                  <Text variant="caption" color="muted" align="right">
                    🚗 {fmt.decimal(carbonImpact.kmCarEquivalent, 0)} {t("smart.carbon.km", { defaultValue: "km xe xăng" })}
                  </Text>
                </Box>
              </HStack>
            </Card>
          ) : null}

          {functionalAreas.length > 0 ? (
            <VStack gap="sm">
              <Text variant="overline" color="muted" style={{ paddingLeft: 4 }}>
                {t("smart.areas.title", { defaultValue: "Theo khu vực" })}
              </Text>
              <AreaUsageBar
                name={t("smart.areas.all", { defaultValue: "Toàn nhà" })}
                usage={usage.monthVal}
                unit="kWh"
                ratio={1}
                domain="electric"
                cost={monthCost?.totalVnd}
                onPress={() => setSelectedAreaId(null)}
                status={selectedAreaId === null ? "warning" : "normal"}
              />
              {areasWithRatio.map(({ area, usageRatio }) => (
                <AreaUsageBar
                  key={area.id}
                  name={area.name}
                  usage={usage.monthVal * usageRatio}
                  unit="kWh"
                  ratio={usageRatio}
                  domain="electric"
                  cost={
                    monthCost ? Math.round(monthCost.totalVnd * usageRatio) : null
                  }
                  onPress={() => setSelectedAreaId(area.id)}
                  status={selectedAreaId === area.id ? "warning" : "normal"}
                />
              ))}
            </VStack>
          ) : null}

          {heatmapData.length > 7 ? (
            <Card variant="outlined">
              <Text variant="overline" color="muted" style={{ marginBottom: 4 }}>
                {t("smart.heatmap.title", { defaultValue: "Lịch tiêu thụ" })}
              </Text>
              <Text variant="bodySm" color="muted" style={{ marginBottom: spacing.sm }}>
                {t("smart.heatmap.subtitle", {
                  defaultValue: "Mức tiêu thụ mỗi ngày trong vài tháng qua",
                })}
              </Text>
              <CalendarHeatmap
                data={heatmapData}
                unit="kWh"
                domain="electric"
                weeks={26}
                cellSize={11}
                cellGap={3}
              />
            </Card>
          ) : null}

          {powerEvents.length > 0 ? (
            <Card variant="outlined">
              <Text variant="overline" color="muted" style={{ marginBottom: spacing.sm }}>
                {t("smart.events.title", { defaultValue: "Lịch sử sự kiện điện" })}
              </Text>
              {powerEvents.map((e, idx) => (
                <View key={`${e.ts}-${idx}`}>
                  <HStack justify="space-between" align="center" style={{ paddingVertical: 6 }}>
                    <HStack align="center" gap="sm">
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor:
                            e.kind === "lost"
                              ? colors.status.critical.solid
                              : colors.status.success.solid,
                        }}
                      />
                      <VStack gap="xs">
                        <Text variant="bodySm" weight="600">
                          {e.kind === "lost"
                            ? t("smart.events.lost", { defaultValue: "Mất điện" })
                            : t("smart.events.restored", { defaultValue: "Có điện trở lại" })}
                        </Text>
                        {e.areaName ? (
                          <Text variant="caption" color="muted">
                            {e.areaName}
                          </Text>
                        ) : null}
                      </VStack>
                    </HStack>
                    <Text variant="caption" color="muted">
                      {fmt.relativeTime(e.ts)}
                    </Text>
                  </HStack>
                  {idx < powerEvents.length - 1 ? <Divider /> : null}
                </View>
              ))}
            </Card>
          ) : null}

          {selectedAreaId ? (
            <Card variant="outlined">
              <HStack justify="space-between" align="center">
                <VStack gap="xs">
                  <Text variant="overline" color="muted">
                    {t("smart.power_control", { defaultValue: "Điều khiển nguồn" })}
                  </Text>
                  <Text variant="titleSm">
                    {functionalAreas.find((a) => a.id === selectedAreaId)?.name}
                  </Text>
                </VStack>
                <HStack gap="sm">
                  <Button
                    label={t("smart.power.off", { defaultValue: "Tắt" })}
                    variant="destructive"
                    size="sm"
                    loading={power.loading}
                    onPress={() => void power.toggle(selectedAreaId, "OFF")}
                  />
                  <Button
                    label={t("smart.power.on", { defaultValue: "Bật" })}
                    variant="primary"
                    size="sm"
                    loading={power.loading}
                    onPress={() => void power.toggle(selectedAreaId, "ON")}
                  />
                </HStack>
              </HStack>
            </Card>
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

      {isLoading ? (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <Box
            bg="surface"
            rounded="lg"
            p="lg"
            style={{ borderWidth: 1, borderColor: colors.border.subtle }}
          >
            <Text variant="body" color="muted">
              {t("smart.loading", { defaultValue: "Đang tải dữ liệu..." })}
            </Text>
          </Box>
        </View>
      ) : null}
    </View>
  );
}

function PeriodPicker({
  current,
  onChange,
  day,
  week,
  month,
  unit,
  loading,
}: {
  current: Period;
  onChange: (p: Period) => void;
  day: number;
  week: number;
  month: number;
  unit: string;
  loading: boolean;
}) {
  const colors = useColors();
  const fmt = useFormatters();
  const palette = useDomainPalette("electric");
  const { t } = useTranslation();

  const items: Array<{ key: Period; label: string; value: number }> = [
    { key: "day", label: t("smart.period.today", { defaultValue: "Hôm nay" }), value: day },
    { key: "week", label: t("smart.period.week", { defaultValue: "Tuần này" }), value: week },
    { key: "month", label: t("smart.period.month", { defaultValue: "Tháng này" }), value: month },
  ];

  return (
    <HStack gap="sm" style={{ paddingHorizontal: 0 }}>
      {items.map((it) => {
        const active = current === it.key;
        return (
          <Card
            key={it.key}
            variant={active ? "elevated" : "outlined"}
            p="sm"
            style={{
              flex: 1,
              borderColor: active ? palette.primary : colors.border.subtle,
              borderWidth: 1.5,
              backgroundColor: active ? palette.primarySoft : colors.bg.surface,
            }}
            onTouchEnd={() => onChange(it.key)}
          >
            <Text variant="caption" color="muted">
              {it.label}
            </Text>
            <HStack align="baseline" gap="xs" style={{ marginTop: 4 }}>
              <Text
                variant="titleMd"
                weight="700"
                customColor={active ? palette.primary : colors.text.primary}
              >
                {loading && it.value === 0 ? "—" : fmt.decimal(it.value, 1)}
              </Text>
              <Text variant="caption" color="muted">
                {unit}
              </Text>
            </HStack>
          </Card>
        );
      })}
    </HStack>
  );
}

function LiveTile({
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
  loadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
});
