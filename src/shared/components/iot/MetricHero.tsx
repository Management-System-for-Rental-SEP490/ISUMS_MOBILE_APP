import React from "react";
import { View, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { spacing } from "../../design/tokens";
import { Text } from "../ui/Text";
import { AnimatedNumber } from "./AnimatedNumber";
import { RadialProgress } from "./RadialProgress";
import { TrendIndicator } from "./TrendIndicator";
import { LiveBadge } from "./LiveBadge";
import { intensityFromRatio } from "./intensity";

export type MetricHeroProps = {
  value: number;
  unit: string;
  label?: string;
  domain?: DomainKey;
  budget?: number | null;
  budgetLabel?: string;
  delta?: { value: number; unit?: string };
  isLive?: boolean;
  decimals?: number;
  size?: number;
  showRadial?: boolean;
  customColor?: string;
  style?: ViewStyle;
  caption?: string;
};

export function MetricHero({
  value,
  unit,
  label,
  domain,
  budget,
  budgetLabel,
  delta,
  isLive,
  decimals = 0,
  size = 240,
  showRadial = true,
  customColor,
  style,
  caption,
}: MetricHeroProps) {
  const colors = useColors();
  const palette = domain ? colors.domain[domain] : null;
  const accentColor = customColor ?? palette?.primary ?? colors.brand.primary;
  const ratio = budget && budget > 0 ? Math.min(value / budget, 1.5) : 0;
  const intensity = intensityFromRatio(ratio);

  const inner = (
    <View style={{ alignItems: "center", paddingHorizontal: spacing.base }}>
      {label ? (
        <Text variant="overline" color="muted" align="center">
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 4,
          gap: 6,
        }}
      >
        <AnimatedNumber
          value={value}
          decimals={decimals}
          variant="hero"
          customColor={accentColor}
          align="center"
        />
        <Text variant="titleMd" color="muted">
          {unit}
        </Text>
      </View>
      {budget && budget > 0 ? (
        <Text variant="caption" color="muted" align="center" style={{ marginTop: 4 }}>
          {budgetLabel ?? `/${budget}`} {unit}
        </Text>
      ) : null}
      {delta ? (
        <View style={{ marginTop: 8 }}>
          <TrendIndicator value={delta.value} unit={delta.unit ?? unit} />
        </View>
      ) : null}
      {caption ? (
        <Text variant="caption" color="muted" align="center" style={{ marginTop: 6 }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  if (!showRadial) {
    return (
      <View style={[{ alignItems: "center", padding: spacing.lg }, style]}>
        {isLive ? (
          <View style={{ marginBottom: spacing.sm }}>
            <LiveBadge active={isLive} domain={domain} />
          </View>
        ) : null}
        {inner}
      </View>
    );
  }

  return (
    <View style={[{ alignItems: "center", padding: spacing.base }, style]}>
      {isLive ? (
        <View style={{ marginBottom: spacing.sm }}>
          <LiveBadge active={isLive} domain={domain} />
        </View>
      ) : null}
      <RadialProgress
        value={value}
        max={budget && budget > 0 ? budget : Math.max(value * 1.2, 1)}
        size={size}
        strokeWidth={Math.round(size * 0.06)}
        progressColor={accentColor}
        intensity={!customColor && !palette}
        gradientId={domain ? `radial-${domain}` : undefined}
        gradientFrom={palette?.gradientFrom}
        gradientTo={palette?.gradientTo}
      >
        {inner}
      </RadialProgress>
      <Text
        variant="caption"
        color="muted"
        align="center"
        style={{ marginTop: spacing.sm, textTransform: "uppercase" }}
      >
        {intensity === "low"
          ? ""
          : intensity === "moderate"
            ? "● Bình thường"
            : intensity === "high"
              ? "● Sắp đạt mức"
              : "● Vượt mức"}
      </Text>
    </View>
  );
}
