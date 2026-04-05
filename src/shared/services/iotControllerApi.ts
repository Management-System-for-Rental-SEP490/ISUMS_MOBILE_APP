import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE } from "../api/config";

export interface IotControllerDto {
  thingName: string;
  deviceId: string;
}

export async function getIotControllerByHouse(
  houseId: string
): Promise<IotControllerDto | null> {
  try {
    const res = await axiosClient.get(
      `${ASSETS_API_BASE}/assets/houses/${houseId}/iot/controller`
    );
    return res?.data?.data ?? null;
  } catch (error: any) {
    const status = error?.response?.status;
    const body = error?.response?.data;
    console.log("[IoTControllerApi] get controller failed:", {
      houseId,
      status,
      body,
    });

    if (status === 404) {
      return null;
    }

    if (status === 500) {
      return null;
    }

    return null;
  }
}