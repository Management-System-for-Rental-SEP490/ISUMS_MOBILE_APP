/**
 * Hook chứa ngữ cảnh tenant: nhà đang thuê, các khu vực chức năng, thingId IoT.
 * thingId lấy từ GET /api/assets/iot-devices/house/{houseId} (`useIotDevicesByHouseId`).
 * Chỉ dùng khi user đã đăng nhập với role tenant.
 */
import { useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useTenantHouses, useFunctionalAreasByHouseId } from "./useHouses";
import { useIotDevicesByHouseId } from "./useAssetItems";
import type {
  FunctionalAreaFromApi,
  HouseFromApi,
  IotNodeDeviceFromApi,
} from "../types/api";

/**
 * Fallback khi BE chưa trả `thingName` — giữ tương thích môi trường cũ.
 * WS URL vẫn từ `EXPO_PUBLIC_IOT_WS_URL` trong [config](../api/config.ts).
 */
export const TENANT_IOT_THING_ID =
  "ESP32-controller_62174095-1ba3-4296-ba16-40edf78c2de2";

export interface TenantContextValue {
  house: HouseFromApi | null;
  houseId: string | null;
  functionalAreas: FunctionalAreaFromApi[];
  /** thingName controller — subscribe WebSocket telemetry. */
  thingId: string;
  thingLoading: boolean;
  /** Node IoT theo nhà (serial, khu vực, …). */
  iotNodes: IotNodeDeviceFromApi[];
  isLoading: boolean;
}

export function useTenantContext(): TenantContextValue {
  const { houseId: authHouseId } = useAuthStore();
  const { data: housesData, isLoading } = useTenantHouses();
  const rawData = housesData?.data;
  const tenantHouses: HouseFromApi[] = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === "object"
      ? [rawData as HouseFromApi]
      : [];

  const house = useMemo<HouseFromApi | null>(() => {
    if (!tenantHouses.length) return null;
    if (authHouseId) {
      return tenantHouses.find((h) => h.id === authHouseId) ?? null;
    }
    if (tenantHouses.length === 1) return tenantHouses[0]!;
    return null;
  }, [tenantHouses, authHouseId]);

  const houseId = house?.id ?? null;

  const { data: iotData, isLoading: thingLoading } = useIotDevicesByHouseId(
    houseId ?? ""
  );

  const { data: areasData } = useFunctionalAreasByHouseId(houseId ?? "");

  const thingId = useMemo<string>(() => {
    const ctrl = iotData?.data;
    const name = ctrl?.thingName?.trim();
    if (name) return name;
    return TENANT_IOT_THING_ID;
  }, [iotData]);

  const iotNodes = useMemo<IotNodeDeviceFromApi[]>(
    () => iotData?.data?.devices ?? [],
    [iotData]
  );

  const functionalAreas = useMemo<FunctionalAreaFromApi[]>(() => {
    const list = areasData?.data;
    if (Array.isArray(list)) return list;
    const embedded = house?.functionalAreas ?? [];
    return Array.isArray(embedded) ? embedded : [];
  }, [areasData, house?.functionalAreas]);

  return {
    house,
    houseId,
    functionalAreas,
    thingId,
    thingLoading,
    iotNodes,
    isLoading,
  };
}
