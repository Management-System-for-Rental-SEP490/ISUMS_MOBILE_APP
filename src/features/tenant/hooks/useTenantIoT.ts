/**
 * Hooks IoT cho tenant: kết nối WebSocket, telemetry realtime, usage (day/week/month).
 * Dùng iotClient từ shared/services/iotClient; houseId/thingId lấy từ useTenantContext hoặc param.
 */
import { useCallback, useEffect, useState } from "react";
import { iotClient } from "../../../shared/services/iotClient";
import type { TelemetryMessage } from "../../../shared/types";

/**
 * Trả về trạng thái kết nối WebSocket tới AWS (LIVE/OFFLINE).
 * Gọi iotClient.connect() và subscribe(thingId) khi mount; cleanup khi unmount.
 */
export function useTenantIoTConnection(thingId: string): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    iotClient.connect();
    iotClient.subscribe(thingId);
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

/**
 * Trả về telemetry realtime: power, water, history (mảng gần nhất cho sparkline).
 */
export function useTenantTelemetry(thingId: string): {
  power: TelemetryMessage | null;
  water: TelemetryMessage | null;
  history: TelemetryMessage[];
} {
  const [power, setPower] = useState<TelemetryMessage | null>(null);
  const [water, setWater] = useState<TelemetryMessage | null>(null);
  const [history, setHistory] = useState<TelemetryMessage[]>([]);

  useEffect(() => {
    const handler = (msg: TelemetryMessage) => {
      if (msg.stream === "power") {
        setPower(msg);
        setHistory((prev) => [...prev.slice(-49), msg]);
      } else if (msg.stream === "water") {
        setWater(msg);
      }
    };
    iotClient.on(`telemetry:${thingId}`, handler);
    return () => {
      iotClient.removeListener(`telemetry:${thingId}`, handler);
    };
  }, [thingId]);

  return { power, water, history };
}

/** Chuỗi ngày/tuần/tháng theo ISO để gọi API usage (giống TestApp). */
function getDateStrings(): { day: string; week: string; month: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const month = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const d = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const week = `${d.getUTCFullYear()}-W${pad(weekNo)}`;

  return { day, week, month };
}

export interface UseTenantUsageOptions {
  houseId: string | null;
  metric: "electricity" | "water";
}

export interface UseTenantUsageResult {
  dayVal: number;
  weekVal: number;
  monthVal: number;
  unit: string;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Lấy tiêu thụ tổng hợp theo ngày/tuần/tháng từ REST AWS.
 * pk = houseId#metric; gọi getUsage(pk, period, value) cho day, week, month.
 */
export function useTenantUsage(
  options: UseTenantUsageOptions
): UseTenantUsageResult {
  const { houseId, metric } = options;
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
    const pk = `${houseId}#${metric}`;

    const [d, w, m] = await Promise.all([
      iotClient.getUsage(pk, "day", day),
      iotClient.getUsage(pk, "week", week),
      iotClient.getUsage(pk, "month", month),
    ]);

    setDayVal(d?.value ?? 0);
    setWeekVal(w?.value ?? 0);
    setMonthVal(m?.value ?? 0);
    setLoading(false);
  }, [houseId, metric]);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  return { dayVal, weekVal, monthVal, unit, loading, refetch: fetchUsage };
}
