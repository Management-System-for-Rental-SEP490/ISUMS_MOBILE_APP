import { useCallback, useEffect, useMemo, useState } from "react";
import { iotClient } from "../services/iotClient";

function getCurrentMonth(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export interface DistributionItem {
  areaId: string;
  areaName: string;
  value: number;
}

export interface UseAreasUsageDistributionOptions {
  houseId: string | null;
  metric: "electricity" | "water";
  areas: Array<{
    id: string;
    name: string;
  }>;
}

export interface UseAreasUsageDistributionResult {
  items: DistributionItem[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useAreasUsageDistribution(
  options: UseAreasUsageDistributionOptions
): UseAreasUsageDistributionResult {
  const { houseId, metric, areas } = options;

  const [items, setItems] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDistribution = useCallback(async () => {
    if (!houseId || !areas.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const month = getCurrentMonth();

      const results = await Promise.all(
        areas.map(async (area) => {
          const pk = `${houseId}#${area.id}#${metric}`;
          const usage = await iotClient.getUsage(pk, "month", month);

          return {
            areaId: area.id,
            areaName: area.name,
            value: usage?.value ?? 0,
          };
        })
      );

      setItems(results);
    } finally {
      setLoading(false);
    }
  }, [houseId, metric, areas]);

  useEffect(() => {
    fetchDistribution();
  }, [fetchDistribution]);

  return {
    items,
    loading,
    refetch: fetchDistribution,
  };
}