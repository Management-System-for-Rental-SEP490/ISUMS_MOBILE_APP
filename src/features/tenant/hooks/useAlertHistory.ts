// src/features/tenant/hooks/useAlertHistory.ts
// Fetch alert history từ API với pagination + filter

import { useState, useEffect, useCallback, useRef } from "react";
import { IAlert, AlertLevel, AlertMetric } from "../../../types/alert";
import alertApi from "../../../shared/services/alertApi";

interface FilterOptions {
  level?:    AlertLevel;
  metric?:   AlertMetric;
  resolved?: boolean;
  from?:     number;
  to?:       number;
}

interface UseAlertHistoryReturn {
  alerts:      IAlert[];
  loading:     boolean;
  loadingMore: boolean;
  error:       string | null;
  hasMore:     boolean;
  total:       number;
  filters:     FilterOptions;
  setFilters:  (f: FilterOptions) => void;
  refresh:     () => void;
  loadMore:    () => void;
  resolve:     (alertId: string) => Promise<void>;
  resolveAll:  () => Promise<void>;
}

export function useAlertHistory(houseId: string): UseAlertHistoryReturn {
  const [alerts, setAlerts]         = useState<IAlert[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loadingMore, setLoadMore]  = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [filters, setFiltersState]  = useState<FilterOptions>({});
  const abortRef                    = useRef<AbortController | null>(null);

  const fetchAlerts = useCallback(
    async (pg: number, replace: boolean) => {
      if (!houseId) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      if (replace) setLoading(true);
      else         setLoadMore(true);
      setError(null);

      try {
        const res = await alertApi.getAlerts({
          houseId,
          page:     pg,
          size:     20,
          ...filters,
        });

        setAlerts((prev) =>
          replace ? res.content : [...prev, ...res.content]
        );
        setTotal(res.totalElements);
        setHasMore(pg < res.totalPages - 1);
        setPage(pg);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError("Không thể tải lịch sử cảnh báo");
          console.error("[useAlertHistory]", err);
        }
      } finally {
        setLoading(false);
        setLoadMore(false);
      }
    },
    [houseId, filters]
  );

  // Fetch khi mount hoặc filter thay đổi
  useEffect(() => {
    fetchAlerts(0, true);
  }, [fetchAlerts]);

  const refresh  = useCallback(() => fetchAlerts(0, true), [fetchAlerts]);
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchAlerts(page + 1, false);
  }, [loadingMore, hasMore, page, fetchAlerts]);

  const setFilters = useCallback((f: FilterOptions) => {
    setFiltersState(f);
    setPage(0);
  }, []);

  // Resolve single
  const resolve = useCallback(
    async (alertId: string) => {
      try {
        const updated = await alertApi.resolveAlert(houseId, alertId);
        setAlerts((prev) =>
          prev.map((a) => (a.alertId === alertId ? updated : a))
        );
      } catch (err) {
        console.error("[useAlertHistory] resolve", err);
        throw err;
      }
    },
    [houseId]
  );

  // Resolve all
  const resolveAll = useCallback(async () => {
    try {
      await alertApi.resolveAll(houseId);
      await fetchAlerts(0, true);
    } catch (err) {
      console.error("[useAlertHistory] resolveAll", err);
      throw err;
    }
  }, [houseId, fetchAlerts]);

  return {
    alerts,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    filters,
    setFilters,
    refresh,
    loadMore,
    resolve,
    resolveAll,
  };
}