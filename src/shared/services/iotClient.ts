/**
 * IoT Client – kết nối WebSocket + REST tới AWS cho dữ liệu điện/nước realtime.
 * Dùng chung cho tenant (và sau này staff nếu cần).
 * Không gán cứng houseId/areaId/thingId; các giá trị đó lấy từ useTenantContext hoặc param.
 */
import { EventEmitter } from "eventemitter3";

/** URL WebSocket AWS API Gateway (production) – nhận telemetry realtime. */
const WS_URL =
  "wss://a98erfaotg.execute-api.ap-southeast-1.amazonaws.com/production/";
/** Base URL REST API AWS – dùng cho endpoint usage (day/week/month). */
const REST_BASE =
  "https://m0etrbg5l2.execute-api.ap-southeast-1.amazonaws.com/dev";

/**
 * Tin nhắn telemetry từ WebSocket (điện hoặc nước).
 * thing: ID thiết bị IoT; houseId/areaId: nhà và khu vực; stream: "power" | "water".
 */
export interface TelemetryMessage {
  type: "telemetry";
  thing: string;
  houseId: string;
  areaId: string;
  stream: "power" | "water";
  ts: number;
  features: {
    v?: number;
    i?: number;
    p?: number;
    kwh?: number;
    d_kwh?: number;
    hz?: number;
    pf?: number;
    w_lpm?: number;
    w_tot?: number;
    d_w_tot?: number;
    dt?: number;
  };
  usage: number;
}

/**
 * Dữ liệu tiêu thụ tổng hợp từ REST GET /usage (theo ngày/tuần/tháng).
 */
export interface UsageData {
  pk: string;
  bucket: string;
  value: number;
  unit: string;
  updatedAt: number;
}

class IotClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;

  connect(): void {
    this.shouldConnect = true;
    this._connect();
  }

  disconnect(): void {
    this.shouldConnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
  }

  subscribe(thing: string): void {
    this.subscriptions.add(thing);
    this._send({ action: "subscribe", thing });
  }

  unsubscribe(thing: string): void {
    this.subscriptions.delete(thing);
    this._send({ action: "unsubscribe", thing });
  }

  /**
   * Gọi REST API usage của AWS.
   * @param pk – partition key, format: `${houseId}#${metric}` (metric = "electricity" | "water").
   * @param period – "day" | "week" | "month".
   * @param value – chuỗi ngày/tuần/tháng (vd "2026-03-10", "2026-W10", "2026-03").
   */
  async getUsage(
    pk: string,
    period: "day" | "week" | "month",
    value: string
  ): Promise<UsageData | null> {
    try {
      const url = `${REST_BASE}/usage?pk=${encodeURIComponent(pk)}&period=${period}&value=${encodeURIComponent(value)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  private _connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.emit("connected");
      this.subscriptions.forEach((thing) =>
        this._send({ action: "subscribe", thing })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: TelemetryMessage = JSON.parse(event.data);
        this.emit("telemetry", msg);
        this.emit(`telemetry:${msg.thing}`, msg);
      } catch {
        // ignore parse error
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
