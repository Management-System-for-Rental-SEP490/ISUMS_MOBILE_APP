/**
 * Hooks IoT tenant: WebSocket realtime + REST usage + điều khiển điện.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { iotClient } from "../../../shared/services/iotClient";
import type { TelemetryMessage } from "../../../shared/types";
import iotCommandApi, {
  type PowerAction,
  type AreaPowerStateResponse,
} from "../../../shared/services/iotCommandApi";

const HISTORY_SIZE = 50;

export function useTenantIoTConnection(thingId: string): boolean {
  const [connected, setConnected] = useState(() => iotClient.isConnected);

  useEffect(() => {
    if (!thingId) return;
    iotClient.connect();
    iotClient.subscribe(thingId);
    setConnected(iotClient.isConnected);
    const onConn = () => setConnected(true);
    const onDisc = () => setConnected(false);
    iotClient.on("connected", onConn);
    iotClient.on("disconnected", onDisc);
    return () => {
      iotClient.removeListener("connected", onConn);
      iotClient.removeListener("disconnected", onDisc);
      iotClient.unsubscribe(thingId);
    };
  }, [thingId]);

  return connected;
}

export interface TenantTelemetryState {
  power: TelemetryMessage | null;
  water: TelemetryMessage | null;
  gas: TelemetryMessage | null;
  environment: TelemetryMessage | null;
  powerHistory: TelemetryMessage[];
  waterHistory: TelemetryMessage[];
  gasHistory: TelemetryMessage[];
  environmentHistory: TelemetryMessage[];
}

type AreaMap = Record<string, TelemetryMessage>;

function latestInMap(map: AreaMap): TelemetryMessage | null {
  const vals = Object.values(map);
  if (!vals.length) return null;
  return vals.reduce((a, b) => (a.ts >= b.ts ? a : b));
}

function useTelemetryAreaMaps(thingId: string) {
  const [powerMap, setPowerMap] = useState<AreaMap>({});
  const [waterMap, setWaterMap] = useState<AreaMap>({});
  const [gasMap, setGasMap] = useState<AreaMap>({});
  const [envMap, setEnvMap] = useState<AreaMap>({});
  const [powerHistory, setPowerHistory] = useState<TelemetryMessage[]>([]);
  const [waterHistory, setWaterHistory] = useState<TelemetryMessage[]>([]);
  const [gasHistory, setGasHistory] = useState<TelemetryMessage[]>([]);
  const [envHistory, setEnvHistory] = useState<TelemetryMessage[]>([]);

  useEffect(() => {
    if (!thingId) return;
    const handler = (msg: TelemetryMessage) => {
      const key = msg.areaId || "__house__";
      const append = (prev: TelemetryMessage[]) =>
        [...prev.slice(-(HISTORY_SIZE - 1)), msg];
      switch (msg.stream) {
        case "power":
          setPowerMap((p) => ({ ...p, [key]: msg }));
          setPowerHistory(append);
          break;
        case "water":
          setWaterMap((p) => ({ ...p, [key]: msg }));
          setWaterHistory(append);
          break;
        case "gas":
          setGasMap((p) => ({ ...p, [key]: msg }));
          setGasHistory(append);
          break;
        case "environment":
          setEnvMap((p) => ({ ...p, [key]: msg }));
          setEnvHistory(append);
          break;
      }
    };
    iotClient.on(`telemetry:${thingId}`, handler);
    return () => {
      iotClient.removeListener(`telemetry:${thingId}`, handler);
    };
  }, [thingId]);

  return {
    powerMap,
    waterMap,
    gasMap,
    envMap,
    powerHistory,
    waterHistory,
    gasHistory,
    envHistory,
  };
}

export function useTenantTelemetry(thingId: string): TenantTelemetryState {
  const maps = useTelemetryAreaMaps(thingId);
  return {
    power: latestInMap(maps.powerMap),
    water: latestInMap(maps.waterMap),
    gas: latestInMap(maps.gasMap),
    environment: latestInMap(maps.envMap),
    powerHistory: maps.powerHistory,
    waterHistory: maps.waterHistory,
    gasHistory: maps.gasHistory,
    environmentHistory: maps.envHistory,
  };
}

export function useAreaTelemetry(
  thingId: string,
  areaId: string | null
): TenantTelemetryState {
  const maps = useTelemetryAreaMaps(thingId);

  if (!areaId) {
    return {
      power: latestInMap(maps.powerMap),
      water: latestInMap(maps.waterMap),
      gas: latestInMap(maps.gasMap),
      environment: latestInMap(maps.envMap),
      powerHistory: maps.powerHistory,
      waterHistory: maps.waterHistory,
      gasHistory: maps.gasHistory,
      environmentHistory: maps.envHistory,
    };
  }

  return {
    power: maps.powerMap[areaId] ?? null,
    water: maps.waterMap[areaId] ?? null,
    gas: maps.gasMap[areaId] ?? null,
    environment: maps.envMap[areaId] ?? null,
    powerHistory: maps.powerHistory.filter((m) => m.areaId === areaId),
    waterHistory: maps.waterHistory.filter((m) => m.areaId === areaId),
    gasHistory: maps.gasHistory.filter((m) => m.areaId === areaId),
    environmentHistory: maps.envHistory.filter((m) => m.areaId === areaId),
  };
}

function toIsoWeek(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function fetchUsage(
  houseId: string,
  metric: "electricity" | "water",
  period: "day" | "week" | "month",
  value: string,
  areaId?: string | null
): Promise<number> {
  const pkBase = areaId
    ? `${houseId}#${areaId}#${metric}`
    : `${houseId}#${metric}`;
  /** Dùng `iotClient.getUsage` (có timeout + abort) — `fetch` trần dễ treo vô hạn nếu AWS chậm/không trả. */
  const data = await iotClient.getUsage(pkBase, period, value);
  return typeof data?.value === "number" ? data.value : 0;
}

