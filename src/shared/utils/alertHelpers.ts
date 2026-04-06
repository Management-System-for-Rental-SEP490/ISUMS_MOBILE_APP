// src/features/tenant/utils/alertHelpers.ts

import {
  IAlert,
  AlertLevel,
  AlertMetric,
  AlertMetaConfig,
} from "../types/alert";

// ================================================================
//  Alert metadata — icon, label, color per metric
// ================================================================

export const ALERT_META: Record<AlertMetric, AlertMetaConfig> = {
  gas_ppm: {
    icon:          "🔥",
    label:         "Khí gas / Khói",
    unit:          "ppm",
    category:      "gas",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  temperature: {
    icon:          "🌡️",
    label:         "Nhiệt độ",
    unit:          "°C",
    category:      "temp",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  humidity: {
    icon:          "💧",
    label:         "Độ ẩm",
    unit:          "%",
    category:      "humidity",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  humidity_high: {
    icon:          "💧",
    label:         "Độ ẩm cao",
    unit:          "%",
    category:      "humidity",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  humidity_low: {
    icon:          "🏜️",
    label:         "Độ ẩm thấp",
    unit:          "%",
    category:      "humidity",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  voltage: {
    icon:          "⚡",
    label:         "Điện áp",
    unit:          "V",
    category:      "electric",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  current: {
    icon:          "⚡",
    label:         "Dòng điện",
    unit:          "A",
    category:      "electric",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  power: {
    icon:          "⚡",
    label:         "Công suất",
    unit:          "W",
    category:      "electric",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  frequency: {
    icon:          "〰️",
    label:         "Tần số điện",
    unit:          "Hz",
    category:      "electric",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#34C759",
  },
  w_lpm: {
    icon:          "🚿",
    label:         "Lưu lượng nước",
    unit:          "L/min",
    category:      "water",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  water_leak: {
    icon:          "🚰",
    label:         "Rò rỉ nước",
    unit:          "L/min",
    category:      "water",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  d_w_tot: {
    icon:          "💧",
    label:         "Tiêu thụ nước",
    unit:          "L",
    category:      "water",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  power_lost: {
    icon:          "🔌",
    label:         "Mất điện",
    unit:          "",
    category:      "system",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#8E8E93",
  },
  power_restored: {
    icon:          "✅",
    label:         "Có điện lại",
    unit:          "",
    category:      "system",
    criticalColor: "#34C759",
    warningColor:  "#34C759",
    infoColor:     "#34C759",
  },
  eif_power: {
    icon:          "🤖",
    label:         "AI: Điện bất thường",
    unit:          "",
    category:      "electric",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  eif_water: {
    icon:          "🤖",
    label:         "AI: Nước bất thường",
    unit:          "",
    category:      "water",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#007AFF",
  },
  node_offline: {
    icon:          "📡",
    label:         "Thiết bị offline",
    unit:          "",
    category:      "system",
    criticalColor: "#FF3B30",
    warningColor:  "#FF9500",
    infoColor:     "#8E8E93",
  },
};

// ================================================================
//  Get color for alert level
// ================================================================

export function getAlertColor(alert: IAlert): string {
  const meta = ALERT_META[alert.metric];
  if (!meta) return "#FF9500";

  switch (alert.level) {
    case "CRITICAL": return meta.criticalColor;
    case "WARNING":  return meta.warningColor;
    case "INFO":     return meta.infoColor;
    default:         return meta.warningColor;
  }
}

export function getLevelColor(level: AlertLevel): string {
  switch (level) {
    case "CRITICAL": return "#FF3B30";
    case "WARNING":  return "#FF9500";
    case "INFO":     return "#007AFF";
    default:         return "#8E8E93";
  }
}

export function getLevelBgColor(level: AlertLevel): string {
  switch (level) {
    case "CRITICAL": return "#FFF0EF";
    case "WARNING":  return "#FFF8EE";
    case "INFO":     return "#EEF4FF";
    default:         return "#F5F5F5";
  }
}

export function getLevelLabel(level: AlertLevel): string {
  switch (level) {
    case "CRITICAL": return "Nguy hiểm";
    case "WARNING":  return "Cảnh báo";
    case "INFO":     return "Thông tin";
    default:         return level;
  }
}

// ================================================================
//  Format time
// ================================================================

export function formatAlertTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)  return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} giờ trước`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD} ngày trước`;

  return d.toLocaleDateString("vi-VN", {
    day:   "2-digit",
    month: "2-digit",
    year:  "numeric",
    hour:  "2-digit",
    minute:"2-digit",
  });
}

export function formatAlertTimeFull(ts: number): string {
  return new Date(ts).toLocaleString("vi-VN", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ================================================================
//  Format value
// ================================================================

export function formatAlertValue(alert: IAlert): string {
  const meta = ALERT_META[alert.metric];
  if (!meta || !meta.unit) return "";

  const val = alert.value;
  if (meta.unit === "ppm")    return `${val.toFixed(0)} ppm`;
  if (meta.unit === "°C")     return `${val.toFixed(1)}°C`;
  if (meta.unit === "%")      return `${val.toFixed(0)}%`;
  if (meta.unit === "V")      return `${val.toFixed(1)} V`;
  if (meta.unit === "A")      return `${val.toFixed(2)} A`;
  if (meta.unit === "W")      return `${val.toFixed(0)} W`;
  if (meta.unit === "Hz")     return `${val.toFixed(1)} Hz`;
  if (meta.unit === "L/min")  return `${val.toFixed(2)} L/min`;
  if (meta.unit === "L")      return `${val.toFixed(1)} L`;

  return `${val}`;
}

// ================================================================
//  Sort & group alerts
// ================================================================

export function sortAlerts(alerts: IAlert[]): IAlert[] {
  const levelOrder: Record<AlertLevel, number> = {
    CRITICAL: 0,
    WARNING:  1,
    INFO:     2,
  };
  return [...alerts].sort((a, b) => {
    const lvDiff = levelOrder[a.level] - levelOrder[b.level];
    if (lvDiff !== 0) return lvDiff;
    return b.ts - a.ts;
  });
}

export function groupAlertsByDate(
  alerts: IAlert[]
): { date: string; alerts: IAlert[] }[] {
  const groups: Record<string, IAlert[]> = {};

  for (const alert of alerts) {
    const d = new Date(alert.ts);
    const key = d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day:     "2-digit",
      month:   "2-digit",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(alert);
  }

  return Object.entries(groups).map(([date, alerts]) => ({
    date,
    alerts: sortAlerts(alerts),
  }));
}

// ================================================================
//  Severity helpers
// ================================================================

export function isCritical(alert: IAlert): boolean {
  return alert.level === "CRITICAL";
}

export function isUnresolved(alert: IAlert): boolean {
  return !alert.resolved;
}

export function countByLevel(alerts: IAlert[]): Record<AlertLevel, number> {
  return alerts.reduce(
    (acc, a) => {
      acc[a.level] = (acc[a.level] || 0) + 1;
      return acc;
    },
    { CRITICAL: 0, WARNING: 0, INFO: 0 } as Record<AlertLevel, number>
  );
}