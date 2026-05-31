import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTenantContext } from "../../../../../shared/hooks/useTenantContext";
import {
  useAreaTelemetry,
  useTenantIoTConnection,
} from "../../../hooks/useTenantIoT";
import { useColors, useDomainPalette } from "../../../../../shared/design";
import { spacing } from "../../../../../shared/design/tokens";
import {
  Card,
  HStack,
  Text,
  VStack,
} from "../../../../../shared/components/ui";
import {
  AnimatedNumber,
  LiveBadge,
  Sparkline,
  StatusPill,
} from "../../../../../shared/components/iot";
import { useFormatters } from "../../../../../shared/hooks/useFormatters";
import { useIotSafetyConfig } from "../../../../../shared/hooks/useIotSafetyConfig";
import {
  bgGradientForBand,
  evaluateSafety,
  statusLabelFor,
  thresholdRangeText,
  type StatusKey,
} from "../../../../../shared/utils/iotSafety";
import type { IotSafetyThresholdDto } from "../../../../../shared/services/iotSafetyApi";

export type AirQualityScreenProps = {
  showHeader?: boolean;
};

type SensorTileProps = {
  threshold: IotSafetyThresholdDto;
  value: number;
  history: number[];
  status: StatusKey;
  decimals: number;
  accentColor: string;
};

