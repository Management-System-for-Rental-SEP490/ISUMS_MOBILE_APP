// src/features/tenant/hooks/useTenantAlerts.ts
// WS real-time alerts + in-memory queue + haptic

import { useEffect, useRef, useCallback, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { IAlert, IAlertEvent } from "../../../shared/types/alert";
import { playAlertHapticForAlert } from "../../../shared/utils/alertSound";
import { sortAlerts } from "../../../shared/utils/alertHelpers";
import { iotClient } from "../../../shared/services/iotClient";

interface UseTenantAlertsOptions {
  houseId:        string;
  maxQueueSize?:  number;    // default 50
  onNewAlert?:    (alert: IAlert) => void;
  onCritical?:    (alert: IAlert) => void;
}

interface UseTenantAlertsReturn {
  alerts:          IAlert[];          // danh sách in-memory alerts chưa resolve
  unresolvedCount: number;
  criticalCount:   number;
  warningCount:    number;
  latestAlert:     IAlert | null;
  isConnected:     boolean;
  resolveAlert:    (alertId: string) => void;
  clearAll:        () => void;
}

export function useTenantAlerts({
  houseId,
  maxQueueSize = 50,
  onNewAlert,
  onCritical,
}: UseTenantAlertsOptions): UseTenantAlertsReturn {
  const [alerts, setAlerts]         = useState<IAlert[]>([]);
  const [isConnected, setConnected] = useState(false);
  const appState                    = useRef<AppStateStatus>(AppState.currentState);
  const unsubRef                    = useRef<(() => void) | null>(null);

  // ── Handle incoming alert event
  const handleAlertEvent = useCallback(
    async (event: IAlertEvent) => {
      if (!event.alerts?.length) return;

      const newAlerts = event.alerts;

      // Haptic cho alert nặng nhất
      const heaviest = newAlerts.reduce((prev, cur) => {
        const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        return order[cur.level] < order[prev.level] ? cur : prev;
      });

      // Không rung khi app ở background để tránh phiền
      if (appState.current === "active") {
        await playAlertHapticForAlert(heaviest);
      }

      setAlerts((prev) => {
        const merged = [...newAlerts, ...prev];
        // Dedup by alertId
        const seen = new Set<string>();
        const deduped = merged.filter((a) => {
          if (seen.has(a.alertId)) return false;
          seen.add(a.alertId);
          return true;
        });
        // Giới hạn queue
        return sortAlerts(deduped).slice(0, maxQueueSize);
      });

      // Callbacks
      newAlerts.forEach((alert) => {
        onNewAlert?.(alert);
        if (alert.level === "CRITICAL") {
          onCritical?.(alert);
        }
      });
    },
    [maxQueueSize, onNewAlert, onCritical]
  );

  // ── Subscribe WS
  useEffect(() => {
    if (!houseId) return;

    const topic = `alert/${houseId}`;

    const subscribe = () => {
      unsubRef.current = iotClient.subscribe(topic, (payload: unknown) => {
        const event = payload as IAlertEvent;
        if (event?.type === "iot_alert") {
          handleAlertEvent(event);
        }
      });

      iotClient.onConnect(() => {
        setConnected(true);
        console.log(`[useTenantAlerts] connected houseId=${houseId}`);
      });

      iotClient.onDisconnect(() => {
        setConnected(false);
        console.log(`[useTenantAlerts] disconnected`);
      });
    };

    subscribe();

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [houseId, handleAlertEvent]);

  // ── Track AppState để quyết định haptic
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // ── Resolve alert in-memory
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.alertId === alertId
          ? { ...a, resolved: true, resolvedAt: Date.now() }
          : a
      )
    );
  }, []);

  const clearAll = useCallback(() => setAlerts([]), []);

  // ── Derived counts
  const unresolved = alerts.filter((a) => !a.resolved);
  const unresolvedCount = unresolved.length;
  const criticalCount   = unresolved.filter((a) => a.level === "CRITICAL").length;
  const warningCount    = unresolved.filter((a) => a.level === "WARNING").length;
  const latestAlert     = unresolved[0] ?? null;

  return {
    alerts,
    unresolvedCount,
    criticalCount,
    warningCount,
    latestAlert,
    isConnected,
    resolveAlert,
    clearAll,
  };
}