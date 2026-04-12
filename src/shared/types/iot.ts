/**
 * Định nghĩa kiểu dữ liệu cho IoT (WebSocket telemetry + REST usage).
 */

export type TelemetryStream = "power" | "water" | "gas" | "environment";

export interface TelemetryFeatures {
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
  gas_ppm?: number;
  temp_c?: number;
  humidity_pct?: number;
  env_alert_flags?: number;
  dt?: number;
  alert_level?: number;
  buzzer_active?: boolean;
  power_lost?: boolean;
  power_restored?: boolean;
  water_leak_suspected?: boolean;
}

export interface TelemetryMessage {
  type: "telemetry";
  thing: string;
  serial?: string;
  houseId: string;
  areaId: string;
  areaName?: string;
  stream: TelemetryStream;
  ts: number;
  features: TelemetryFeatures;
  usage?: number;
}

export interface AlertWsMessage {
  type: "iot_alert";
  houseId: string;
  areaId?: string | null;
  alerts: WsAlertItem[];
}

export interface WsAlertItem {
  alertId: string;
  thing: string;
  houseId: string;
  areaId?: string | null;
  areaName?: string | null;
  alertType: string;
  title: string;
  detail?: string | null;
  metric: string;
  value: number;
  level: string;
  ts: number;
  resolved: boolean;
}

export interface UsageData {
  pk: string;
  bucket: string;
  value: number;
  unit: string;
  updatedAt: number;
}
