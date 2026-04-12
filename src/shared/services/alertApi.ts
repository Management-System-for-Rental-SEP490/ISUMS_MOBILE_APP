import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE, BACKEND_API_BASE } from "../api/config";
import type { IAlert } from "../types/alert";

export interface AlertListParams {
  houseId: string;
  page?: number;
  size?: number;
  level?: string;
  metric?: string;
  resolved?: boolean;
  from?: number;
  to?: number;
}

export interface AlertListResponse {
  content: IAlert[];
  totalPages: number;
  totalElements: number;
  page: number;
  size: number;
}

const alertApi = {
  getAlerts: (params: AlertListParams): Promise<AlertListResponse> => {
    const { houseId, ...rest } = params;
    return axiosClient
      .get(`${BACKEND_API_BASE}/assets/houses/${houseId}/iot/alerts`, {
        params: { size: 20, page: 0, ...rest },
      })
      .then((res) => {
        const body = res.data?.data ?? res.data;
        if (body && typeof body === "object" && !Array.isArray(body)) {
          const b = body as AlertListResponse & { items?: IAlert[] };
          const list = b.content ?? b.items;
          if (Array.isArray(list)) {
            return {
              content: list,
              totalPages: b.totalPages ?? 1,
              totalElements: b.totalElements ?? list.length,
              page: b.page ?? 0,
              size: b.size ?? list.length,
            };
          }
        }
        if (Array.isArray(body)) {
          return {
            content: body,
            totalPages: 1,
            totalElements: body.length,
            page: 0,
            size: body.length,
          };
        }
        return {
          content: [],
          totalPages: 0,
          totalElements: 0,
          page: 0,
          size: 0,
        };
      });
  },

  getAlertDetail: (houseId: string, alertId: string): Promise<IAlert> => {
    return axiosClient
      .get(`${BACKEND_API_BASE}/assets/houses/${houseId}/iot/alerts/${alertId}`)
      .then((res) => res.data?.data ?? res.data);
  },

  resolveAlert: (houseId: string, alertId: string): Promise<IAlert> => {
    return axiosClient
      .put(`${BACKEND_API_BASE}/assets/houses/${houseId}/iot/alerts/${alertId}/resolve`)
      .then((res) => res.data?.data ?? res.data);
  },

  resolveAll: (houseId: string): Promise<{ resolved: number }> => {
    return axiosClient
      .put(`${ASSETS_API_BASE}/assets/houses/${houseId}/iot/alerts/resolve-all`)
      .then((res) => res.data?.data ?? res.data);
  },
};

export default alertApi;