export default function AirQualityScreen({
  showHeader: _showHeader = true,
}: AirQualityScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const palette = useDomainPalette("air");
  const fmt = useFormatters();

  const tenant = useTenantContext();
  const { thingId } = tenant;
  const safety = useIotSafetyConfig();
  const config = safety.config;

  const connected = useTenantIoTConnection(thingId);
  const telemetry = useAreaTelemetry(thingId, null);

  const gasPpm = telemetry.gas?.features?.gas_ppm ?? 0;
  const tempC = telemetry.environment?.features?.temp_c ?? 0;
  const humidPct = telemetry.environment?.features?.humidity_pct ?? 0;
  const liveTimestamp =
    telemetry.environment?.ts ?? telemetry.gas?.ts ?? null;

  const evaluation = useMemo(
    () =>
      evaluateSafety(config, {
        gas_ppm: gasPpm,
        temp_c: tempC,
        humidity_pct: humidPct,
      }),
    [config, gasPpm, tempC, humidPct],
  );

  const gradient = bgGradientForBand(evaluation.band);

  const gasHistory = useMemo(
    () =>
      telemetry.gasHistory.map((m) => m.features?.gas_ppm ?? 0).slice(-30),
    [telemetry.gasHistory],
  );
  const tempHistory = useMemo(
    () =>
      telemetry.environmentHistory
        .map((m) => m.features?.temp_c ?? 0)
        .slice(-30),
    [telemetry.environmentHistory],
  );
  const humidHistory = useMemo(
    () =>
      telemetry.environmentHistory
        .map((m) => m.features?.humidity_pct ?? 0)
        .slice(-30),
    [telemetry.environmentHistory],
  );

  const insights = useMemo(() => {
    const items: string[] = [];
    config.thresholds.forEach((threshold) => {
      const status = evaluation.perMetricStatus[threshold.metric];
      if (status === "CRITICAL") {
        items.push(
          t("smart.air.insight.metric_critical", {
            defaultValue: "⚠ {{name}} ngoài ngưỡng nguy hiểm — kiểm tra ngay",
            name: threshold.displayName,
          }),
        );
      } else if (status === "WARNING") {
        items.push(
          t("smart.air.insight.metric_warning", {
            defaultValue: "● {{name}} đang ngoài dải comfort — cần điều chỉnh",
            name: threshold.displayName,
          }),
        );
      }
    });
    if (items.length === 0) {
      items.push(
        t("smart.air.insight.all_good", {
          defaultValue: "✓ Mọi chỉ số trong vùng an toàn",
        }),
      );
    }
    return items;
  }, [config.thresholds, evaluation.perMetricStatus, t]);

  const valueByMetric = (metric: string): number => {
    if (metric === "gas_ppm") return gasPpm;
    if (metric === "temp_c") return tempC;
    if (metric === "humidity_pct") return humidPct;
    return 0;
  };
  const historyByMetric = (metric: string): number[] => {
    if (metric === "gas_ppm") return gasHistory;
    if (metric === "temp_c") return tempHistory;
    if (metric === "humidity_pct") return humidHistory;
    return [];
  };
  const decimalsFor = (metric: string): number => {
    if (metric === "humidity_pct" || metric === "gas_ppm") return 0;
    return 1;
  };
  const accentForStatus = (status: StatusKey): string => {
    switch (status) {
      case "CRITICAL":
        return colors.status.critical.solid;
      case "WARNING":
        return colors.status.warning.solid;
      case "GOOD":
        return colors.status.success.solid;
      default:
        return colors.text.muted;
    }
  };

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
          colors={[gradient.from, gradient.to]}
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
                {tenant.house?.name ?? t("smart.air.title", { defaultValue: "Không khí" })}
              </Text>
              <Text variant="titleLg" customColor={palette.onPrimary} weight="700">
                {t("smart.air.subtitle", { defaultValue: "An toàn không khí trong nhà" })}
              </Text>
            </VStack>
            <LiveBadge active={connected} domain="air" />
          </HStack>

          <View style={{ marginTop: spacing["2xl"], alignItems: "center" }}>
            <Text
              variant="overline"
              customColor={palette.onPrimary}
              style={{ opacity: 0.85, marginBottom: 4 }}
            >
              {t("smart.air.safety_label", { defaultValue: "Chỉ số an toàn nội thất" })}
            </Text>
            <AnimatedNumber
              value={evaluation.score}
              decimals={0}
              variant="display"
              customColor={palette.onPrimary}
              weight="800"
            />
            <Text
              variant="titleXl"
              customColor={palette.onPrimary}
              weight="700"
              style={{ marginTop: -8 }}
            >
              {evaluation.band?.label ?? "—"}
            </Text>
            <Text
              variant="bodySm"
              customColor={palette.onPrimary}
              align="center"
              style={{ marginTop: spacing.sm, opacity: 0.92, paddingHorizontal: spacing.lg }}
            >
              {evaluation.band?.description ?? ""}
            </Text>
          </View>
        </LinearGradient>

        <VStack gap="base" style={{ paddingHorizontal: spacing.base, marginTop: spacing.base }}>
          {config.thresholds.map((threshold) => {
            const status = evaluation.perMetricStatus[threshold.metric] ?? "NO_DATA";
            return (
              <SensorCard
                key={threshold.metric}
                threshold={threshold}
                value={valueByMetric(threshold.metric)}
                history={historyByMetric(threshold.metric)}
                status={status}
                decimals={decimalsFor(threshold.metric)}
                accentColor={accentForStatus(status)}
              />
            );
          })}

          <Card variant="outlined">
            <Text
              variant="overline"
              color="muted"
              style={{ marginBottom: spacing.sm }}
            >
              {t("smart.air.insights_title", { defaultValue: "Khuyến nghị" })}
            </Text>
            <VStack gap="sm">
              {insights.map((line, i) => (
                <Text key={i} variant="body" color="primary">
                  {line}
                </Text>
              ))}
            </VStack>
          </Card>

          <Card
            variant="outlined"
            style={{
              backgroundColor: colors.bg.subtle,
              borderColor: colors.border.subtle,
            }}
          >
            <HStack align="center" gap="sm" style={{ marginBottom: spacing.sm }}>
              <Text variant="bodyLg">ⓘ</Text>
              <Text variant="overline" color="muted">
                {t("smart.air.sensor_info_title", {
                  defaultValue: "Thông tin cảm biến & phạm vi đo",
                })}
              </Text>
            </HStack>

            <VStack gap="sm">
              <View>
                <Text variant="label" weight="700">
                  {t("smart.air.sensor_what_measured", {
                    defaultValue: "Cảm biến đang dùng:",
                  })}
                </Text>
                {config.activeSensors.map((sensor) => (
                  <View key={sensor.code} style={{ marginTop: spacing.xs }}>
                    <Text variant="bodySm" weight="600">
                      • {sensor.displayName}
                    </Text>
                    <Text variant="caption" color="muted" style={{ marginLeft: 12 }}>
                      {sensor.accuracyNotes}
                    </Text>
                  </View>
                ))}
              </View>

              {config.capabilityGaps.length > 0 ? (
                <View>
                  <Text variant="label" weight="700" status="warning">
                    {t("smart.air.sensor_not_measured", {
                      defaultValue: "Hiện KHÔNG đo (cần nâng cấp hardware):",
                    })}
                  </Text>
                  {config.capabilityGaps.map((gap) => (
                    <View key={gap.metric} style={{ marginTop: spacing.xs }}>
                      <Text variant="bodySm" color="secondary">
                        • <Text variant="bodySm" weight="600">{gap.displayName}</Text> — {gap.description}
                      </Text>
                      <Text variant="caption" color="muted" style={{ marginLeft: 12 }}>
                        {gap.requiredSensor}
                        {gap.sensorPriceVndApprox != null
                          ? ` · ~${fmt.currency(gap.sensorPriceVndApprox)}`
                          : ""}
                        {" · "}
                        {gap.standardRef}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View
                style={{
                  marginTop: spacing.xs,
                  paddingTop: spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: colors.border.subtle,
                }}
              >
                <Text variant="caption" color="muted">
                  {config.disclaimer}
                </Text>
              </View>

              <View>
                <Text variant="caption" color="muted" weight="600">
                  📐 {t("smart.air.formula", { defaultValue: "Công thức tính" })}
                </Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {config.scoreFormulaDescription}
                </Text>
              </View>

              <View>
                <Text variant="caption" color="muted" weight="600">
                  📚 {t("smart.air.standards", { defaultValue: "Tiêu chuẩn áp dụng" })}
                </Text>
                <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                  {config.standardsApplied}
                </Text>
              </View>

              <HStack justify="space-between">
                <Text variant="caption" color="muted">
                  {t("smart.air.config_effective", {
                    defaultValue: "Hiệu lực từ {{date}}",
                    date: fmt.date(config.effectiveFrom),
                  })}
                </Text>
                {safety.isFallback ? (
                  <Text variant="caption" customColor={colors.status.warning.fg}>
                    ⚠ Offline
                  </Text>
                ) : (
                  <Text variant="caption" color="muted">
                    v{config.version}
                  </Text>
                )}
              </HStack>
            </VStack>
          </Card>

          {liveTimestamp ? (
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

function SensorCard({
  threshold,
  value,
  history,
  status,
  decimals,
  accentColor,
}: SensorTileProps) {
  const { t } = useTranslation();
  const statusLabel = statusLabelFor(threshold, status, {
    good: t("smart.air.status.safe", { defaultValue: "An toàn" }),
    warning: t("smart.air.status.elevated", { defaultValue: "Cần chú ý" }),
    critical: t("smart.air.status.danger", { defaultValue: "Nguy hiểm" }),
    offline: t("smart.air.status.offline", { defaultValue: "—" }),
  });

  return (
    <Card variant="outlined">
      <HStack justify="space-between" align="flex-start">
        <VStack gap="xs" flex={1}>
          <Text variant="overline" color="muted">
            {threshold.displayName}
          </Text>
          <HStack align="baseline" gap="xs">
            <AnimatedNumber
              value={value}
              decimals={decimals}
              variant="metric"
              weight="700"
              customColor={accentColor}
            />
            <Text variant="titleSm" color="muted">
              {threshold.unit}
            </Text>
          </HStack>
          <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
            {thresholdRangeText(threshold)}
          </Text>
          <Text variant="caption" color="muted" style={{ marginTop: 1 }}>
            📚 {threshold.standardRef}
          </Text>
        </VStack>
        <VStack gap="sm" align="flex-end">
          <StatusPill status={status} label={statusLabel} />
          {history.length > 1 ? (
            <Sparkline
              values={history}
              width={84}
              height={32}
              color={accentColor}
            />
          ) : null}
        </VStack>
      </HStack>
    </Card>
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
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
});
