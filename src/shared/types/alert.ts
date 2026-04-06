// src/features/tenant/types/alert.ts

export type AlertLevel = "CRITICAL" | "WARNING" | "INFO";

export type AlertMetric =
  | "gas_ppm"
  | "temperature"
  | "humidity"
  | "humidity_high"
  | "humidity_low"
  | "voltage"
  | "current"
  | "power"
  | "frequency"
  | "w_lpm"
  | "water_leak"
  | "power_lost"
  | "power_restored"
  | "d_w_tot"
  | "eif_power"
  | "eif_water"
  | "node_offline";

export type AlertType = "THRESHOLD" | "AI_ANOMALY" | "SYSTEM" | "EVENT";

export interface IAlert {
  alertId:   string;
  houseId:   string;
  areaId?:   string;
  areaName?: string;
  thing:     string;
  alertType: AlertType;
  metric:    AlertMetric;
  title:     string;
  detail?:   string;
  value:     number;
  level:     AlertLevel;
  ts:        number;          // epoch ms
  resolved:  boolean;
  resolvedAt?: number;
}

// WS real-time event
export interface IAlertEvent {
  type:    "iot_alert";
  houseId: string;
  areaId?: string;
  alerts:  IAlert[];
}

// UI display config per metric
export interface AlertMetaConfig {
  icon:         string;         // emoji icon
  label:        string;         // tiếng Việt
  unit:         string;
  category:     "gas" | "temp" | "humidity" | "electric" | "water" | "system";
  criticalColor: string;
  warningColor:  string;
  infoColor:     string;
}