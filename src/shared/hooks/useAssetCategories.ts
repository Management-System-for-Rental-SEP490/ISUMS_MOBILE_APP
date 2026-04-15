import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getAssetCategories, getAssetCategoryById } from "../services/assetCategoryApi";
import type {
  AssetCategoryByIdApiResponse,
  AssetCategoryFromApi,
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
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: [...ASSET_CATEGORY_KEYS.all, i18n.language],
    queryFn: getAssetCategories,
    refetchOnMount: "always",
  });
};

/**
 * Lấy tên category theo `categoryId`.
 * - Dùng cho các màn chỉ có categoryId (không đủ danh sách categories để map name).
 */
export const useAssetCategoryById = (categoryId?: string | null) => {
  const { i18n } = useTranslation();
  const safeCategoryId = categoryId ?? null;
  return useQuery<AssetCategoryByIdApiResponse>({
    queryKey: safeCategoryId
      ? ([...ASSET_CATEGORY_KEYS.byId(safeCategoryId), i18n.language] as const)
      : ([...ASSET_CATEGORY_KEYS.all, "byId", "none", i18n.language] as const),
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
 * Map categoryId → tên: ưu tiên danh sách từ `useAssetCategories`, các id thiếu gọi GET /categories/:id (useQueries).
 * Dùng Home tenant thay vì gọi `useQueries` trực tiếp trong screen.
 */
export const useAssetCategoryNamesByIds = (
  categoryIds: string[],
  categoriesFromList: AssetCategoryFromApi[]
) => {
  const { i18n } = useTranslation();
  const missingIds = useMemo(
    () =>
      Array.from(new Set(categoryIds.filter(Boolean))).filter(
        (id) => !categoriesFromList.some((c) => c.id === id)
      ),
    [categoryIds, categoriesFromList]
  );

  const queries = useQueries({
    queries: missingIds.map((id) => ({
      queryKey: [...ASSET_CATEGORY_KEYS.byId(id), i18n.language],
      queryFn: () => getAssetCategoryById(id),
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 5,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categoriesFromList) {
      if (c.id && c.name) map.set(c.id, c.name);
    }
    for (let i = 0; i < missingIds.length; i++) {
      const id = missingIds[i];
      const name = queries[i]?.data?.data?.name;
      if (id && name) map.set(id, name);
    }
    return map;
  }, [categoriesFromList, missingIds, queries]);

  return { categoryNameById };
};
