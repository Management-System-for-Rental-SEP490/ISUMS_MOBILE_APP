/**
 * API liên quan đến danh mục thiết bị (asset categories).
 * GET /api/assets/categories, POST, PUT /api/assets/categories/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE, BACKEND_URL_FALLBACK } from "../api/config";
import type {
  AssetCategoriesApiResponse,
  AssetCategoryByIdApiResponse,
  CreateAssetCategoryRequest,
  CreateAssetCategoryApiResponse,
  UpdateAssetCategoryRequest,
  UpdateAssetCategoryApiResponse,
} from "../types/api";

/**
 * Lấy danh sách danh mục thiết bị / loại sản phẩm (GET /api/assets/categories).
 * Dùng cho dropdown chọn loại thiết bị, thanh filter, v.v.
 * @returns Promise<AssetCategoriesApiResponse> - data là mảng AssetCategoryFromApi.
 */
export const getAssetCategories = async (): Promise<AssetCategoriesApiResponse> => {
  const response = await axiosClient.get<AssetCategoriesApiResponse>(
    `${ BACKEND_URL_FALLBACK}/assets/categories`
  );
  return response.data;
};

/**
 * Lấy danh mục theo id (GET /api/assets/categories/:id).
 * Dùng khi FE chỉ có `categoryId` và không muốn phụ thuộc vào danh sách categories tải được đủ hay không.
 */
export const getAssetCategoryById = async (
  categoryId: string
): Promise<AssetCategoryByIdApiResponse> => {
  const response = await axiosClient.get<AssetCategoryByIdApiResponse>(
    `${ BACKEND_URL_FALLBACK}/assets/categories/${encodeURIComponent(categoryId)}`
  );
  return response.data;
};

/**
 * Tạo danh mục thiết bị mới (POST /api/assets/categories).
 * Gửi name, compensationPercent, description; BE trả về danh mục vừa tạo (có id).
 * @param payload - Đối tượng CreateAssetCategoryRequest (name, compensationPercent, description).
 * @returns Promise<CreateAssetCategoryApiResponse> - data là danh mục vừa tạo, statusCode 201.
 */
export const createAssetCategory = async (
  payload: CreateAssetCategoryRequest
): Promise<CreateAssetCategoryApiResponse> => {
  const response = await axiosClient.post<CreateAssetCategoryApiResponse>(
    `${ BACKEND_URL_FALLBACK}/assets/categories`,
    payload
  );
  return response.data;
};

/**
 * Cập nhật danh mục thiết bị (PUT /api/assets/categories/:id).
 * @param id - ID danh mục cần cập nhật (trong URL).
 * @param payload - name, compensationPercent, description.
 */
export const updateAssetCategory = async (
  id: string,
  payload: UpdateAssetCategoryRequest
): Promise<UpdateAssetCategoryApiResponse> => {
  const response = await axiosClient.put<UpdateAssetCategoryApiResponse>(
    `${ BACKEND_URL_FALLBACK}/assets/categories/${id}`,
    payload
  );
  return response.data;
};

