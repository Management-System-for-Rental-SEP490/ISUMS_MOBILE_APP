/**
 * Forecast Prophet AI của Asset-Service.
 * BE: /api/assets/houses/{houseId}/iot/forecast(/{metric}) — TENANT/LANDLORD/MANAGER đều GET được.
 * Mobile đi qua axiosClient (Bearer token) + ASSETS_API_BASE (không gọi AWS DynamoDB trực tiếp).
 */
import { isAxiosError } from "axios";
import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE } from "../api/config";
import type {
  ForecastAllApiResponse,
  ForecastAllDto,
  ForecastScopeApiResponse,
  ForecastScopeDto,
} from "../types/api";

export type ForecastMetric = "electricity" | "water";

/** 404 khi scope chưa có dự báo (BE chưa trigger, house mới, hoặc areaId không có node). */
function isForecastNotFound(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 404;
}

/**
 * GET /iot/forecast/{metric}?areaId=&month=
 * Trả null khi BE 404 (chưa có forecast) để UI hiển thị empty state thay vì throw.
 * Các lỗi khác (401/500/timeout…) vẫn throw — để axiosClient fallback/refresh token chạy.
 */
export const getMetricForecast = async (
  houseId: string,
  metric: ForecastMetric,
  areaId?: string | null,
  month?: string | null
): Promise<ForecastScopeDto | null> => {
  const sp = new URLSearchParams();
  if (areaId) sp.set("areaId", areaId);
  if (month) sp.set("month", month);
  const qs = sp.toString();
  const url =
    `${ASSETS_API_BASE}/assets/houses/${encodeURIComponent(houseId)}` +
    `/iot/forecast/${encodeURIComponent(metric)}` +
    (qs ? `?${qs}` : "");
  try {
    const response = await axiosClient.get<ForecastScopeApiResponse>(url);
    return response.data.data ?? null;
  } catch (err) {
    if (isForecastNotFound(err)) return null;
    throw err;
  }
};

/**
 * GET /iot/forecast?month= — 1 lần lấy cả electricity + water + mọi area.
 * Dùng cho màn tổng quan; 2 màn Electric/Water hiện đang gọi theo metric + area riêng lẻ.
 */
export const getHouseForecast = async (
  houseId: string,
  month?: string | null
): Promise<ForecastAllDto | null> => {
  const sp = new URLSearchParams();
  if (month) sp.set("month", month);
  const qs = sp.toString();
  const url =
    `${ASSETS_API_BASE}/assets/houses/${encodeURIComponent(houseId)}` +
    `/iot/forecast` +
    (qs ? `?${qs}` : "");
  try {
    const response = await axiosClient.get<ForecastAllApiResponse>(url);
    return response.data.data ?? null;
  } catch (err) {
    if (isForecastNotFound(err)) return null;
    throw err;
  }
};

const iotForecastApi = { getMetricForecast, getHouseForecast };
export default iotForecastApi;
