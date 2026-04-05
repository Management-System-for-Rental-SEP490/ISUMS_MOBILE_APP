import { EventEmitter } from "eventemitter3";
import { IOT_WS_URL, IOT_REST_BASE } from "../api/config";
import type { UsageData } from "../types/iot";

class IotClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private telemetrySubscriptions = new Set<string>();
  private alertSubscriptions = new Set<string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;

  connect(): void {
    this.shouldConnect = true;

    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this._connect();
  }

  disconnect(): void {
    this.shouldConnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws?.close();
    this.ws = null;
  }

  subscribe(thing: string): void {
    if (!thing) return;

    this.telemetrySubscriptions.add(thing);
    this._send({ action: "subscribe", thing });
  }

  unsubscribe(thing: string): void {
    if (!thing) return;

    this.telemetrySubscriptions.delete(thing);
    this._send({ action: "unsubscribe", thing });
  }

  subscribeAlertHouse(houseId: string): void {
    if (!houseId) return;

    const topic = `alert/${houseId}`;
    this.alertSubscriptions.add(topic);
    this._send({ action: "subscribe", topic });
  }

  unsubscribeAlertHouse(houseId: string): void {
    if (!houseId) return;

    const topic = `alert/${houseId}`;
    this.alertSubscriptions.delete(topic);
    this._send({ action: "unsubscribe", topic });
  }

  subscribeAlertArea(houseId: string, areaId: string): void {
    if (!houseId || !areaId) return;

    const topic = `alert/${houseId}/${areaId}`;
    this.alertSubscriptions.add(topic);
    this._send({ action: "subscribe", topic });
  }

  unsubscribeAlertArea(houseId: string, areaId: string): void {
    if (!houseId || !areaId) return;

    const topic = `alert/${houseId}/${areaId}`;
    this.alertSubscriptions.delete(topic);
    this._send({ action: "unsubscribe", topic });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getSubscribedThings(): string[] {
    return Array.from(this.telemetrySubscriptions);
  }

  getSubscribedAlertTopics(): string[] {
    return Array.from(this.alertSubscriptions);
  }

  async getUsage(
    pk: string,
    period: "day" | "week" | "month",
    value: string
  ): Promise<UsageData | null> {
    try {
      const url =
        `${IOT_REST_BASE}/usage` +
        `?pk=${encodeURIComponent(pk)}` +
        `&period=${period}` +
        `&value=${encodeURIComponent(value)}`;

      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  private _connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.ws = new WebSocket(IOT_WS_URL);

    this.ws.onopen = () => {
      this.emit("connected");

      this.telemetrySubscriptions.forEach((thing) => {
        this._send({ action: "subscribe", thing });
      });

      this.alertSubscriptions.forEach((topic) => {
        this._send({ action: "subscribe", topic });
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("[WS parsed]", msg);

        if (msg?.type === "iot_alert") {
          this.emit("alert", msg);

          if (msg.houseId) {
            this.emit(`alert:${msg.houseId}`, msg);
          }

          if (msg.houseId && msg.areaId) {
            this.emit(`alert:${msg.houseId}:${msg.areaId}`, msg);
          }

          return;
        }

        this.emit("telemetry", msg);

        if (msg?.thing) {
          this.emit(`telemetry:${msg.thing}`, msg);
        }
      } catch (e) {
        console.log("[WS parse error]", e);
      }
    };

    this.ws.onclose = () => {
      this.emit("disconnected");

      if (this.shouldConnect) {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
          this._connect();
        }, 5000);
      }
    };

    this.ws.onerror = () => {
      // onclose sẽ xử lý reconnect
    };
  }

  private _send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export const iotClient = new IotClient();