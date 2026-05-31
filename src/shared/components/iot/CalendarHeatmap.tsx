import React, { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { useFormatters } from "../../hooks/useFormatters";
import { useDisplayPreferences } from "../../hooks/usePreferences";
import { Text } from "../ui/Text";
import { HStack, VStack } from "../ui/Stack";

export type HeatmapValue = {
  date: string;
  value: number;
};

export type CalendarHeatmapProps = {
  data: ReadonlyArray<HeatmapValue>;
  unit: string;
  domain?: DomainKey;
  weeks?: number;
  endDate?: Date;
  cellSize?: number;
  cellGap?: number;
  width?: number;
  showLegend?: boolean;
  style?: ViewStyle;
};

const WEEKDAY_LABELS_MON = ["T2", "", "T4", "", "T6", "", "CN"];
const WEEKDAY_LABELS_SUN = ["CN", "", "T3", "", "T5", "", "T7"];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] != null) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function CalendarHeatmap({
  data,
  unit,
  domain = "electric",
  weeks = 26,
  endDate,
  cellSize = 12,
  cellGap = 3,
  width,
  showLegend = true,
  style,
}: CalendarHeatmapProps) {
  const colors = useColors();
  const fmt = useFormatters();
  const display = useDisplayPreferences();
  const palette = colors.domain[domain];
  const weekStartsOn = display.weekStartsOn;

  const { matrix, monthMarkers, scale, end } = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.value));

    const safeEnd = endDate ?? new Date();
    safeEnd.setHours(0, 0, 0, 0);

    const endDay = safeEnd.getDay();
    const offsetToWeekEnd =
      weekStartsOn === 1
        ? endDay === 0
          ? 0
          : 7 - endDay
        : 6 - endDay;
    const weekEnd = new Date(safeEnd);
    weekEnd.setDate(weekEnd.getDate() + offsetToWeekEnd);

    const totalDays = weeks * 7;
    const startDate = new Date(weekEnd);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    const grid: Array<Array<{ date: Date; value: number | null; key: string }>> = [];
    const markers: Array<{ x: number; label: string }> = [];
    let currentMonth = -1;

    for (let w = 0; w < weeks; w += 1) {
      const col: Array<{ date: Date; value: number | null; key: string }> = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + d);
        const key = dateKey(date);
        const value = map.has(key) ? map.get(key)! : null;
        col.push({ date, value, key });
      }
      grid.push(col);
      const firstOfWeek = col[0].date;
      if (firstOfWeek.getMonth() !== currentMonth && firstOfWeek.getDate() <= 7) {
        currentMonth = firstOfWeek.getMonth();
        markers.push({
          x: w * (cellSize + cellGap),
          label: fmt.monthDay(firstOfWeek).split(" ")[1] ?? "",
        });
      }
    }

    const values = grid
      .flat()
      .map((c) => c.value)
      .filter((v): v is number => v != null && v > 0);
    const sorted = [...values].sort((a, b) => a - b);
    const thresholds = [
      quantile(sorted, 0.25),
      quantile(sorted, 0.5),
      quantile(sorted, 0.75),
      quantile(sorted, 0.95),
    ];

    return { matrix: grid, monthMarkers: markers, scale: thresholds, end: weekEnd };
  }, [data, weeks, endDate, cellSize, cellGap, fmt, weekStartsOn]);

  const colorForValue = (value: number | null): string => {
    if (value == null || value <= 0) return colors.bg.surfaceMuted;
    if (value < scale[0]) return tint(palette.primary, 0.18);
    if (value < scale[1]) return tint(palette.primary, 0.4);
    if (value < scale[2]) return tint(palette.primary, 0.65);
    if (value < scale[3]) return palette.primary;
    return darken(palette.primary, 0.15);
  };

  const labels = weekStartsOn === 1 ? WEEKDAY_LABELS_MON : WEEKDAY_LABELS_SUN;
  const labelGutter = 18;
  const headerHeight = 14;
  const svgWidth = labelGutter + weeks * (cellSize + cellGap);
  const svgHeight = headerHeight + 7 * (cellSize + cellGap) + 2;
  const finalWidth = width ?? svgWidth;

  const totalValue = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const peakDay = data.reduce<HeatmapValue | null>(
    (best, d) => (d.value > (best?.value ?? -Infinity) ? d : best),
    null,
  );

  const legendBuckets = [
    { color: colors.bg.surfaceMuted, label: "0" },
    { color: tint(palette.primary, 0.18), label: `<${fmt.compactNumber(scale[0])}` },
    { color: tint(palette.primary, 0.4), label: `<${fmt.compactNumber(scale[1])}` },
    { color: tint(palette.primary, 0.65), label: `<${fmt.compactNumber(scale[2])}` },
    { color: palette.primary, label: `<${fmt.compactNumber(scale[3])}` },
    { color: darken(palette.primary, 0.15), label: `≥${fmt.compactNumber(scale[3])}` },
  ];

  return (
    <View style={style}>
      <Svg width={finalWidth} height={svgHeight}>
        {labels.map((label, idx) =>
          label ? (
            <SvgText
              key={`weekday-${idx}`}
              x={0}
              y={headerHeight + idx * (cellSize + cellGap) + cellSize - 1}
              fontSize={9}
              fill={colors.text.muted}
            >
              {label}
            </SvgText>
          ) : null,
        )}

        {monthMarkers.map((m, i) => (
          <SvgText
            key={`month-${i}`}
            x={labelGutter + m.x}
            y={headerHeight - 4}
            fontSize={9}
            fill={colors.text.muted}
          >
            {m.label}
          </SvgText>
        ))}

        {matrix.map((col, w) => (
          <G key={`col-${w}`}>
            {col.map((cell, r) => {
              const isFuture = cell.date > end;
              const fill = isFuture
                ? "transparent"
                : colorForValue(cell.value);
              return (
                <Rect
                  key={cell.key}
                  x={labelGutter + w * (cellSize + cellGap)}
                  y={headerHeight + r * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  ry={2}
                  fill={fill}
                  stroke={
                    cell.date.toDateString() === new Date().toDateString()
                      ? colors.brand.primary
                      : undefined
                  }
                  strokeWidth={
                    cell.date.toDateString() === new Date().toDateString()
                      ? 1.5
                      : 0
                  }
                />
              );
            })}
          </G>
        ))}
      </Svg>

      {showLegend ? (
        <VStack gap="sm" style={{ marginTop: 12 }}>
          <HStack align="center" gap="sm">
            {legendBuckets.map((b) => (
              <HStack key={b.label} align="center" gap="xs">
                <View
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: b.color,
                    borderRadius: 2,
                  }}
                />
                <Text variant="caption" color="muted">
                  {b.label}
                </Text>
              </HStack>
            ))}
          </HStack>
          <HStack justify="space-between">
            <Text variant="caption" color="muted">
              Tổng: {fmt.decimal(totalValue, 1)} {unit}
            </Text>
            {peakDay ? (
              <Text variant="caption" color="muted">
                Cao nhất: {fmt.decimal(peakDay.value, 1)} {unit} ({fmt.monthDay(peakDay.date)})
              </Text>
            ) : null}
          </HStack>
        </VStack>
      ) : null}
    </View>
  );
}

function tint(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}
