import { useCallback, useEffect, useState } from "react";
import {
  getHouseThresholds, updateHouseThreshold,
  getAreaThresholds, updateAreaThreshold,
  type ThresholdItem, type UpdateThresholdPayload,
} from "../../../shared/services/iotThresholdApi";

export function useThresholds(houseId: string | null, areaId?: string | null) {
  const [thresholds, setThresholds] = useState<ThresholdItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchThresholds = useCallback(async () => {
    if (!houseId) { setThresholds([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = areaId
        ? await getAreaThresholds(houseId, areaId)
        : await getHouseThresholds(houseId);
      setThresholds(data);
    } catch (e: any) {
      setError(e?.message ?? "Lỗi tải ngưỡng");
    } finally {
      setLoading(false);
    }
  }, [houseId, areaId]);

  const update = useCallback(async (metric: string, payload: UpdateThresholdPayload) => {
    if (!houseId) return;
    setSaving(true);
    setError(null);
    try {
      if (areaId) {
        await updateAreaThreshold(houseId, areaId, metric, payload);
      } else {
        await updateHouseThreshold(houseId, metric, payload);
      }
      setThresholds(prev =>
        prev.map(t => t.metric === metric ? { ...t, ...payload } : t)
      );
    } catch (e: any) {
      setError(e?.message ?? "Lỗi cập nhật ngưỡng");
      await fetchThresholds();
    } finally {
      setSaving(false);
    }
  }, [houseId, areaId, fetchThresholds]);

  useEffect(() => { fetchThresholds(); }, [fetchThresholds]);

  return { thresholds, loading, saving, error, update, refetch: fetchThresholds };
}