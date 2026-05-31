import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE } from "../api/config";

export type IotSafetySensorDto = {
  code: string;
  displayName: string;
  model: string;
  measures: string[];
  accuracyNotes: string;
  calibrationStatus: string;
  datasheet: string | null;
};

export type IotSafetyCapabilityGapDto = {
  metric: string;
  displayName: string;
  description: string;
  requiredSensor: string;
  sensorPriceVndApprox: number | null;
  standardRef: string;
};

export type IotSafetyThresholdDto = {
  metric: string;
  displayName: string;
  unit: string;
  comfortMin: number | null;
  comfortMax: number | null;
  warningMin: number | null;
  warningMax: number | null;
  criticalThreshold: number | null;
  criticalIsHigh: boolean | null;
  standardRef: string;
};

export type IotSafetyScoreComponentDto = {
  metric: string;
  weight: number;
  normalizationStrategy: "ratioToCritical" | "absDeviationFromCenter" | string;
  normalizationParam: number;
};

export type IotSafetyBandDto = {
  code: string;
  label: string;
  description: string;
  scoreMax: number;
  severity: "GOOD" | "WARNING" | "CRITICAL" | string;
};

export type IotSafetyConfigDto = {
  activeSensors: IotSafetySensorDto[];
  capabilityGaps: IotSafetyCapabilityGapDto[];
  thresholds: IotSafetyThresholdDto[];
  scoreComponents: IotSafetyScoreComponentDto[];
  bands: IotSafetyBandDto[];
  disclaimer: string;
  scoreFormulaDescription: string;
  standardsApplied: string;
  version: string;
  effectiveFrom: string;
  notes: string | null;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
  statusCode?: number;
};

export async function fetchIotSafetyConfig(): Promise<IotSafetyConfigDto> {
  const res = await axiosClient.get<ApiResponse<IotSafetyConfigDto>>(
    `${ASSETS_API_BASE}/assets/iot/safety-config`,
  );
  return res.data.data;
}
