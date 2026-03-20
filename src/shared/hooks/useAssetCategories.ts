import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssetCategories,
  getAssetCategoryById,
  createAssetCategory,
  updateAssetCategory,
} from "../services/assetCategoryApi";
import type {
  CreateAssetCategoryRequest,
  UpdateAssetCategoryRequest,
  AssetCategoryByIdApiResponse,
} from "../types/api";

/**
 * Hook dùng React Query để lấy danh sách danh mục thiết bị (asset categories).
 *
 * - Dùng cho dropdown chọn loại thiết bị, thanh filter category, v.v.
 * - refetchOnMount: "always" để mỗi lần vào màn có dùng categories đều gọi lại API,
 *   tránh hiển thị "Khác" do cache cũ khi BE đã có danh mục (IoT, Furniture, IT Equipment...).
 */
export const ASSET_CATEGORY_KEYS = {
  /** Key gốc cho queries về asset categories. */
  all: ["assetCategories"] as const,
  /** Key cho query lấy 1 category theo id. */
  byId: (id: string) => [...ASSET_CATEGORY_KEYS.all, "byId", id] as const,
};

export const useAssetCategories = () => {
  return useQuery({
    queryKey: ASSET_CATEGORY_KEYS.all,
    queryFn: getAssetCategories,
    refetchOnMount: "always",
  });
};

/**
 * Lấy tên category theo `categoryId`.
 * - Dùng cho các màn chỉ có categoryId (không đủ danh sách categories để map name).
 */
export const useAssetCategoryById = (categoryId?: string | null) => {
  const safeCategoryId = categoryId ?? null;
  return useQuery<AssetCategoryByIdApiResponse>({
    queryKey: safeCategoryId ? ASSET_CATEGORY_KEYS.byId(safeCategoryId) : [...ASSET_CATEGORY_KEYS.all, "byId", "none"] as const,
    queryFn: () =>
      safeCategoryId
        ? getAssetCategoryById(safeCategoryId)
        : Promise.reject(new Error("Missing categoryId")),
    enabled: Boolean(safeCategoryId),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook mutation để tạo danh mục thiết bị mới (POST /api/assets/categories).
 * Sau khi tạo thành công, tự động invalidate danh sách categories để refetch.
 * @returns useMutation: mutate(payload), isPending, isSuccess, isError, data, error.
 */
export const useCreateAssetCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetCategoryRequest) => createAssetCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_CATEGORY_KEYS.all });
    },
  });
};

/**
 * Hook mutation cập nhật danh mục (PUT /api/assets/categories/:id).
 * Sau khi thành công invalidate danh sách categories.
 */
export const useUpdateAssetCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAssetCategoryRequest;
    }) => updateAssetCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSET_CATEGORY_KEYS.all });
    },
  });
};

