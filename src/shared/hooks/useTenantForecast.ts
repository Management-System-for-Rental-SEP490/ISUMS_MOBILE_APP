import { useCallback, useEffect, useState } from "react";
import {
  getIotForecast,
  type ForecastScopeDto,
} from "../services/iotForecastApi";

export interface UseTenantForecastOptions {
  houseId: string | null;
  metric: "electricity" | "water";
  areaId?: string | null;
  month?: string;
}

export interface UseTenantForecastResult {
  data: ForecastScopeDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTenantForecast(
  options: UseTenantForecastOptions
): UseTenantForecastResult {
  const { houseId, metric, areaId, month } = options;

  const [data, setData] = useState<ForecastScopeDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    if (!houseId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dto = await getIotForecast({
        houseId,
        metric,
        areaId,
        month,
      });
      setData(dto);
    } catch (err: any) {
      setData(null);
      setError(err?.message ?? "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }, [houseId, metric, areaId, month]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return {
    data,
    loading,
    error,
    refetch: fetchForecast,
  };
}