import { useCallback, useEffect, useState } from "react";
import { iotClient } from "../../../shared/services/iotClient";
import type { TelemetryMessage } from "../../../shared/types";

// =====================================================
// Types for controller-level batch telemetry
// =====================================================

type BatchNode = {
  serial: string;
  houseId?: string | null;
  areaId?: string | null;
  areaName?: string | null;

  seq?: number;
  dt?: number;

  ok_electric?: boolean;
  ok_water?: boolean;
  ok_gas?: boolean;
  ok_env?: boolean;
  buzzer_active?: boolean;

  v?: number | null;
  i?: number | null;
  p?: number | null;
  kwh?: number | null;
  d_kwh?: number | null;
  hz?: number | null;
  pf?: number | null;

  w_lpm?: number | null;
  w_tot?: number | null;
  d_w_tot?: number | null;

  gas_ppm?: number | null;
  temp_c?: number | null;
  humidity_pct?: number | null;
};

type BatchTelemetryMessage = {
  type: "telemetry_batch";
  thing: string;
  houseId?: string | null;
  ts: number;
  nodes: BatchNode[];
};

const DEBUG_IOT = true;

// =====================================================
// Helpers
// =====================================================

function isBatchTelemetryMessage(msg: any): msg is BatchTelemetryMessage {
  return !!msg && msg.type === "telemetry_batch" && Array.isArray(msg.nodes);
}

function toSafeNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function logDebug(...args: any[]) {
  if (DEBUG_IOT) {
    console.log("[IoT]", ...args);
  }
}

function buildPowerTelemetry(
  thing: string,
  houseId: string | null | undefined,
  areaId: string | null | undefined,
  areaName: string | null | undefined,
  ts: number,
  sourceNodes: BatchNode[]
): TelemetryMessage | null {
  const powerNodes = sourceNodes.filter((n) => n.ok_electric);

  if (!powerNodes.length) return null;

  const total = powerNodes.reduce(
    (acc, node) => {
      acc.v = Math.max(acc.v, toSafeNumber(node.v, 0));
      acc.i += toSafeNumber(node.i, 0);
      acc.p += toSafeNumber(node.p, 0);
      acc.kwh += toSafeNumber(node.kwh, 0);
      acc.d_kwh += toSafeNumber(node.d_kwh, 0);

      const hz = toSafeNumber(node.hz, 0);
      if (hz > 0) acc.hz = hz;

      const pf = toSafeNumber(node.pf, 0);
      if (pf > 0) acc.pf = pf;

      const dt = toSafeNumber(node.dt, 5);
      if (dt > 0) acc.dt = dt;

      return acc;
    },
    { v: 0, i: 0, p: 0, kwh: 0, d_kwh: 0, hz: 0, pf: 0, dt: 5 }
  );

  return {
    type: "telemetry",
    thing,
    houseId: houseId ?? undefined,
    areaId: areaId ?? undefined,
    areaName: areaName ?? undefined,
    stream: "power",
    ts,
    usage: total.d_kwh,
    features: {
      v: total.v,
      i: total.i,
      p: total.p,
      kwh: total.kwh,
      d_kwh: total.d_kwh,
      hz: total.hz,
      pf: total.pf,
      dt: total.dt,
    },
  } as TelemetryMessage;
}

function buildWaterTelemetry(
  thing: string,
  houseId: string | null | undefined,
  areaId: string | null | undefined,
  areaName: string | null | undefined,
  ts: number,
  sourceNodes: BatchNode[]
): TelemetryMessage | null {
  const waterNodes = sourceNodes.filter((n) => n.ok_water);

  if (!waterNodes.length) return null;

  const total = waterNodes.reduce(
    (acc, node) => {
      acc.w_lpm += toSafeNumber(node.w_lpm, 0);
      acc.w_tot += toSafeNumber(node.w_tot, 0);
      acc.d_w_tot += toSafeNumber(node.d_w_tot, 0);

      const dt = toSafeNumber(node.dt, 5);
      if (dt > 0) acc.dt = dt;

      return acc;
    },
    { w_lpm: 0, w_tot: 0, d_w_tot: 0, dt: 5 }
  );

  return {
    type: "telemetry",
    thing,
    houseId: houseId ?? undefined,
    areaId: areaId ?? undefined,
    areaName: areaName ?? undefined,
    stream: "water",
    ts,
    usage: total.d_w_tot,
    features: {
      w_lpm: total.w_lpm,
      w_tot: total.w_tot,
      d_w_tot: total.d_w_tot,
      dt: total.dt,
    },
  } as TelemetryMessage;
}

