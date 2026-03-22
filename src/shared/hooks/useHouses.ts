import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getFunctionalAreasByHouseId,
  getHouseIotAlerts,
  getHouses,
  getTenantHouses,
} from "../services/houseApi";

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
  functionalAreas: (houseId: string) =>
    ["houses", "functionalAreas", houseId] as const,
};

export const HOUSE_IOT_ALERTS_KEYS = {
  all: ["houseIotAlerts"] as const,
  infinite: (houseId: string, date: string) =>
    [...HOUSE_IOT_ALERTS_KEYS.all, houseId, date] as const,
};

export const useHouses = () => {
  return useQuery({
    // Cache key: mọi nơi dùng houses đều share chung "houses".
    queryKey: HOUSES_KEYS.all,
    // Hàm gọi API thật sự (GET /api/houses).
    queryFn: getHouses,
  });
};

/**
 * Hook lấy danh sách nhà gắn với user hiện tại (tenant).
 * - Dùng API mới GET /api/houses/house (BE đọc userId trong token để tìm houseId tương ứng).
 * - Áp dụng cho các màn hình Tenant (Home, chi tiết nhà tenant).
 */
export const useTenantHouses = () => {
  return useQuery({
    queryKey: HOUSES_KEYS.tenant,
    queryFn: getTenantHouses,
  });
};

/**
 * Khu vực chức năng theo houseId (GET /api/houses/functionalAreas/{houseId}).
 * Tenant dùng khi response nhà không nhúng đủ `functionalAreas`.
 */
export const useFunctionalAreasByHouseId = (houseId: string) => {
  return useQuery({
    queryKey: HOUSES_KEYS.functionalAreas(houseId),
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

