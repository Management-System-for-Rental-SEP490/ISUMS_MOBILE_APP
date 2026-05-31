import { useMemo } from "react";
import {
  spacing,
  type SpacingToken,
  fontScale,
} from "../design/tokens";
import { usePreferencesStore } from "../../store/usePreferencesStore";

export type DensityHelpers = {
  density: "comfortable" | "compact";
  factor: number;
  scale: (token: SpacingToken) => number;
  pad: (token: SpacingToken) => number;
  gap: (token: SpacingToken) => number;
};

export function useDensity(): DensityHelpers {
  const density = usePreferencesStore((s) => s.density);

  return useMemo(() => {
    const factor = density === "compact" ? 0.8 : 1;
    const scale = (token: SpacingToken) => Math.round(spacing[token] * factor);
    return {
      density,
      factor,
      scale,
      pad: scale,
      gap: scale,
    };
  }, [density]);
}

export function getEffectiveFontFactor(scaleKey: keyof typeof fontScale): number {
  return fontScale[scaleKey];
}
