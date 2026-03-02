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
  AttachAssetTagRequest,
  AttachAssetTagApiResponse,
  DetachAssetTagApiResponse,
  GetAssetByTagValueApiResponse,
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
 * Chuẩn hóa tagValue trước khi gửi lên BE.
 * - Giữ nguyên cấu trúc có khoảng trắng giữa các byte (\"04 9C 59 A2 ...\")
 * - Chỉ trim hai đầu, KHÔNG xóa khoảng trắng, KHÔNG tự ý đổi format.
 * Lý do: BE chấp nhận ID thẻ NFC với hoặc không với khoảng trắng, và logic so khớp nằm phía BE.
 */
const normalizeTagValueForApi = (raw: string) => raw.trim();

/**
 * Chuẩn hóa tagValue để so sánh trên FE (fallback).
 * - Bỏ hết khoảng trắng và chuyển sang UPPERCASE.
 * - Dùng khi cần so sánh hai mã NFC bất kể đang được lưu dính liền hay có khoảng trắng.
 */
const normalizeTagValueForCompare = (raw: string) =>
  raw.replace(/\s+/g, "").toUpperCase();

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
 * Lấy chi tiết thiết bị theo ID (GET /api/asset/items/:id).
 */
export const getAssetItemById = async (id: string): Promise<AssetItemFromApi | undefined> => {
  try {
    const response = await axiosClient.get<UpdateAssetItemApiResponse>(
      `${BACKEND_API_BASE}/asset/items/${id}`
    );
    // Response thường trả về { data: item, ... } hoặc { ...item } tùy BE,
    // nhưng ở trên updateAssetItem trả về UpdateAssetItemApiResponse (có data).
    // Giả sử GET cũng trả về cấu trúc tương tự.
    return response.data.data;
  } catch (error) {
    console.log("Lỗi lấy chi tiết thiết bị:", error);
    return undefined;
  }
};


export const getAssetItemByNfcId = async (
  nfcId: string
): Promise<AssetItemFromApi | undefined> => {
  const normalized = nfcId.trim(); 
  if (!normalized) return undefined;
  const apiTagValue = normalizeTagValueForApi(normalized);

  try {
    // Gọi API mới: GET /api/asset/tags/asset/{tagValue}
    const response = await axiosClient.get<GetAssetByTagValueApiResponse>(
      `${BACKEND_API_BASE}/asset/tags/asset/${encodeURIComponent(apiTagValue)}`
    );
    
    // Xử lý response.data.data có thể là Object (theo Postman) hoặc Array (theo code cũ)
    const responseData = response.data.data;
    
    let raw: AssetItemFromApi | undefined;

    if (Array.isArray(responseData)) {
      raw = responseData[0];
    } else if (responseData && typeof responseData === "object") {
      // BE trả về object
      raw = responseData as AssetItemFromApi;
    }

    if (!raw) return undefined;

    // Đảm bảo FE luôn có nfcTag để hiển thị dù BE có thể trả null.
    return {
      ...raw,
      nfcTag: raw.nfcTag ?? apiTagValue,
    };
  } catch (error) {
    console.log("Lỗi gọi GET /asset/tags/asset/{tagValue}, fallback getAssetItems:", error);
    try {
      const res = await getAssetItems();
      const found = res.data.find(
        (d) =>
          normalizeTagValueForCompare(d.nfcTag || "") ===
          normalizeTagValueForCompare(apiTagValue)
      );
      return found ?? undefined;
    } catch (e2) {
      console.log("Lỗi fallback GET /asset/items khi tìm theo NFC:", e2);
      return undefined;
    }
  }
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
        nfc_tag: payload.nfcTag,
        condition_percent: payload.conditionPercent,
        status: payload.status,
      }
    : {
        houseId: payload.houseId,
        categoryId: payload.categoryId,
        displayName: payload.displayName,
        serialNumber: payload.serialNumber,
        nfcTag: payload.nfcTag,
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
 * Đổi nhà cho thiết bị (PUT /api/asset/items/:id/transfer).
 * Body: { newHouseId }. BE sẽ cập nhật houseId và trả lại thiết bị sau khi chuyển.
 */
export const transferAssetItemHouse = async (
  id: string,
  newHouseId: string
): Promise<UpdateAssetItemApiResponse> => {
  const response = await axiosClient.put<UpdateAssetItemApiResponse>(
    `${BACKEND_API_BASE}/asset/items/${id}/transfer`,
    { newHouseId }
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

/**
 * Gán một tag NFC vào thiết bị (POST /api/asset/tags).
 * BE tạo bản ghi tag và liên kết với asset item; response 201 khi thành công.
 * @param payload - assetId (ID thiết bị), tagValue (mã NFC đọc từ thẻ), tagType: "NFC".
 */
export const attachAssetTag = async (
  payload: AttachAssetTagRequest
): Promise<AttachAssetTagApiResponse> => {
  const response = await axiosClient.post<AttachAssetTagApiResponse>(
    `${BACKEND_API_BASE}/asset/tags`,
    {
      ...payload,
      tagValue: normalizeTagValueForApi(payload.tagValue),
    }
  );
  return response.data;
};

/**
 * Gỡ tag NFC khỏi thiết bị (PUT /api/asset/tags/detach/{tagValue}).
 * @param tagValue - Giá trị mã NFC (tagValue) cần gỡ.
 */
export const detachAssetTag = async (
  tagValue: string
): Promise<DetachAssetTagApiResponse> => {
  const normalized = normalizeTagValueForApi(tagValue.trim());
  const response = await axiosClient.put<DetachAssetTagApiResponse>(
    `${BACKEND_API_BASE}/asset/tags/detach/${encodeURIComponent(normalized)}`
  );
  return response.data;
};

