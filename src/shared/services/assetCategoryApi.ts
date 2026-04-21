/**
 * API liên quan đến danh mục thiết bị (asset categories).
 * GET /api/assets/categories, POST, PUT /api/assets/categories/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import {
  mergeTranslationMapsFromApi,
  resolveLocalizedApiFieldFromI18n,
} from "../utils/resolveLocalizedJsonString";
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
    data: body.data.map((c) => {
      const nameRaw =
        c.nameRaw != null ? String(c.nameRaw) : c.name != null ? String(c.name) : "";
      const descriptionRaw =
        c.descriptionRaw != null
          ? String(c.descriptionRaw)
          : c.description != null
            ? String(c.description)
            : "";
      const r = c as typeof c & {
        name_translations?: Record<string, unknown>;
        description_translations?: Record<string, unknown>;
      };
      const nameTranslations = mergeTranslationMapsFromApi(
        r.nameTranslations as Record<string, unknown> | undefined,
        r.name_translations
      );
      const descriptionTranslations = mergeTranslationMapsFromApi(
        r.descriptionTranslations as Record<string, unknown> | undefined,
        r.description_translations
      );
      return {
        ...c,
        nameRaw,
        descriptionRaw,
        name: resolveLocalizedApiFieldFromI18n(c.name, nameTranslations),
        description: resolveLocalizedApiFieldFromI18n(c.description, descriptionTranslations),
      };
    }),
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
  const nameRaw =
    c.nameRaw != null ? String(c.nameRaw) : c.name != null ? String(c.name) : "";
  const descriptionRaw =
    c.descriptionRaw != null
      ? String(c.descriptionRaw)
      : c.description != null
        ? String(c.description)
        : "";
  const r = c as typeof c & {
    name_translations?: Record<string, unknown>;
    description_translations?: Record<string, unknown>;
  };
  const nameTranslations = mergeTranslationMapsFromApi(
    r.nameTranslations as Record<string, unknown> | undefined,
    r.name_translations
  );
  const descriptionTranslations = mergeTranslationMapsFromApi(
    r.descriptionTranslations as Record<string, unknown> | undefined,
    r.description_translations
  );
  return {
    ...body,
    data: {
      ...c,
      nameRaw,
      descriptionRaw,
      name: resolveLocalizedApiFieldFromI18n(c.name, nameTranslations),
      description: resolveLocalizedApiFieldFromI18n(c.description, descriptionTranslations),
    },
  };
};

