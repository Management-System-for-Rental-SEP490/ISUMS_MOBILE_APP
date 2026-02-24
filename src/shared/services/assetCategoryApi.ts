/**
 * API liên quan đến danh mục thiết bị (asset categories).
 * GET /api/asset/categories, POST, PUT /api/asset/categories/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type {
  AssetCategoriesApiResponse,
  CreateAssetCategoryRequest,
  CreateAssetCategoryApiResponse,
  UpdateAssetCategoryRequest,
  UpdateAssetCategoryApiResponse,
} from "../types/api";

/**
 * Lấy danh sách danh mục thiết bị / loại sản phẩm (GET /api/asset/categories).
 * Dùng cho dropdown chọn loại thiết bị, thanh filter, v.v.
 * @returns Promise<AssetCategoriesApiResponse> - data là mảng AssetCategoryFromApi.
 */
export const getAssetCategories = async (): Promise<AssetCategoriesApiResponse> => {
  const response = await axiosClient.get<AssetCategoriesApiResponse>(
    `${BACKEND_API_BASE}/asset/categories`
  );
  return response.data;
};

/**
 * Tạo danh mục thiết bị mới (POST /api/asset/categories).
 * Gửi name, compensationPercent, description; BE trả về danh mục vừa tạo (có id).
 * @param payload - Đối tượng CreateAssetCategoryRequest (name, compensationPercent, description).
 * @returns Promise<CreateAssetCategoryApiResponse> - data là danh mục vừa tạo, statusCode 201.
 */
export const createAssetCategory = async (
  payload: CreateAssetCategoryRequest
): Promise<CreateAssetCategoryApiResponse> => {
  const response = await axiosClient.post<CreateAssetCategoryApiResponse>(
    `${BACKEND_API_BASE}/asset/categories`,
    payload
  );
  return response.data;
};

/**
 * Cập nhật danh mục thiết bị (PUT /api/asset/categories/:id).
 * @param id - ID danh mục cần cập nhật (trong URL).
 * @param payload - name, compensationPercent, description.
 */
export const updateAssetCategory = async (
  id: string,
  payload: UpdateAssetCategoryRequest
): Promise<UpdateAssetCategoryApiResponse> => {
  const response = await axiosClient.put<UpdateAssetCategoryApiResponse>(
    `${BACKEND_API_BASE}/asset/categories/${id}`,
    payload
  );
  return response.data;
};

