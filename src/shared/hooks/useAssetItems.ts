import { useQuery } from "@tanstack/react-query";
import {
  getAssetItems,
  getAssetItemsByHouseId,
  getIotDevicesByHouseId,
} from "../services/assetItemApi";
import type {
  AssetItemsApiResponse,
  AssetItemsParams,
  IotDevicesByHouseApiResponse,
} from "../types/api";

/**
 * Tham số cho hook useAssetItems.
 * - `houseId`: lọc thiết bị theo nhà.
 * - `categoryId`: lọc thiết bị theo danh mục (string hoặc null).
 */
export type UseAssetItemsParams = {
  houseId?: string;
  categoryId?: string | null;
};

/**
 * Định nghĩa chuẩn key cho React Query khi làm việc với asset items.
 */
export const ASSET_ITEM_KEYS = {
  base: ["assetItems"] as const,
  byCategory: (categoryId: string | null | undefined) =>
    [...ASSET_ITEM_KEYS.base, "byCategory", categoryId ?? null] as const,
  byHouse: (houseId: string, categoryId?: string | null) =>
    [...ASSET_ITEM_KEYS.base, "byHouse", houseId, categoryId ?? null] as const,
};

/**
 * Key cache IoT theo nhà (tách khỏi assetItems).
 */
export const IOT_DEVICE_KEYS = {
  base: ["iotDevices"] as const,
  byHouse: (houseId: string) => [...IOT_DEVICE_KEYS.base, "byHouse", houseId] as const,
};

/**
 * Danh sách thiết bị (GET). Tenant: thường dùng kèm `houseId`.
 */
export const useAssetItems = (params: UseAssetItemsParams = {}) => {
  const { houseId, categoryId } = params;

  const queryKey = houseId
    ? ASSET_ITEM_KEYS.byHouse(houseId, categoryId)
    : ASSET_ITEM_KEYS.byCategory(categoryId);

  return useQuery<
    AssetItemsApiResponse,
    unknown,
    AssetItemsApiResponse,
    ReturnType<typeof ASSET_ITEM_KEYS.byCategory> | ReturnType<typeof ASSET_ITEM_KEYS.byHouse>
  >({
    queryKey,
    queryFn: async () => {
      if (houseId) {
        const res = await getAssetItemsByHouseId(houseId);
        if (categoryId && res.data) {
          res.data = res.data.filter((item) => item.categoryId === categoryId);
        }
        return res;
      }
      return getAssetItems({
        categoryId: (categoryId ?? undefined) as AssetItemsParams["categoryId"],
      });
    },
  });
};

/**
 * Controller + node IoT theo nhà (GET /api/assets/iot-devices/house/{houseId}).
 */
export const useIotDevicesByHouseId = (houseId: string) => {
  return useQuery<IotDevicesByHouseApiResponse>({
    queryKey: IOT_DEVICE_KEYS.byHouse(houseId),
    queryFn: () => getIotDevicesByHouseId(houseId),
    enabled: Boolean(houseId),
  });
};
