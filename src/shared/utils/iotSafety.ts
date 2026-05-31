import type {
  IotSafetyBandDto,
  IotSafetyConfigDto,
  IotSafetyScoreComponentDto,
  IotSafetyThresholdDto,
} from "../services/iotSafetyApi";

export type StatusKey = "GOOD" | "WARNING" | "CRITICAL" | "NO_DATA" | "OFFLINE";

export type MetricStatusResult = {
  status: StatusKey;
  threshold: IotSafetyThresholdDto | null;
};

export function findThreshold(
  config: IotSafetyConfigDto,
  metric: string,
): IotSafetyThresholdDto | null {
  return config.thresholds.find((t) => t.metric === metric) ?? null;
}

export function evaluateMetricStatus(
  value: number,
  threshold: IotSafetyThresholdDto | null,
): StatusKey {
  if (threshold == null || !Number.isFinite(value)) return "NO_DATA";

  if (threshold.criticalThreshold != null) {
    const isCritical = threshold.criticalIsHigh
      ? value >= threshold.criticalThreshold
      : value <= threshold.criticalThreshold;
    if (isCritical) return "CRITICAL";
  }

  if (threshold.comfortMin != null && threshold.comfortMax != null) {
    if (value >= threshold.comfortMin && value <= threshold.comfortMax) {
      return "GOOD";
    }
  } else if (threshold.comfortMax != null && value <= threshold.comfortMax) {
    return "GOOD";
  } else if (threshold.comfortMin != null && value >= threshold.comfortMin) {
    return "GOOD";
  }

  if (threshold.warningMin != null && threshold.warningMax != null) {
    if (value >= threshold.warningMin && value <= threshold.warningMax) {
      return "WARNING";
    }
  } else if (threshold.warningMax != null && value <= threshold.warningMax) {
    return "WARNING";
  } else if (threshold.warningMin != null && value >= threshold.warningMin) {
    return "WARNING";
  }

  return "CRITICAL";
}

function normalizeComponent(
  component: IotSafetyScoreComponentDto,
  value: number,
): number {
  if (!Number.isFinite(value)) return 0;
  switch (component.normalizationStrategy) {
    case "ratioToCritical": {
      const param = component.normalizationParam || 1;
      return Math.min(100, (value / param) * 100);
    }
    case "absDeviationFromCenter": {
      const center = component.normalizationParam;
      const deviation = Math.abs(value - center);
      return Math.min(100, deviation * 6);
    }
    default:
      return Math.min(100, Math.abs(value));
  }
}

export type SafetyEvaluation = {
  score: number;
  band: IotSafetyBandDto | null;
  perMetricStatus: Record<string, StatusKey>;
};

export function evaluateSafety(
  config: IotSafetyConfigDto,
  values: Record<string, number>,
): SafetyEvaluation {
  let weightedSum = 0;
  let weightTotal = 0;
  const perMetricStatus: Record<string, StatusKey> = {};

  for (const component of config.scoreComponents) {
    const value = values[component.metric];
    if (value == null || !Number.isFinite(value)) continue;
    const norm = normalizeComponent(component, value);
    weightedSum += norm * component.weight;
    weightTotal += component.weight;
  }

  for (const threshold of config.thresholds) {
    const value = values[threshold.metric];
    perMetricStatus[threshold.metric] = evaluateMetricStatus(value, threshold);
  }

  const score = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

  const sortedBands = [...config.bands].sort((a, b) => a.scoreMax - b.scoreMax);
  const band = sortedBands.find((b) => score < b.scoreMax) ?? sortedBands[sortedBands.length - 1] ?? null;

  return { score, band, perMetricStatus };
}

export function statusLabelFor(
  threshold: IotSafetyThresholdDto | null,
  status: StatusKey,
  fallbacks: { good: string; warning: string; critical: string; offline: string },
): string {
  if (threshold == null) return fallbacks.offline;
  switch (status) {
    case "GOOD":
      return fallbacks.good;
    case "WARNING":
      return fallbacks.warning;
    case "CRITICAL":
      return fallbacks.critical;
    default:
      return fallbacks.offline;
  }
}

export function thresholdRangeText(
  threshold: IotSafetyThresholdDto | null,
): string {
  if (threshold == null) return "";
  const parts: string[] = [];
  if (threshold.comfortMin != null && threshold.comfortMax != null) {
    parts.push(`Dải comfort: ${threshold.comfortMin}–${threshold.comfortMax} ${threshold.unit}`);
  } else if (threshold.comfortMax != null) {
    parts.push(`An toàn ≤ ${threshold.comfortMax} ${threshold.unit}`);
  }
  if (threshold.warningMin != null && threshold.warningMax != null) {
    parts.push(`Cảnh báo: ${threshold.warningMin}–${threshold.warningMax}`);
  }
  if (threshold.criticalThreshold != null) {
    parts.push(
      `Nguy hiểm ${threshold.criticalIsHigh ? ">" : "<"} ${threshold.criticalThreshold}`,
    );
  }
  return parts.join(" · ");
}

