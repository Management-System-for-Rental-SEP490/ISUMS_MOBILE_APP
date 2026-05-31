import React from "react";
import { View, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { useColors } from "../../design/ThemeProvider";
import { useIotPreferences } from "../../hooks/usePreferences";
import { intensityColor } from "./intensity";
import {
  buildAreaPath,
  buildLinePath,
  makeScale,
  type Point,
} from "./chartMath";

export type SparklineProps = {
  values: ReadonlyArray<number>;
  width?: number;
  height?: number;
  color?: string;
  fillGradient?: boolean;
  showLast?: boolean;
  showBaseline?: boolean;
  intensity?: boolean;
  curve?: "smooth" | "linear" | "step";
  style?: ViewStyle;
};

export function Sparkline({
  values,
  width = 80,
  height = 28,
  color,
  fillGradient = true,
  showLast = true,
  showBaseline,
  intensity = false,
  curve,
  style,
}: SparklineProps) {
  const colors = useColors();
  const iot = useIotPreferences();
  const resolvedCurve = curve ?? iot.chartCurveStyle;

  if (!values || values.length < 2) {
    return (
      <View
        style={[
          {
            width,
            height,
            backgroundColor: colors.bg.surfaceMuted,
            borderRadius: 4,
            opacity: 0.5,
          },
          style,
        ]}
      />
    );
  }

  const sanitized = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...sanitized);
  const max = Math.max(...sanitized);
  const padding = (max - min) * 0.12 || 1;
  const domainY: [number, number] = [min - padding, max + padding];
  const domainX: [number, number] = [0, sanitized.length - 1];

  const margins = { top: 2, right: 2, bottom: 2, left: 2 };
  const scale = makeScale(width, height, domainX, domainY, margins);

  const points: Point[] = sanitized.map((y, x) => ({ x, y }));
  const linePath = buildLinePath(points, scale, resolvedCurve);
  const areaPath = buildAreaPath(points, scale, resolvedCurve);

  const last = sanitized[sanitized.length - 1];
  const first = sanitized[0];
  const ratio = max > 0 ? last / max : 0;
  const stroke = color ?? (intensity ? intensityColor(colors, ratio) : colors.brand.primary);
  const trend = last >= first;
  const trendColor = trend ? colors.status.warning.solid : colors.status.success.solid;
  const dotColor = intensity ? intensityColor(colors, ratio) : trendColor;

  const lastX = scale.toX(sanitized.length - 1);
  const lastY = scale.toY(last);
  const baselineY = scale.toY(0);
  const gradientId = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        {fillGradient ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <Stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>
        ) : null}
        {fillGradient ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {showBaseline ? (
          <Path
            d={`M ${margins.left} ${baselineY} L ${width - margins.right} ${baselineY}`}
            stroke={colors.border.subtle}
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        ) : null}
        <Path d={linePath} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {showLast ? (
          <Circle cx={lastX} cy={lastY} r={2.5} fill={dotColor} stroke={colors.bg.surface} strokeWidth={1} />
        ) : null}
      </Svg>
    </View>
  );
}
