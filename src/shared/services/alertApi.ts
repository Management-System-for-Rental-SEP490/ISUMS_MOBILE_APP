// src/shared/services/alertApi.ts

import axiosClient from "../api/axiosClient";
import { IAlert } from "../types/alert";

export interface AlertListParams {
  houseId:  string;
  page?:    number;
  size?:    number;
  level?:   string;
  metric?:  string;
  resolved?: boolean;
  from?:    number;   // epoch ms
  to?:      number;   // epoch ms
}

export interface AlertListResponse {
  content:    IAlert[];
  totalPages: number;
  totalElements: number;
  page:       number;
  size:       number;
}

const alertApi = {
  // Lấy danh sách alerts
  getAlerts: (params: AlertListParams): Promise<AlertListResponse> => {
    const { houseId, ...rest } = params;
    return axiosClient.get(`/api/assets/houses/${houseId}/iot/alerts`, {
      params: { size: 20, page: 0, ...rest },
    });
  },

  // Lấy alert detail
  getAlertDetail: (houseId: string, alertId: string): Promise<IAlert> => {
    return axiosClient.get(
      `/api/assets/houses/${houseId}/iot/alerts/${alertId}`
    );
  },

  // Resolve alert
  resolveAlert: (houseId: string, alertId: string): Promise<IAlert> => {
    return axiosClient.put(
      `/api/assets/houses/${houseId}/iot/alerts/${alertId}/resolve`
    );
  },

  // Resolve tất cả alerts đang mở
  resolveAll: (houseId: string): Promise<{ resolved: number }> => {
    return axiosClient.put(
      `/api/assets/houses/${houseId}/iot/alerts/resolve-all`
    );
  },

  // Unresolved count (dùng cho badge)
  getUnresolvedCount: (
    houseId: string
  ): Promise<{ critical: number; warning: number; total: number }> => {
    return axiosClient.get(
      `/api/assets/houses/${houseId}/iot/alerts/unresolved-count`
    );
  },
};

export default alertApi;