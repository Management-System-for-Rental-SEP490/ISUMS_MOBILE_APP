/**
 * IoT Client – WebSocket + REST AWS (điện/nước realtime).
 */
import { EventEmitter } from "eventemitter3";
import { DATA_LOAD_TIMEOUT_MS, IOT_WS_URL, IOT_REST_BASE } from "../api/config";
import type { TelemetryMessage, TelemetryStream, UsageData } from "../types/iot";

const SILENCE_RECONNECT_MS = 60_000;
const WATCHDOG_INTERVAL_MS = 10_000;

class IotClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private topicSubs = new Set<string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageAt = 0;
  private shouldConnect = false;

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): void {
    this.shouldConnect = true;
    this._connect();
    this._startWatchdog();
  }

  disconnect(): void {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this._stopWatchdog();
    this.ws?.close();
    this.ws = null;
  }

  forceReconnect(): void {
    if (!this.shouldConnect) return;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this._connect(), 250);
  }

  private _startWatchdog(): void {
    if (this.watchdogTimer) return;
    this.lastMessageAt = Date.now();
    this.watchdogTimer = setInterval(() => {
      if (!this.shouldConnect) return;
      if (this.subscriptions.size === 0 && this.topicSubs.size === 0) return;
      const silentFor = Date.now() - this.lastMessageAt;
      if (silentFor > SILENCE_RECONNECT_MS) {
        this.lastMessageAt = Date.now();
        this.forceReconnect();
      }
    }, WATCHDOG_INTERVAL_MS);
  }

  private _stopWatchdog(): void {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = null;
  }

  subscribe(thing: string): void {
    if (!thing) return;
    this.subscriptions.add(thing);
    this._send({ action: "subscribe", thing });
  }

  unsubscribe(thing: string): void {
    this.subscriptions.delete(thing);
    this._send({ action: "unsubscribe", thing });
  }

  subscribeTopic(topic: string): void {
    if (!topic) return;
    this.topicSubs.add(topic);
    this._send({ action: "subscribe", topic });
  }

  unsubscribeTopic(topic: string): void {
    this.topicSubs.delete(topic);
    this._send({ action: "unsubscribe", topic });
  }

  async getUsage(
    pk: string,
    period: "day" | "week" | "month",
    value: string
  ): Promise<UsageData | null> {
    const url = `${IOT_REST_BASE}/usage?pk=${encodeURIComponent(pk)}&period=${period}&value=${encodeURIComponent(value)}`;
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), DATA_LOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(tid);
    }
  }

  private _connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    // Guard: URL rỗng (env chưa cấu hình) → KHÔNG mở WebSocket.
    // okhttp ném IllegalArgumentException khi URL không có scheme → crash native cả app.
    if (!IOT_WS_URL || !/^wss?:\/\//i.test(IOT_WS_URL)) {
      if (__DEV__) {
        console.warn("[iotClient] IOT_WS_URL rỗng/không hợp lệ — bỏ qua kết nối WebSocket:", IOT_WS_URL);
      }
      return;
    }
    this.ws = new WebSocket(IOT_WS_URL);

    this.ws.onopen = () => {
      this.lastMessageAt = Date.now();
      this.emit("connected");
      this.subscriptions.forEach((thing) =>
        this._send({ action: "subscribe", thing })
      );
      this.topicSubs.forEach((topic) =>
        this._send({ action: "subscribe", topic })
      );
    };

    this.ws.onmessage = (event) => {
      this.lastMessageAt = Date.now();
      try {
        const msg = JSON.parse(event.data);
        this.emit("telemetry", msg);
        if (msg?.type === "telemetry" && msg?.thing) {
          this.emit(`telemetry:${msg.thing}`, msg as TelemetryMessage);
        }
        if (msg?.type === "telemetry_batch" && msg?.thing && Array.isArray(msg?.nodes)) {
          for (const node of msg.nodes as Record<string, unknown>[]) {
            if (!node.houseId) continue;
            const base = {
              type: "telemetry" as const,
              thing: msg.thing as string,
              serial: node.serial as string | undefined,
              houseId: node.houseId as string,
              areaId: (node.areaId as string) || "",
              areaName: node.areaName as string | undefined,
              ts: (msg.ts as number) ?? Date.now(),
            };
            const streams: { flag: string; stream: TelemetryStream }[] = [
              { flag: "ok_electric", stream: "power" },
              { flag: "ok_water", stream: "water" },
              { flag: "ok_gas", stream: "gas" },
              { flag: "ok_env", stream: "environment" },
            ];
            for (const { flag, stream } of streams) {
              if (!node[flag]) continue;
              const m: TelemetryMessage = {
                ...base,
                stream,
                features: {
                  v: node.v as number | undefined,
                  i: node.i as number | undefined,
                  p: node.p as number | undefined,
                  kwh: node.kwh as number | undefined,
                  hz: node.hz as number | undefined,
                  pf: node.pf as number | undefined,
                  d_kwh: node.d_kwh as number | undefined,
                  w_lpm: node.w_lpm as number | undefined,
                  w_tot: node.w_tot as number | undefined,
                  d_w_tot: node.d_w_tot as number | undefined,
                  gas_ppm: node.gas_ppm as number | undefined,
                  temp_c: node.temp_c as number | undefined,
                  humidity_pct: node.humidity_pct as number | undefined,
                  env_alert_flags: node.env_alert_flags as number | undefined,
                  dt: node.dt as number | undefined,
                  buzzer_active: node.buzzer_active as boolean | undefined,
                  power_lost: node.power_lost as boolean | undefined,
                  power_restored: node.power_restored as boolean | undefined,
                  water_leak_suspected: node.water_leak_suspected as boolean | undefined,
                },
              };
              this.emit(`telemetry:${msg.thing}`, m);
            }
          }
        }
      } catch {
        /* ignore */
      }
    };

    this.ws.onclose = () => {
      this.emit("disconnected");
      if (this.shouldConnect) {
        this.reconnectTimer = setTimeout(() => this._connect(), 5000);
      }
    };

    this.ws.onerror = () => {};
  }

  private _send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const iotClient = new IotClient();
