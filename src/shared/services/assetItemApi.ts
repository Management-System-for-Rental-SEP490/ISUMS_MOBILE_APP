/**
 * API liên quan đến thiết bị (asset items).
 * GET /api/asset/items, POST, PUT, DELETE /api/asset/items/:id.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type {
  AssetItemFromApi,
  AssetItemsApiResponse,
  CreateAssetItemRequest,
  CreateAssetItemApiResponse,
  UpdateAssetItemRequest,
  UpdateAssetItemApiResponse,
} from "../types/api";

/** Tham số filter cho GET /api/asset/items (tùy chọn theo nhà, danh mục, hoặc NFC). */
export type AssetItemsParams = {
  /** Lọc theo ID căn nhà. */
  houseId?: string;
  /** Lọc theo ID danh mục thiết bị. */
  categoryId?: string;
  /** Lọc theo mã NFC đã gán (thường trả về tối đa 1 thiết bị). Một số BE hỗ trợ query ?nfcId=xxx. */
  nfcId?: string;
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
  if (params?.nfcId) searchParams.set("nfcId", params.nfcId);

  const query = searchParams.toString();
  const url = query
    ? `${BACKEND_API_BASE}/asset/items?${query}`
    : `${BACKEND_API_BASE}/asset/items`;

  const response = await axiosClient.get<AssetItemsApiResponse>(url);
  return response.data;
};

/**
 * Tìm thiết bị theo mã NFC đã gán.
 * Gọi GET /api/asset/items lấy TOÀN BỘ danh sách, sau đó filter theo nfcId ở phía FE.
 * Lý do: tránh phụ thuộc vào việc BE có implement đúng query ?nfcId hay không.
 * @param nfcId - Mã NFC đã đọc từ thẻ (có thể có khoảng trắng, ví dụ "04 9C 59 A2 B2 19 90").
 * @returns Promise<AssetItemFromApi | undefined> - Thiết bị tương ứng hoặc undefined nếu chưa gán.
 */
export const getAssetItemByNfcId = async (
  nfcId: string
): Promise<AssetItemFromApi | undefined> => {
  const normalized = nfcId.trim();
  const res = await getAssetItems();
  const found = res.data.find(
    (d) => (d.nfcId || "").trim() === normalized
  );
  return found ?? undefined;
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

/** Gửi body PUT asset item dạng snake_case (house_id, category_id...) — bật bằng EXPO_PUBLIC_ASSET_PUT_BODY_SNAKE_CASE=true */
const useSnakeCasePutBody =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_ASSET_PUT_BODY_SNAKE_CASE === "true";

/**
 * Cập nhật thiết bị (PUT /api/asset/items/:id).
 * Body đủ 7 trường. Mặc định camelCase; nếu EXPO_PUBLIC_ASSET_PUT_BODY_SNAKE_CASE=true thì gửi snake_case.
 * Backend phải map cả houseId/house_id và categoryId/category_id thì mới cập nhật được nhà/danh mục.
 */
export const updateAssetItem = async (
  id: string,
  payload: UpdateAssetItemRequest
): Promise<UpdateAssetItemApiResponse> => {
  const body = useSnakeCasePutBody
    ? {
        house_id: payload.houseId,
        category_id: payload.categoryId,
        display_name: payload.displayName,
        serial_number: payload.serialNumber,
        nfc_id: payload.nfcId ?? "",
        condition_percent: payload.conditionPercent,
        status: payload.status,
      }
    : {
        houseId: payload.houseId,
        categoryId: payload.categoryId,
        displayName: payload.displayName,
        serialNumber: payload.serialNumber,
        nfcId: payload.nfcId ?? "",
        conditionPercent: payload.conditionPercent,
        status: payload.status,
      };
  const response = await axiosClient.put<UpdateAssetItemApiResponse>(
    `${BACKEND_API_BASE}/asset/items/${id}`,
    body
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

