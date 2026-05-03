/**
 * Hook điều khiển điện cấp nhà ("công tắc tổng"): fetch trạng thái từng area song song,
 * derive isAnyOn, và cung cấp `toggleAll(action)` gọi API per-area bằng Promise.allSettled.
 *
 * Vì BE hiện chỉ có endpoint per-area (PUT /houses/{id}/areas/{areaId}/iot/power), FE phải
 * fan-out N request. Partial failure được trả về cho UI hiển thị — không rollback
 * (mỗi area độc lập, user quyết định retry).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import iotCommandApi, {
  type AreaPowerStateResponse,
  type PowerAction,
} from "../../../shared/services/iotCommandApi";

export interface HouseMasterPowerArea {
  id: string;
  name?: string;
}

export interface HouseMasterToggleResult {
  /** areaId → state sau toggle. Không có entry nếu area đó fail. */
  succeeded: Record<string, AreaPowerStateResponse>;
  /** areaId → message lỗi. */
  failed: Record<string, string>;
}

export interface HouseMasterPowerState {
  /** areaId → state mới nhất (null khi chưa fetch xong hoặc fetch fail). */
  states: Record<string, AreaPowerStateResponse | null>;
  /** true khi ít nhất 1 area đang ON. */
  isAnyOn: boolean;
  /** true khi tất cả area đều OFF (và đã fetch thành công ít nhất 1 area). */
  isAllOff: boolean;
  /** true khi đang fetch trạng thái ban đầu. */
  loading: boolean;
  /** true khi đang thực thi toggleAll. */
  toggling: boolean;
  /** Thông báo lỗi fetch (không phải lỗi toggle). */
  error: string | null;
  /** Refetch trạng thái tất cả area. */
  refetch: () => Promise<void>;
  /** Toggle đồng loạt. Trả về summary { succeeded, failed } để UI hiển thị. */
  toggleAll: (action: PowerAction) => Promise<HouseMasterToggleResult>;
}

/** Lấy message lỗi user-friendly từ AxiosError hoặc Error chung. */
function extractErrorMessage(e: unknown, fallback: string): string {
  const err = e as {
    response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
    message?: string;
  };
  return (
    err?.response?.data?.message ??
    err?.response?.data?.errors?.[0]?.message ??
    err?.message ??
    fallback
  );
}

export function useHouseMasterPower(params: {
  houseId: string | null;
  areas: HouseMasterPowerArea[];
}): HouseMasterPowerState {
  const { houseId, areas } = params;
  // Memoize areaIds to a stable string — prevents re-fetch khi cha re-render tạo array mới cùng nội dung.
  const areaIdsKey = areas.map((a) => a.id).sort().join(",");
  const [states, setStates] = useState<Record<string, AreaPowerStateResponse | null>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [toggling, setToggling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  /** Chống race: mỗi lần load bump gen; kết quả đến sau bị ignore nếu gen khác. */
  const loadGenRef = useRef(0);

  const refetch = useCallback(async (): Promise<void> => {
    if (!houseId || areas.length === 0) {
      setStates({});
      setLoading(false);
      setError(null);
      return;
    }
    const gen = ++loadGenRef.current;
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled(
      areas.map((a) => iotCommandApi.getAreaPowerState(houseId, a.id))
    );
    if (gen !== loadGenRef.current) return;
    const next: Record<string, AreaPowerStateResponse | null> = {};
    let anyErr: string | null = null;
    results.forEach((r, i) => {
      const id = areas[i].id;
      if (r.status === "fulfilled") {
        next[id] = r.value;
      } else {
        next[id] = null;
        if (!anyErr) anyErr = extractErrorMessage(r.reason, "fetch_power_failed");
      }
    });
    setStates(next);
    setError(anyErr);
    setLoading(false);
  }, [houseId, areaIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const toggleAll = useCallback(
    async (action: PowerAction): Promise<HouseMasterToggleResult> => {
      if (!houseId || areas.length === 0) {
        return { succeeded: {}, failed: {} };
      }
      setToggling(true);
      try {
        const results = await Promise.allSettled(
          areas.map((a) => iotCommandApi.toggleAreaPower(houseId, a.id, action))
        );
        const succeeded: Record<string, AreaPowerStateResponse> = {};
        const failed: Record<string, string> = {};
        results.forEach((r, i) => {
          const id = areas[i].id;
          if (r.status === "fulfilled") {
            succeeded[id] = r.value;
          } else {
            failed[id] = extractErrorMessage(r.reason, "toggle_failed");
          }
        });
        // Cập nhật state từ kết quả thành công (optimistic: area fail giữ state cũ).
        setStates((prev) => ({ ...prev, ...succeeded }));
        return { succeeded, failed };
      } finally {
        setToggling(false);
      }
    },
    [houseId, areaIdsKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const stateValues = Object.values(states);
  const isAnyOn = stateValues.some((s) => s != null && s.powered === true);
  const isAllOff =
    stateValues.length > 0 && stateValues.every((s) => s != null && s.powered === false);

  return { states, isAnyOn, isAllOff, loading, toggling, error, refetch, toggleAll };
}