export interface UsageState {
  dayVal: number;
  weekVal: number;
  monthVal: number;
  unit: string;
  loading: boolean;
  refetch: () => void;
}

export function useTenantUsage(params: {
  houseId: string | null;
  metric: "electricity" | "water";
  areaId?: string | null;
}): UsageState {
  const { houseId, metric, areaId } = params;
  const [dayVal, setDay] = useState(0);
  const [weekVal, setWeek] = useState(0);
  const [monthVal, setMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const genRef = useRef(0);

  const load = useCallback(async () => {
    if (!houseId) {
      setDay(0);
      setWeek(0);
      setMonth(0);
      setLoading(false);
      return;
    }
    const gen = ++genRef.current;
    setDay(0);
    setWeek(0);
    setMonth(0);
    setLoading(true);
    const now = new Date();
    const dayStr = now.toISOString().slice(0, 10);
    const wkStr = toIsoWeek(now);
    const moStr = now.toISOString().slice(0, 7);

    try {
      const [d, w, m] = await Promise.all([
        fetchUsage(houseId, metric, "day", dayStr, areaId),
        fetchUsage(houseId, metric, "week", wkStr, areaId),
        fetchUsage(houseId, metric, "month", moStr, areaId),
      ]);
      if (gen !== genRef.current) return;
      setDay(d);
      setWeek(w);
      setMonth(m);
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [houseId, metric, areaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const unit = metric === "electricity" ? "kWh" : "L";

  return { dayVal, weekVal, monthVal, unit, loading, refetch: load };
}

export interface PowerControlState {
  loading: boolean;
  error: string | null;
  toggle: (
    areaId: string,
    action: PowerAction
  ) => Promise<AreaPowerStateResponse>;
}

export function usePowerControl(houseId: string | null): PowerControlState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    async (areaId: string, action: PowerAction) => {
      if (!houseId) throw new Error("houseId is required");
      setLoading(true);
      setError(null);
      try {
        return await iotCommandApi.toggleAreaPower(houseId, areaId, action);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        const msg =
          err?.response?.data?.message ?? err?.message ?? "Lỗi không xác định";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [houseId]
  );

  return { loading, error, toggle };
}
