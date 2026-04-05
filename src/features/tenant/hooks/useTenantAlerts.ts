import { useEffect, useState } from "react";
import { iotClient } from "../../../shared/services/iotClient";
import { playAlertSound } from "../../../shared/services/alertSound";

export interface IotAlertItem {
  alertId: string;
  thing: string;
  houseId: string;
  areaId?: string | null;
  areaName?: string | null;
  alertType: string;
  title: string;
  metric: string;
  value: number;
  level: string;
  ts: number;
  resolved: boolean;
}

export function useTenantAlerts(houseId: string | null) {
  const [alerts, setAlerts] = useState<IotAlertItem[]>([]);

  useEffect(() => {
    if (!houseId) {
      setAlerts([]);
      return;
    }

    iotClient.connect();

    if (typeof iotClient.subscribeAlertHouse === "function") {
      iotClient.subscribeAlertHouse(houseId);
    } else {
      console.log("[Alerts] subscribeAlertHouse() is missing on iotClient");
    }

    const handler = (msg: any) => {
      console.log("[Alerts] received =", msg);

      const incoming = Array.isArray(msg?.alerts) ? msg.alerts : [];
      if (!incoming.length) return;

       // ── Play sound theo severity
        const highestLevel = incoming.reduce((acc, alert) => {
          if (alert.level === "CRITICAL") return "CRITICAL";
          if (acc !== "CRITICAL" && alert.level === "WARNING") return "WARNING";
          return acc;
        }, "INFO");

        playAlertSound(highestLevel);

      setAlerts((prev) => {
        const merged = [...incoming, ...prev];
        const seen = new Set<string>();

        return merged.filter((a) => {
          const key = a.alertId || `${a.thing}-${a.metric}-${a.ts}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
    };

    iotClient.on(`alert:${houseId}`, handler);

    return () => {
      iotClient.removeListener(`alert:${houseId}`, handler);

      if (typeof iotClient.unsubscribeAlertHouse === "function") {
        iotClient.unsubscribeAlertHouse(houseId);
      }
    };
  }, [houseId]);

  return alerts;
}