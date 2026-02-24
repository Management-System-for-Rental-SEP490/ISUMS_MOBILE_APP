/**
 * API liên quan đến thiết bị (asset items).
 * GET /api/asset/items, POST, PUT, DELETE /api/asset/items/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type {
  AssetItemsApiResponse,
  CreateAssetItemRequest,
  CreateAssetItemApiResponse,
  UpdateAssetItemRequest,
  UpdateAssetItemApiResponse,
} from "../types/api";

/** Tham số filter cho GET /api/asset/items (tùy chọn theo nhà và/hoặc danh mục). */
export type AssetItemsParams = {
  /** Lọc theo ID căn nhà. */
  houseId?: string;
  /** Lọc theo ID danh mục thiết bị. */
  categoryId?: string;
};

/**
 * Lấy danh sách thiết bị (GET /api/asset/items), có thể lọc theo houseId và/hoặc categoryId.
 * @param params - houseId, categoryId (optional); không truyền = lấy tất cả.
 * @returns Promise<AssetItemsApiResponse> - data là mảng AssetItemFromApi.
 */
export const getAssetItems = async (
  params?: AssetItemsParams
): Promise<AssetItemsApiResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.houseId) searchParams.set("houseId", params.houseId);
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);

  const query = searchParams.toString();
  const url = query
    ? `${BACKEND_API_BASE}/asset/items?${query}`
    : `${BACKEND_API_BASE}/asset/items`;

  const response = await axiosClient.get<AssetItemsApiResponse>(url);
  return response.data;
};

/**
 * Tạo thiết bị mới (POST /api/asset/items).
 */
export const createAssetItem = async (
  payload: CreateAssetItemRequest
): Promise<CreateAssetItemApiResponse> => {
  const response = await axiosClient.post<CreateAssetItemApiResponse>(
    `${BACKEND_API_BASE}/asset/items`,
    payload
  );
  return response.data;
};

/**
 * Cập nhật thiết bị (PUT /api/asset/items/:id).
 */
export const updateAssetItem = async (
  id: string,
  payload: UpdateAssetItemRequest
): Promise<UpdateAssetItemApiResponse> => {
  const response = await axiosClient.put<UpdateAssetItemApiResponse>(
    `${BACKEND_API_BASE}/asset/items/${id}`,
    payload
  );
  return response.data;
};

/**
 * Xóa thiết bị (DELETE /api/asset/items/:id).
 */
export const deleteAssetItem = async (id: string): Promise<{ success: boolean; message?: string }> => {
  const response = await axiosClient.delete<{ success: boolean; message?: string }>(
    `${BACKEND_API_BASE}/asset/items/${id}`
  );
  return response.data;
};

