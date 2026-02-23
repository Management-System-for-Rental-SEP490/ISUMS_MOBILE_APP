/**
 * API lấy danh sách nhà (houses) và danh mục thiết bị (asset categories) từ Backend chung.
 * Dùng axiosClient để tự động gắn Bearer token (từ useAuthStore) và xử lý refresh token khi 401.
 */
import axiosClient from "../api/axiosClient";
import type { HousesApiResponse, AssetCategoriesApiResponse } from "../types";

/** Base URL của Backend API (houses, asset/categories, items, event, images). Có thể chuyển sang EXPO_PUBLIC_HOUSES_API_BASE. */
const API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_HOUSES_API_BASE
    ? process.env.EXPO_PUBLIC_HOUSES_API_BASE
    : "https://unrestrictable-lan-syzygial.ngrok-free.dev/api";

/**
 * Lấy danh sách tất cả căn nhà (GET /api/houses).
 * Request tự động có header Authorization: Bearer <access_token> nhờ interceptor của axiosClient.
 * @returns Promise<HousesApiResponse> - data là mảng HouseFromApi, success/message/statusCode từ BE
 */
export const getHouses = async (): Promise<HousesApiResponse> => {
  const response = await axiosClient.get<HousesApiResponse>(
    `${API_BASE}/houses`
  );
  return response.data;
};

/**
 * Lấy danh sách danh mục thiết bị / loại sản phẩm (GET /api/asset/categories).
 * Dùng cho dropdown chọn loại thiết bị, màn cấu hình, v.v.
 * @returns Promise<AssetCategoriesApiResponse> - data là mảng AssetCategoryFromApi (id, name, compensationPercent, description)
 */
export const getAssetCategories = async (): Promise<AssetCategoriesApiResponse> => {
  const response = await axiosClient.get<AssetCategoriesApiResponse>(
    `${API_BASE}/asset/categories`
  );
  return response.data;
};
