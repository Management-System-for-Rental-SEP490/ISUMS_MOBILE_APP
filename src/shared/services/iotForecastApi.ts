import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE } from "../api/config";

export interface ForecastDailyPoint {
  ds: string;
  yhat: number;
  lower: number;
  upper: number;
}

export interface ForecastScopeDto {
  metric: string;
  unit: string;
  scope: "house" | "area";
  areaId?: string | null;
  areaName?: string | null;
  usedSoFar: number;
  forecastRemaining: number;
  totalEstimate: number;
  confidenceLower: number;
  confidenceUpper: number;
  daysLeft: number;
  trend?: string | null;
  trainingRows: number;
  dailyForecast: ForecastDailyPoint[];
  forecastedAt: number;
  status?: "ESTIMATE" | "MODEL_FORECAST";
  reason?: string;
  method?: string;
}

export interface ForecastMetricDto {
  house: ForecastScopeDto | null;
  areas?: Record<string, ForecastScopeDto> | null;
}

export interface ForecastAllDto {
  houseId: string;
  month: string;
  electricity: ForecastMetricDto | null;
  water: ForecastMetricDto | null;
}

interface ApiResponse<T> {
  status?: number;
  message?: string;
  data: T;
}

function buildQuery(params: Record<string, string | null | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") {
      qs.append(key, value);
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export async function getIotForecast(params: {
  houseId: string;
  metric: "electricity" | "water";
  areaId?: string | null;
  month?: string;
}): Promise<ForecastScopeDto | null> {
  const { houseId, metric, areaId, month } = params;

  const query = buildQuery({
    areaId: areaId ?? undefined,
    month: month ?? undefined,
  });

  const url = `${ASSETS_API_BASE}/assets/houses/${houseId}/iot/forecast/${metric}${query}`;
  const res = await axiosClient.get<ApiResponse<ForecastScopeDto | null>>(url);
  return res.data?.data ?? null;
}

export async function getIotForecastAll(params: {
  houseId: string;
  month?: string;
}): Promise<ForecastAllDto | null> {
  const { houseId, month } = params;

  const query = buildQuery({
    month: month ?? undefined,
  });

  const url = `${ASSETS_API_BASE}/assets/houses/${houseId}/iot/forecast${query}`;
  const res = await axiosClient.get<ApiResponse<ForecastAllDto | null>>(url);
  return res.data?.data ?? null;
}

export async function triggerIotForecast(houseId: string): Promise<void> {
  const url = `${ASSETS_API_BASE}/assets/houses/${houseId}/iot/forecast/trigger`;
  await axiosClient.post(url);
}