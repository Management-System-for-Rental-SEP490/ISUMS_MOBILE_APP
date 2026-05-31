import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toAppLocaleCode } from "../utils/resolveLocalizedJsonString";
import {
  getFunctionalAreasByHouseId,
  getHouseById,
  getHouseIotAlerts,
  getHouses,
  getTenantHouses,
} from "../services/houseApi";
import { QUERY_DEFAULT_STALE_TIME_MS } from "../api/config";

/**
 * Hook dùng React Query để lấy danh sách nhà (houses) từ BE.
 *
 * - Đóng gói lại `useQuery` + `getHouses` vào một chỗ.
 * - Màn hình chỉ cần gọi `useHouses()` là có `data`, `isLoading`, `isError`, `refetch`.
 */
export const HOUSES_KEYS = {
  /** Key gốc cho toàn bộ queries về houses. */
  all: ["houses"] as const,
  /** Key cho danh sách nhà của tenant hiện tại. */
  tenant: ["houses", "tenant"] as const,
  /** Chi tiết một nhà (GET /houses/{id}). */
  byId: (houseId: string) => ["houses", "byId", houseId] as const,
  functionalAreas: (houseId: string) =>
    ["houses", "functionalAreas", houseId] as const,
};

export const HOUSE_IOT_ALERTS_KEYS = {
  all: ["houseIotAlerts"] as const,
  infinite: (houseId: string, date: string) =>
    [...HOUSE_IOT_ALERTS_KEYS.all, houseId, date] as const,
};

export const useHouses = () => {
  const { i18n } = useTranslation();
  const locale = toAppLocaleCode(i18n.language);
  return useQuery({
    // Cache key: mọi nơi dùng houses đều share chung "houses".
    queryKey: [...HOUSES_KEYS.all, locale],
    // Hàm gọi API thật sự (GET /api/houses).
    queryFn: getHouses,
  });
};

/**
 * Hook lấy danh sách nhà + quyền truy cập của tenant (GET /api/houses/my-access).
 */
export const useTenantHouses = () => {
  const { i18n } = useTranslation();
  const locale = toAppLocaleCode(i18n.language);
  return useQuery({
    queryKey: [...HOUSES_KEYS.tenant, locale],
    queryFn: getTenantHouses,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

/**
 * GET /houses/{id} — bật khi cần (vd. căn không còn trong my-access).
 */
export const useHouseById = (houseId: string | null | undefined, enabled: boolean) => {
  const { i18n } = useTranslation();
  const locale = toAppLocaleCode(i18n.language);
  const id = String(houseId ?? "").trim();
  return useQuery({
    queryKey: [...HOUSES_KEYS.byId(id), locale],
    queryFn: () => getHouseById(id),
    enabled: Boolean(id && enabled),
    staleTime: QUERY_DEFAULT_STALE_TIME_MS,
  });
};

/**
 * Nhiều GET /houses/{id} song song — map id → tên (chỉ khi success).
 */
export const useHouseNamesByIds = (houseIds: string[]) => {
  const { i18n } = useTranslation();
  const locale = toAppLocaleCode(i18n.language);
  const idsKey = houseIds.join("\u0001");
  const sortedIds = useMemo(
    () =>
      [...new Set(houseIds.map((x) => String(x ?? "").trim()).filter((x) => x.length > 0))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [idsKey]
  );

  const queries = useQueries({
    queries: sortedIds.map((id) => ({
      queryKey: [...HOUSES_KEYS.byId(id), locale],
      queryFn: () => getHouseById(id),
      enabled: Boolean(id),
      staleTime: QUERY_DEFAULT_STALE_TIME_MS,
    })),
  });

  const nameKey = queries
    .map((q) => {
      const d = q.data;
      if (!d?.success || !d.data) return "";
      return String(d.data.name ?? "").trim();
    })
    .join("\u0001");

  const namesById = useMemo(() => {
    const m = new Map<string, string>();
    sortedIds.forEach((id, i) => {
      const d = queries[i]?.data;
      if (!d?.success || !d.data) return;
      const n = String(d.data.name ?? "").trim();
      if (n) m.set(id, n);
    });
    return m;
  }, [sortedIds, nameKey]);

  const pendingKey = queries.map((q) => (q.isPending ? "1" : "0")).join("");
  const pendingHouseIds = useMemo(() => {
    const s = new Set<string>();
    sortedIds.forEach((id, i) => {
      if (queries[i]?.isPending) s.add(id);
    });
    return s;
  }, [sortedIds, pendingKey]);

  return { namesById, pendingHouseIds };
};

/**
 * Khu vực chức năng theo houseId (GET /api/houses/functionalAreas/{houseId}).
 * Tenant dùng khi response nhà không nhúng đủ `functionalAreas`.
 */
export const useFunctionalAreasByHouseId = (houseId: string) => {
  const { i18n } = useTranslation();
  const locale = toAppLocaleCode(i18n.language);
  return useQuery({
    queryKey: [...HOUSES_KEYS.functionalAreas(houseId), locale],
    queryFn: () => getFunctionalAreasByHouseId(houseId),
    enabled: Boolean(houseId),
  });
};

/**
 * Cảnh báo IoT theo nhà + ngày, phân trang vô hạn theo cursor (React Query).
 * Logic gọi API nằm trong `getHouseIotAlerts` — màn hình chỉ consume hook.
 */
export const useTenantHouseIotAlertsInfinite = (
  houseId: string | null | undefined,
  selectedDate: string,
  pageSize: number
) => {
  const hid = houseId ?? "";
  return useInfiniteQuery({
    queryKey: HOUSE_IOT_ALERTS_KEYS.infinite(hid, selectedDate),
    queryFn: ({ pageParam }) =>
      getHouseIotAlerts(hid, {
        limit: pageSize,
        date: selectedDate,
        cursor:
          typeof pageParam === "string" && pageParam.length > 0
            ? pageParam
            : undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      const d = lastPage?.data;
      if (!d?.hasMore) return undefined;
      const next = d.nextCursor ?? d.cursor ?? null;
      if (!next) return undefined;
      return next;
    },
    enabled: Boolean(hid && selectedDate),
  });
};

