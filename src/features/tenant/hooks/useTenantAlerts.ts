/**
 * REST danh sách cảnh báo + WebSocket topic alert/{houseId}.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { iotClient } from "../../../shared/services/iotClient";
import alertApi from "../../../shared/services/alertApi";
import { playAlertSound } from "../../../shared/services/alertSound";
import type { IAlert } from "../../../shared/types/alert";
import type { AlertWsMessage, WsAlertItem } from "../../../shared/types/iot";

function wsItemToIAlert(item: WsAlertItem): IAlert {
  return {
    alertId: item.alertId,
    houseId: item.houseId,
    areaId: item.areaId ?? undefined,
    areaName: item.areaName ?? undefined,
    thing: item.thing,
    alertType: item.alertType,
    metric: item.metric,
    title: item.title,
    detail: item.detail ?? undefined,
    value: item.value,
    level: item.level,
    ts: item.ts,
    resolved: item.resolved,
  };
}

export interface UseTenantAlertsResult {
  alerts: IAlert[];
  latestAlert: IAlert | null;
  unresolvedCount: number;
  criticalCount: number;
  loading: boolean;
  resolveAlert: (alertId: string) => Promise<void>;
  resolveAll: () => Promise<void>;
  refetch: () => void;
}

export function useTenantAlerts(params: {
  houseId: string | null;
  pageSize?: number;
}): UseTenantAlertsResult {
  const { houseId, pageSize = 30 } = params;
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const seenIds = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    try {
      const res = await alertApi.getAlerts({
        houseId,
        size: pageSize,
        resolved: false,
      });
      const raw = res?.content ?? [];
      const items: IAlert[] = [...raw].sort(
        (a, b) => (b.ts ?? 0) - (a.ts ?? 0)
      );
      setAlerts(items);
      seenIds.current = new Set(items.map((a) => a.alertId));
    } catch {
      /* keep state */
    } finally {
      setLoading(false);
    }
  }, [houseId, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!houseId) return;
    const topic = `alert/${houseId}`;
    iotClient.subscribeTopic(topic);

    const handler = (raw: unknown) => {
      const msg = raw as AlertWsMessage;
      if (msg?.type !== "iot_alert") return;
      if (!Array.isArray(msg.alerts)) return;

      const newAlerts = msg.alerts
        .map(wsItemToIAlert)
        .filter((a) => !seenIds.current.has(a.alertId));
      if (!newAlerts.length) return;
      newAlerts.forEach((a) => seenIds.current.add(a.alertId));

      const topLevel = newAlerts.some((a) => a.level === "CRITICAL")
        ? "CRITICAL"
        : "WARNING";
      void playAlertSound(topLevel);

      setAlerts((prev) => {
        const merged = [...newAlerts, ...prev];
        const map = new Map(merged.map((a) => [a.alertId, a]));
        return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
      });
    };

    iotClient.on("telemetry", handler);
    return () => {
      iotClient.removeListener("telemetry", handler);
      iotClient.unsubscribeTopic(topic);
    };
  }, [houseId]);

  const resolveAlert = useCallback(
    async (alertId: string) => {
      if (!houseId) return;
      try {
        await alertApi.resolveAlert(houseId, alertId);
        setAlerts((prev) =>
          prev.map((a) =>
            a.alertId === alertId
              ? { ...a, resolved: true, resolvedAt: Date.now() }
              : a
          )
        );
      } catch {
        /* ignore */
      }
    },
    [houseId]
  );

  const resolveAll = useCallback(async () => {
    if (!houseId) return;
    try {
      await alertApi.resolveAll(houseId);
      setAlerts((prev) => prev.map((a) => ({ ...a, resolved: true })));
    } catch {
      /* ignore */
    }
  }, [houseId]);

  const unresolved = alerts.filter((a) => !a.resolved);
  const latestAlert = unresolved[0] ?? null;

  return {
    alerts,
    latestAlert,
    unresolvedCount: unresolved.length,
    criticalCount: unresolved.filter((a) => a.level === "CRITICAL").length,
    loading,
    resolveAlert,
    resolveAll,
    refetch: load,
  };
}
