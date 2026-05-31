import type { ThemeColors } from "../../design/palette";

export type IntensityLevel = "low" | "moderate" | "high" | "critical";

export function intensityFromRatio(ratio: number): IntensityLevel {
  if (!Number.isFinite(ratio) || ratio <= 0) return "low";
  if (ratio < 0.5) return "low";
  if (ratio < 0.75) return "moderate";
  if (ratio < 0.95) return "high";
  return "critical";
}

export function intensityColor(
  colors: ThemeColors,
  ratio: number,
): string {
  return colors.intensity[intensityFromRatio(ratio)];
}