export const FALLBACK_SAFETY_CONFIG: IotSafetyConfigDto = {
  activeSensors: [
    {
      code: "MQ2",
      displayName: "MQ-2 — Cảm biến gas dễ cháy + khói (offline)",
      model: "MQ-2",
      measures: ["gas_ppm", "smoke"],
      accuracyNotes:
        "Cross-sensitive: phát hiện LPG/methane/propane/khói nhưng không phân biệt được loại gas.",
      calibrationStatus: "factory_default",
      datasheet: null,
    },
    {
      code: "DHT22",
      displayName: "DHT22 — Cảm biến nhiệt độ và độ ẩm (offline)",
      model: "DHT22",
      measures: ["temp_c", "humidity_pct"],
      accuracyNotes: "Sai số ±0.5°C, ±2% RH.",
      calibrationStatus: "factory_default",
      datasheet: null,
    },
  ],
  capabilityGaps: [
    {
      metric: "pm25",
      displayName: "PM2.5",
      description: "Bụi mịn dưới 2.5μm — chỉ số chính của AQI",
      requiredSensor: "PMS5003 hoặc tương đương",
      sensorPriceVndApprox: 700000,
      standardRef: "QCVN 05:2023/BTNMT",
    },
    {
      metric: "co",
      displayName: "CO",
      description: "Carbon monoxide — khí độc",
      requiredSensor: "MQ-7 hoặc MH-Z19B",
      sensorPriceVndApprox: 400000,
      standardRef: "QCVN 05:2023/BTNMT",
    },
  ],
  thresholds: [
    {
      metric: "gas_ppm",
      displayName: "Khí gas dễ cháy",
      unit: "ppm",
      comfortMin: 0,
      comfortMax: 50,
      warningMin: 50,
      warningMax: 150,
      criticalThreshold: 200,
      criticalIsHigh: true,
      standardRef: "OSHA Combustible Gas LEL",
    },
    {
      metric: "temp_c",
      displayName: "Nhiệt độ",
      unit: "°C",
      comfortMin: 22,
      comfortMax: 28,
      warningMin: 18,
      warningMax: 32,
      criticalThreshold: null,
      criticalIsHigh: null,
      standardRef: "ASHRAE Standard 55-2020",
    },
    {
      metric: "humidity_pct",
      displayName: "Độ ẩm",
      unit: "%",
      comfortMin: 40,
      comfortMax: 70,
      warningMin: 30,
      warningMax: 80,
      criticalThreshold: null,
      criticalIsHigh: null,
      standardRef: "EPA IAQ Guidelines",
    },
  ],
  scoreComponents: [
    { metric: "gas_ppm", weight: 0.5, normalizationStrategy: "ratioToCritical", normalizationParam: 300 },
    { metric: "temp_c", weight: 0.25, normalizationStrategy: "absDeviationFromCenter", normalizationParam: 25 },
    { metric: "humidity_pct", weight: 0.25, normalizationStrategy: "absDeviationFromCenter", normalizationParam: 55 },
  ],
  bands: [
    { code: "SAFE", label: "An toàn", description: "Không phát hiện rò rỉ gas, nhiệt độ và độ ẩm dễ chịu", scoreMax: 30, severity: "GOOD" },
    { code: "CAUTION", label: "Cần chú ý", description: "Một số chỉ số ngoài dải khuyến nghị", scoreMax: 60, severity: "WARNING" },
    { code: "POOR", label: "Bất ổn", description: "Nên thông gió, kiểm tra bếp gas và điều hòa", scoreMax: 85, severity: "WARNING" },
    { code: "DANGER", label: "Nguy hiểm", description: "Khả năng cao có rò rỉ gas — mở cửa thông gió", scoreMax: 100, severity: "CRITICAL" },
  ],
  disclaimer:
    "Chỉ số an toàn ở đây là composite weighted score từ MQ-2 + DHT22. KHÔNG phải AQI theo QCVN 05:2023/BTNMT. Đang dùng cấu hình offline.",
  scoreFormulaDescription:
    "Weighted average của các chỉ số đã chuẩn hóa về 0-100 theo cấu hình.",
  standardsApplied:
    "ASHRAE 55-2020 · EPA IAQ Guidelines · OSHA LEL · QCVN 05:2023/BTNMT (reference)",
  version: "iot-safety-fallback",
  effectiveFrom: "2026-05-07",
  notes: "Fallback: không có kết nối BE.",
};

export function bgGradientForBand(band: IotSafetyBandDto | null): { from: string; to: string } {
  if (!band) return { from: "#94A3B8", to: "#64748B" };
  switch (band.severity) {
    case "GOOD":
      return { from: "#10B981", to: "#059669" };
    case "WARNING":
      if (band.code === "POOR") return { from: "#F97316", to: "#EA580C" };
      return { from: "#F59E0B", to: "#D97706" };
    case "CRITICAL":
      return { from: "#DC2626", to: "#991B1B" };
    default:
      return { from: "#94A3B8", to: "#64748B" };
  }
}
