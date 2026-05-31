import React, { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { useFormatters } from "../../hooks/useFormatters";
import { useIotPreferences } from "../../hooks/usePreferences";
import { Text } from "../ui/Text";
import {
  buildBandPath,
  buildAreaPath,
  buildLinePath,
  makeScale,
  niceTicks,
  type Point,
} from "./chartMath";

export type ForecastSeriesPoint = {
  date: Date | string | number;
  actual?: number | null;
  forecast?: number | null;
  lower?: number | null;
  upper?: number | null;
};

export type ThresholdBand = {
  min?: number | null;
  max?: number | null;
  label?: string;
};

export type ForecastLineChartProps = {
  series: ReadonlyArray<ForecastSeriesPoint>;
  unit: string;
  domain?: DomainKey;
  width?: number;
  height?: number;
  threshold?: ThresholdBand;
  todayIndex?: number | null;
  showConfidence?: boolean;
  yLabel?: string;
  style?: ViewStyle;
  emptyLabel?: string;
};

export function ForecastLineChart({
  series,
  unit,
  domain,
  width = 320,
  height = 220,
  threshold,
  todayIndex,
  showConfidence,
  yLabel,
  style,
  emptyLabel,
}: ForecastLineChartProps) {
  const colors = useColors();
  const fmt = useFormatters();
  const iot = useIotPreferences();

  const palette = domain ? colors.domain[domain] : null;
  const accent = palette?.primary ?? colors.brand.primary;
  const showCI = (showConfidence ?? iot.showForecastConfidence) === true;

  const { actualPoints, forecastPoints, bandUpper, bandLower, domainY, domainX } = useMemo(() => {
    if (!series || series.length === 0) {
      return {
        actualPoints: [] as Point[],
        forecastPoints: [] as Point[],
        bandUpper: [] as Point[],
        bandLower: [] as Point[],
        domainY: [0, 1] as [number, number],
        domainX: [0, 1] as [number, number],
      };
    }
    const actuals: Point[] = [];
    const forecasts: Point[] = [];
    const upper: Point[] = [];
    const lower: Point[] = [];
    series.forEach((p, x) => {
      if (p.actual != null && Number.isFinite(p.actual)) {
        actuals.push({ x, y: p.actual });
      }
      if (p.forecast != null && Number.isFinite(p.forecast)) {
        forecasts.push({ x, y: p.forecast });
      }
      if (showCI && p.upper != null && Number.isFinite(p.upper)) {
        upper.push({ x, y: p.upper });
      }
      if (showCI && p.lower != null && Number.isFinite(p.lower)) {
        lower.push({ x, y: p.lower });
      }
    });

    const allY = [
      ...actuals.map((p) => p.y),
      ...forecasts.map((p) => p.y),
      ...upper.map((p) => p.y),
      ...lower.map((p) => p.y),
    ];
    if (threshold?.max != null) allY.push(threshold.max);
    if (threshold?.min != null) allY.push(threshold.min);
    const minY = allY.length ? Math.min(...allY, 0) : 0;
    const maxY = allY.length ? Math.max(...allY, 1) : 1;
    const padY = (maxY - minY) * 0.1 || 1;
    return {
      actualPoints: actuals,
      forecastPoints: forecasts,
      bandUpper: upper,
      bandLower: lower,
      domainX: [0, series.length - 1] as [number, number],
      domainY: [Math.max(0, minY - padY), maxY + padY] as [number, number],
    };
  }, [series, showCI, threshold]);

  if (!series || series.length < 2) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={emptyLabel}
        style={[
          {
            width,
            height,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg.surfaceMuted,
            borderRadius: 12,
          },
          style,
        ]}
      >
        <Text variant="bodySm" color="muted">
          {emptyLabel ?? "Chưa đủ dữ liệu để hiển thị biểu đồ"}
        </Text>
      </View>
    );
  }

  const margins = { top: 12, right: 16, bottom: 28, left: 44 };
  const scale = makeScale(width, height, domainX, domainY, margins);

  const actualPath = buildLinePath(actualPoints, scale, iot.chartCurveStyle);
  const actualAreaPath = buildAreaPath(actualPoints, scale, iot.chartCurveStyle);
  const forecastPath = buildLinePath(forecastPoints, scale, iot.chartCurveStyle);
  const bandPath =
    bandUpper.length === bandLower.length && bandUpper.length > 0
      ? buildBandPath(bandUpper, bandLower, scale, iot.chartCurveStyle)
      : "";

  const ticks = niceTicks(domainY[0], domainY[1], 4);
  const lastActual = actualPoints[actualPoints.length - 1];
  const todayPoint =
    todayIndex != null && todayIndex >= 0 && todayIndex < series.length
      ? todayIndex
      : actualPoints.length > 0
        ? actualPoints[actualPoints.length - 1].x
        : null;

  const gradientId = `forecast-${domain ?? "brand"}`;
  const labelEvery = Math.max(1, Math.floor(series.length / 6));

  return (
    <View style={style}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={accent} stopOpacity={0.32} />
            <Stop offset="100%" stopColor={accent} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {ticks.map((tick) => {
          const y = scale.toY(tick);
          return (
            <G key={`grid-${tick}`}>
              <Line
                x1={margins.left}
                x2={width - margins.right}
                y1={y}
                y2={y}
                stroke={colors.border.subtle}
                strokeWidth={1}
                strokeDasharray="2,4"
              />
              <SvgText
                x={margins.left - 6}
                y={y + 3}
                fontSize={10}
                fill={colors.text.muted}
                textAnchor="end"
              >
                {fmt.compactNumber(tick)}
              </SvgText>
            </G>
          );
        })}

        {threshold?.max != null ? (
          <Rect
            x={margins.left}
            y={scale.toY(threshold.max)}
            width={scale.innerWidth}
            height={Math.max(0, scale.toY(domainY[1]) - scale.toY(threshold.max))}
            fill={colors.status.critical.solid}
            opacity={0.08}
          />
        ) : null}
        {threshold?.max != null ? (
          <Line
            x1={margins.left}
            x2={width - margins.right}
            y1={scale.toY(threshold.max)}
            y2={scale.toY(threshold.max)}
            stroke={colors.status.critical.solid}
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        ) : null}

        {bandPath ? (
          <Path
            d={bandPath}
            fill={accent}
            opacity={0.14}
          />
        ) : null}

        {actualAreaPath ? (
          <Path d={actualAreaPath} fill={`url(#${gradientId})`} />
        ) : null}

        {forecastPath ? (
          <Path
            d={forecastPath}
            stroke={accent}
            strokeWidth={2}
            fill="none"
            strokeDasharray="6,4"
            strokeLinecap="round"
          />
        ) : null}
        {actualPath ? (
          <Path
            d={actualPath}
            stroke={accent}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {todayPoint != null ? (
          <Line
            x1={scale.toX(todayPoint)}
            x2={scale.toX(todayPoint)}
            y1={margins.top}
            y2={height - margins.bottom}
            stroke={colors.text.muted}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        ) : null}

        {lastActual ? (
          <Circle
            cx={scale.toX(lastActual.x)}
            cy={scale.toY(lastActual.y)}
            r={4}
            fill={accent}
            stroke={colors.bg.surface}
            strokeWidth={2}
          />
        ) : null}

        {series.map((point, i) => {
          if (i % labelEvery !== 0 && i !== series.length - 1) return null;
          return (
            <SvgText
              key={`xlabel-${i}`}
              x={scale.toX(i)}
              y={height - margins.bottom + 14}
              fontSize={9}
              fill={colors.text.muted}
              textAnchor="middle"
            >
              {fmt.monthDay(point.date)}
            </SvgText>
          );
        })}
      </Svg>
      {yLabel ? (
        <Text
          variant="caption"
          color="muted"
          style={{ marginTop: 4, textAlign: "right" }}
        >
          {yLabel} ({unit})
        </Text>
      ) : null}
    </View>
  );
}
