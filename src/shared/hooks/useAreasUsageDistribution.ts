/**
 * Tổng tiêu thụ tháng hiện tại theo từng khu vực (REST song song).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { APP_FOREGROUND_GET_POLL_MS } from "../api/config";
import { iotClient } from "../services/iotClient";

interface AreaInput {
  id: string;
  name: string;
}

export interface DistributionItem {
  areaId: string;
  areaName: string;
  value: number;
}

interface UseAreasUsageDistributionParams {
  houseId: string | null;
  metric: "electricity" | "water";
  areas: AreaInput[];
}

interface UseAreasUsageDistributionResult {
  items: DistributionItem[];
  loading: boolean;
  refetch: () => void;
}

async function fetchAreaUsage(
  houseId: string,
  areaId: string,
  metric: "electricity" | "water",
  bucket: string
): Promise<number> {
  const pk = `${houseId}#${areaId}#${metric}`;
  const data = await iotClient.getUsage(pk, "month", bucket);
  return typeof data?.value === "number" ? data.value : 0;
}

function currentMonthBucket(): string {
  return new Date().toISOString().slice(0, 7);
}

export function useAreasUsageDistribution({
  houseId,
  metric,
  areas,
}: UseAreasUsageDistributionParams): UseAreasUsageDistributionResult {
  const [items, setItems] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const areasKey = useMemo(
    () => areas.map((a) => `${a.id}:${a.name}`).join("|"),
    [areas]
  );

  const load = useCallback(async () => {
    if (!houseId || !areas.length) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const bucket = currentMonthBucket();
      const results = await Promise.all(
        areas.map(async (area) => ({
          areaId: area.id,
          areaName: area.name,
          value: await fetchAreaUsage(houseId, area.id, metric, bucket),
        }))
      );
      setItems(results.filter((r) => r.value > 0));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [houseId, metric, areasKey]);

  useEffect(() => {
    void load();
    if (!houseId || !areas.length) return;
    const interval = setInterval(() => void load(), APP_FOREGROUND_GET_POLL_MS);
    return () => clearInterval(interval);
  }, [houseId, areas.length, load]);

  return { items, loading, refetch: load };
}
