/**
 * Hook lấy dự báo Prophet cho 1 scope (nhà hoặc 1 khu vực) của 1 metric.
 * Theo pattern `useTenantUsage`: gen-counter chống stale, tự refetch khi deps đổi,
 * không throw lên UI khi BE trả 404/ForecastNotFound → `data = null`, empty state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import iotForecastApi, { type ForecastMetric } from "../../../shared/services/iotForecastApi";
import type { ForecastScopeDto } from "../../../shared/types/api";

export interface TenantForecastState {
  data: ForecastScopeDto | null;
  loading: boolean;
  /** null khi không có lỗi hoặc khi chỉ là "chưa có forecast" (BE 404). */
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTenantForecast(params: {
  houseId: string | null;
  metric: ForecastMetric;
  areaId?: string | null;
  /** "YYYY-MM" — mặc định BE dùng tháng hiện tại của VN timezone. */
  month?: string | null;
}): TenantForecastState {
  const { houseId, metric, areaId, month } = params;
  const [data, setData] = useState<ForecastScopeDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);

  const load = useCallback(async () => {
    if (!houseId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await iotForecastApi.getMetricForecast(
        houseId,
        metric,
        areaId ?? null,
        month ?? null
      );
      if (gen !== genRef.current) return;
      setData(result);
    } catch (e: unknown) {
      if (gen !== genRef.current) return;
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "forecast_error");
      setData(null);
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [houseId, metric, areaId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