function getDateStrings(): { day: string; week: string; month: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const week = `${d.getUTCFullYear()}-W${pad(weekNo)}`;

  return { day, week, month };
}

// =====================================================
// Connection
// =====================================================

export function useTenantIoTConnection(thingId: string): boolean {
  const [connected, setConnected] = useState(
    typeof iotClient.isConnected === "function" ? iotClient.isConnected() : false
  );

  useEffect(() => {
    if (!thingId) {
      logDebug("useTenantIoTConnection: missing thingId");
      setConnected(false);
      return;
    }

    logDebug("connect subscribe thingId =", thingId);

    iotClient.connect();
    iotClient.subscribe(thingId);

    if (typeof iotClient.isConnected === "function") {
      setConnected(iotClient.isConnected());
    }

    const onConn = () => {
      logDebug("socket connected");
      setConnected(true);
    };

    const onDisc = () => {
      logDebug("socket disconnected");
      setConnected(false);
    };

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

// =====================================================
// Realtime area fallback source
// =====================================================

export interface RealtimeAreaOption {
  id: string;
  name: string;
}

export function useRealtimeAreas(thingId: string): RealtimeAreaOption[] {
  const [areas, setAreas] = useState<RealtimeAreaOption[]>([]);

  useEffect(() => {
    if (!thingId) {
      setAreas([]);
      return;
    }

    const handler = (msg: any) => {
      if (!isBatchTelemetryMessage(msg)) return;

      const areaMap = new Map<string, string>();

      msg.nodes.forEach((node) => {
        if (node.areaId) {
          areaMap.set(node.areaId, node.areaName || node.areaId);
        }
      });

      const nextAreas = Array.from(areaMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));

      logDebug("useRealtimeAreas =", nextAreas);
      setAreas(nextAreas);
    };

    iotClient.on(`telemetry:${thingId}`, handler);
    return () => iotClient.removeListener(`telemetry:${thingId}`, handler);
  }, [thingId]);

  return areas;
}

// =====================================================
// House-level realtime
// =====================================================

export function useTenantTelemetry(thingId: string): {
  power: TelemetryMessage | null;
  water: TelemetryMessage | null;
  powerHistory: TelemetryMessage[];
  waterHistory: TelemetryMessage[];
} {
  const [power, setPower] = useState<TelemetryMessage | null>(null);
  const [water, setWater] = useState<TelemetryMessage | null>(null);
  const [powerHistory, setPowerHistory] = useState<TelemetryMessage[]>([]);
  const [waterHistory, setWaterHistory] = useState<TelemetryMessage[]>([]);

  useEffect(() => {
    if (!thingId) return;

    const handler = (msg: any) => {
      logDebug("useTenantTelemetry thingId =", thingId);
      logDebug("useTenantTelemetry msg =", msg);

      if (isBatchTelemetryMessage(msg)) {
        logDebug("batch received nodes =", msg.nodes.length);

        const housePower = buildPowerTelemetry(
          msg.thing,
          msg.houseId,
          null,
          null,
          msg.ts,
          msg.nodes
        );

        if (housePower) {
          setPower(housePower);
          setPowerHistory((prev) => [...prev.slice(-49), housePower]);
        }

        const houseWater = buildWaterTelemetry(
          msg.thing,
          msg.houseId,
          null,
          null,
          msg.ts,
          msg.nodes
        );

        if (houseWater) {
          setWater(houseWater);
          setWaterHistory((prev) => [...prev.slice(-49), houseWater]);
        }

        return;
      }

      if (msg?.stream === "power") {
        setPower(msg);
        setPowerHistory((prev) => [...prev.slice(-49), msg]);
      } else if (msg?.stream === "water") {
        setWater(msg);
        setWaterHistory((prev) => [...prev.slice(-49), msg]);
      } else {
        logDebug("useTenantTelemetry unsupported message shape");
      }
    };

    iotClient.on(`telemetry:${thingId}`, handler);
    return () => iotClient.removeListener(`telemetry:${thingId}`, handler);
  }, [thingId]);

  return { power, water, powerHistory, waterHistory };
}

// =====================================================
// Area-level realtime
// =====================================================

export function useAreaTelemetry(thingId: string, areaId: string | null): {
  power: TelemetryMessage | null;
  water: TelemetryMessage | null;
  powerHistory: TelemetryMessage[];
  waterHistory: TelemetryMessage[];
} {
  const [power, setPower] = useState<TelemetryMessage | null>(null);
  const [water, setWater] = useState<TelemetryMessage | null>(null);
  const [powerHistory, setPowerHistory] = useState<TelemetryMessage[]>([]);
  const [waterHistory, setWaterHistory] = useState<TelemetryMessage[]>([]);

  useEffect(() => {
    setPower(null);
    setWater(null);
    setPowerHistory([]);
    setWaterHistory([]);
  }, [areaId]);

  useEffect(() => {
    if (!thingId || !areaId) return;

    const handler = (msg: any) => {
      logDebug("useAreaTelemetry thingId =", thingId, "areaId =", areaId);
      logDebug("useAreaTelemetry msg =", msg);

      if (isBatchTelemetryMessage(msg)) {
        const nodesInArea = msg.nodes.filter((n) => n.areaId === areaId);
        logDebug("nodesInArea =", nodesInArea.length);

        const areaName = nodesInArea[0]?.areaName ?? undefined;

        const areaPower = buildPowerTelemetry(
          msg.thing,
          msg.houseId,
          areaId,
          areaName,
          msg.ts,
          nodesInArea
        );

        if (areaPower) {
          setPower(areaPower);
          setPowerHistory((prev) => [...prev.slice(-49), areaPower]);
        }

        const areaWater = buildWaterTelemetry(
          msg.thing,
          msg.houseId,
          areaId,
          areaName,
          msg.ts,
          nodesInArea
        );

        if (areaWater) {
          setWater(areaWater);
          setWaterHistory((prev) => [...prev.slice(-49), areaWater]);
        }

        return;
      }

      if (msg?.areaId !== areaId) return;

      if (msg?.stream === "power") {
        setPower(msg);
        setPowerHistory((prev) => [...prev.slice(-49), msg]);
      } else if (msg?.stream === "water") {
        setWater(msg);
        setWaterHistory((prev) => [...prev.slice(-49), msg]);
      }
    };

    iotClient.on(`telemetry:${thingId}`, handler);
    return () => iotClient.removeListener(`telemetry:${thingId}`, handler);
  }, [thingId, areaId]);

  return { power, water, powerHistory, waterHistory };
}

// =====================================================
// Usage (REST aggregate)
// =====================================================

export interface UseTenantUsageOptions {
  houseId: string | null;
  metric: "electricity" | "water";
  areaId?: string | null;
}

export interface UseTenantUsageResult {
  dayVal: number;
  weekVal: number;
  monthVal: number;
  unit: string;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useTenantUsage(options: UseTenantUsageOptions): UseTenantUsageResult {
  const { houseId, metric, areaId } = options;
  const [dayVal, setDayVal] = useState(0);
  const [weekVal, setWeekVal] = useState(0);
  const [monthVal, setMonthVal] = useState(0);
  const [loading, setLoading] = useState(true);

  const unit = metric === "electricity" ? "kWh" : "L";

  const fetchUsage = useCallback(async () => {
    if (!houseId) {
      setDayVal(0);
      setWeekVal(0);
      setMonthVal(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { day, week, month } = getDateStrings();

    const pk = areaId
      ? `${houseId}#${areaId}#${metric}`
      : `${houseId}#${metric}`;

    logDebug("useTenantUsage pk =", pk);

    const [d, w, m] = await Promise.all([
      iotClient.getUsage(pk, "day", day),
      iotClient.getUsage(pk, "week", week),
      iotClient.getUsage(pk, "month", month),
    ]);

    logDebug("useTenantUsage results =", { d, w, m });

    setDayVal(d?.value ?? 0);
    setWeekVal(w?.value ?? 0);
    setMonthVal(m?.value ?? 0);
    setLoading(false);
  }, [houseId, metric, areaId]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  return {
    dayVal,
    weekVal,
    monthVal,
    unit,
    loading,
    refetch: fetchUsage,
  };
}