/**
 * API lấy danh sách nhà (houses) từ Backend chung.
 * Dùng axiosClient để tự động gắn Bearer token (từ useAuthStore)
 * và xử lý refresh token khi 401.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import { mapTenantAccessItemToHouse } from "../utils/tenantAccess";
import type {
  ApiResponse,
  FunctionalAreaFromApi,
  HouseFromApi,
  HouseIotAlertsApiResponse,
  HousesApiResponse,
  TenantHouseAccessApiResponse,
} from "../types/api";

/**
 * Lấy danh sách TẤT CẢ căn nhà (GET /api/houses).
 * Dùng cho luồng Staff (quản lý nhiều nhà).
 * Request tự động có header Authorization: Bearer <access_token> nhờ interceptor của axiosClient.
 * @returns Promise<HousesApiResponse> - data là mảng HouseFromApi, success/message/statusCode từ BE.
 */
export const getHouses = async (): Promise<HousesApiResponse> => {
  const response = await axiosClient.get<HousesApiResponse>(
    `${BACKEND_API_BASE}/houses`
  );
  return response.data;
};

/**
 * Lấy danh sách nhà + trạng thái truy cập tenant (GET /api/houses/my-access).
 * Thay thế endpoint cũ `/houses/house`. BE đọc user từ Bearer token.
 */
export const getTenantHouses = async (): Promise<HousesApiResponse> => {
  const response = await axiosClient.get<TenantHouseAccessApiResponse>(
    `${BACKEND_API_BASE}/houses/my-access`
  );
  const body = response.data;
  const rows = Array.isArray(body.data) ? body.data : [];
  return {
    message: body.message,
    statusCode: body.statusCode,
    success: body.success,
    data: rows.map(mapTenantAccessItemToHouse),
  };
};

/**
 * Chi tiết một căn theo id (GET /api/houses/{id}) — dùng khi có `houseId` trên hóa đơn/hợp đồng
 * nhưng căn không còn trong my-access (lấy `name` hiển thị).
 * Lỗi mạng/403/404: trả `null`, không ném exception.
 */
export const getHouseById = async (houseId: string): Promise<ApiResponse<HouseFromApi> | null> => {
  const id = String(houseId ?? "").trim();
  if (!id) return null;
  try {
    const response = await axiosClient.get<ApiResponse<HouseFromApi>>(
      `${BACKEND_API_BASE}/houses/${encodeURIComponent(id)}`
    );
    return response.data;
  } catch {
    return null;
  }
};

/**
 * Lấy danh sách khu vực chức năng theo houseId (GET /api/houses/functionalAreas/{houseId}).
 */
export const getFunctionalAreasByHouseId = async (
  houseId: string
): Promise<ApiResponse<FunctionalAreaFromApi[]>> => {
  const url = `${BACKEND_API_BASE}/houses/functionalAreas/${encodeURIComponent(
    houseId
  )}`;
  const response =
    await axiosClient.get<ApiResponse<FunctionalAreaFromApi[]>>(url);
  return response.data;
};

export type HouseIotAlertsQueryParams = {
  limit: number;
  date: string;
  /** Trang đầu không gửi; các trang sau dùng cursor từ response trước. */
  cursor?: string | null;
};

/**
 * Lịch sử cảnh báo IoT theo nhà và ngày (GET /api/assets/houses/{houseId}/iot/alerts).
 */
export const getHouseIotAlerts = async (
  houseId: string,
  params: HouseIotAlertsQueryParams
): Promise<HouseIotAlertsApiResponse> => {
  const sp = new URLSearchParams();
  sp.set("limit", String(params.limit));
  sp.set("date", params.date);
  const c = params.cursor;
  if (c) sp.set("cursor", c);
  const url = `${BACKEND_API_BASE}/assets/houses/${encodeURIComponent(
    houseId
  )}/iot/alerts?${sp.toString()}`;
  // const url = `https://api-dev.isums.pro/api/assets/houses/${encodeURIComponent(
  //   houseId
  // )}/iot/alerts?${sp.toString()}`;
  const response = await axiosClient.get<HouseIotAlertsApiResponse>(url);
  return response.data;
};

