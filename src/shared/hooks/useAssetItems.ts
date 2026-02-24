import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssetItems,
  createAssetItem,
  updateAssetItem,
  deleteAssetItem,
} from "../services/assetItemApi";
import type {
  AssetItemsApiResponse,
  CreateAssetItemRequest,
  UpdateAssetItemRequest,
} from "../types/api";
import type { AssetItemsParams } from "../services/assetItemApi";

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
 * Mục tiêu: mọi nơi dùng chung 1 cách đặt key để cache/invalidate chính xác.
 */
export const ASSET_ITEM_KEYS = {
  base: ["assetItems"] as const,
  /**
   * Key khi chỉ filter theo category (ví dụ tab "Tất cả thiết bị" trên Staff Home).
   * - categoryId = null/undefined => lấy tất cả.
   */
  byCategory: (categoryId: string | null | undefined) =>
    [...ASSET_ITEM_KEYS.base, "byCategory", categoryId ?? null] as const,
  /**
   * Key khi filter theo houseId (và có thể kèm categoryId).
   * - Dùng cho màn BuildingDetail: luôn có houseId.
   */
  byHouse: (houseId: string, categoryId?: string | null) =>
    [...ASSET_ITEM_KEYS.base, "byHouse", houseId, categoryId ?? null] as const,
};

/**
 * Hook dùng React Query để lấy danh sách thiết bị (asset items).
 *
 * Cách dùng:
 * - Chỉ filter theo category:
 *   `useAssetItems({ categoryId: selectedCategoryId })`
 * - Filter theo house:
 *   `useAssetItems({ houseId })`
 * - Filter cả house + category:
 *   `useAssetItems({ houseId, categoryId })`
 */
export const useAssetItems = (params: UseAssetItemsParams = {}) => {
  const { houseId, categoryId } = params;

  // Chọn queryKey phù hợp với loại filter.
  const queryKey = houseId
    ? ASSET_ITEM_KEYS.byHouse(houseId, categoryId)
    : ASSET_ITEM_KEYS.byCategory(categoryId);

  return useQuery<AssetItemsApiResponse, unknown, AssetItemsApiResponse, ReturnType<typeof ASSET_ITEM_KEYS.byCategory> | ReturnType<typeof ASSET_ITEM_KEYS.byHouse>>({
    queryKey,
    queryFn: () =>
      getAssetItems({
        houseId,
        categoryId: (categoryId ?? undefined) as AssetItemsParams["categoryId"],
      }),
  });
};

/** Invalidate mọi query asset items (list, byHouse, byCategory) sau khi create/update/delete. */
const invalidateAllAssetItems = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ASSET_ITEM_KEYS.base });
};

export const useCreateAssetItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetItemRequest) => createAssetItem(payload),
    onSuccess: () => invalidateAllAssetItems(queryClient),
  });
};

export const useUpdateAssetItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssetItemRequest }) =>
      updateAssetItem(id, payload),
    onSuccess: () => invalidateAllAssetItems(queryClient),
  });
};

export const useDeleteAssetItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssetItem(id),
    onSuccess: () => invalidateAllAssetItems(queryClient),
  });
};

