/** Cảnh báo IoT từ REST / WebSocket — đồng bộ với BE assets API. */
export interface IAlert {
  alertId: string;
  houseId: string;
  areaId?: string;
  areaName?: string;
  thing: string;
  alertType: string;
  metric: string;
  title: string;
  detail?: string;
  value: number;
  level: string;
  ts: number;
  resolved: boolean;
  resolvedAt?: number;
}
