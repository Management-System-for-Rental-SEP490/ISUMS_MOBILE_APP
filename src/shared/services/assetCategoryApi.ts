/**
 * API liên quan đến danh mục thiết bị (asset categories).
 * GET /api/assets/categories, POST, PUT /api/assets/categories/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import { resolveLocalizedJsonStringFromI18n } from "../utils/resolveLocalizedJsonString";
import type {
  AssetCategoriesApiResponse,
  AssetCategoryByIdApiResponse,
} from "../types/api";

/**
 * Lấy danh sách danh mục thiết bị / loại sản phẩm (GET /api/assets/categories).
 * Dùng cho dropdown chọn loại thiết bị, thanh filter, v.v.
 * @returns Promise<AssetCategoriesApiResponse> - data là mảng AssetCategoryFromApi.
 */
export const getAssetCategories = async (): Promise<AssetCategoriesApiResponse> => {
  const response = await axiosClient.get<AssetCategoriesApiResponse>(
    `${BACKEND_API_BASE}/assets/categories`
  );
  const body = response.data;
  if (!body?.data || !Array.isArray(body.data)) return body;
  return {
    ...body,
    data: body.data.map((c) => ({
      ...c,
      name: resolveLocalizedJsonStringFromI18n(c.name),
      description: resolveLocalizedJsonStringFromI18n(c.description),
    })),
  };
};

/**
 * Lấy danh mục theo id (GET /api/assets/categories/:id).
 * Dùng khi FE chỉ có `categoryId` và không muốn phụ thuộc vào danh sách categories tải được đủ hay không.
 */
export const getAssetCategoryById = async (
  categoryId: string
): Promise<AssetCategoryByIdApiResponse> => {
  const response = await axiosClient.get<AssetCategoryByIdApiResponse>(
    `${BACKEND_API_BASE}/assets/categories/${encodeURIComponent(categoryId)}`
  );
  const body = response.data;
  if (!body?.data) return body;
  const c = body.data;
  return {
    ...body,
    data: {
      ...c,
      name: resolveLocalizedJsonStringFromI18n(c.name),
      description: resolveLocalizedJsonStringFromI18n(c.description),
    },
  };
};

