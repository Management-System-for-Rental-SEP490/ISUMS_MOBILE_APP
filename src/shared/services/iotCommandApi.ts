import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";

export type PowerAction = "ON" | "OFF";

export interface AreaPowerStateResponse {
  houseId: string;
  areaId: string;
  powered: boolean;
  cutReason?: string | null;
  message?: string | null;
  changedAt?: string | null;
}

const iotCommandApi = {
  toggleAreaPower: (
    houseId: string,
    areaId: string,
    action: PowerAction
  ): Promise<AreaPowerStateResponse> => {
    return axiosClient
      .put<{ data: AreaPowerStateResponse }>(
        `${BACKEND_API_BASE}/assets/houses/${houseId}/areas/${areaId}/iot/power`,
        { action }
      )
      .then((r) => r.data.data);
  },

  getAreaPowerState: (
    houseId: string,
    areaId: string
  ): Promise<AreaPowerStateResponse> => {
    return axiosClient
      .get<{ data: AreaPowerStateResponse }>(
        `${BACKEND_API_BASE}/assets/houses/${houseId}/areas/${areaId}/iot/power`
      )
      .then((r) => r.data.data);
  },
};

export default iotCommandApi;
