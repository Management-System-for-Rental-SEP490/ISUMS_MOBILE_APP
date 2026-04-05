import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE } from "../api/config";

export interface ThresholdItem {
  metric: string;
  maxVal?: number | null;
  minVal?: number | null;
  severity: "CRITICAL" | "WARNING" | "INFO";
  enabled: boolean;
}

export interface UpdateThresholdPayload {
  maxVal?: number | null;
  minVal?: number | null;
  severity?: string;
  enabled?: boolean;
}

// ── House-level
export async function getHouseThresholds(houseId: string): Promise<ThresholdItem[]> {
  const res = await axiosClient.get(
    `${ASSETS_API_BASE}/api/assets/houses/${houseId}/iot/thresholds`
  );
  return res.data?.data ?? [];
}

export async function updateHouseThreshold(
  houseId: string,
  metric: string,
  payload: UpdateThresholdPayload
): Promise<void> {
  await axiosClient.put(
    `${ASSETS_API_BASE}/api/assets/houses/${houseId}/iot/thresholds/${metric}`,
    { minVal: payload.minVal, maxVal: payload.maxVal,
      severity: payload.severity ?? "WARNING", enabled: payload.enabled ?? true }
  );
}

// ── Area-level
export async function getAreaThresholds(
  houseId: string, areaId: string
): Promise<ThresholdItem[]> {
  const res = await axiosClient.get(
    `${ASSETS_API_BASE}/api/assets/houses/${houseId}/areas/${areaId}/iot/thresholds`
  );
  return res.data?.data ?? [];
}

export async function updateAreaThreshold(
  houseId: string,
  areaId: string,
  metric: string,
  payload: UpdateThresholdPayload
): Promise<void> {
  await axiosClient.put(
    `${ASSETS_API_BASE}/api/assets/houses/${houseId}/areas/${areaId}/iot/thresholds/${metric}`,
    { minVal: payload.minVal, maxVal: payload.maxVal,
      severity: payload.severity ?? "WARNING", enabled: payload.enabled ?? true }
  );
}