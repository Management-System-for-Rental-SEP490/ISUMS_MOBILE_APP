/**
 * API lấy danh sách nhà (houses) từ Backend chung.
 * Dùng axiosClient để tự động gắn Bearer token (từ useAuthStore)
 * và xử lý refresh token khi 401.
 */
import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE, BACKEND_API_BASE, FALLBACK_BACKEND_URL } from "../api/config";
import type {
  ApiResponse,
  FunctionalAreaFromApi,
  HouseIotAlertsApiResponse,
  HousesApiResponse,
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
 * Lấy danh sách căn nhà gắn với user hiện tại (tenant) (GET /api/houses/house).
 * BE dựa trên userId trong access token (userRentalId) để trả về các nhà mà tenant đang thuê.
 * Dùng cho luồng Tenant Home để không phải filter thủ công theo userId trên FE.
 */
export const getTenantHouses = async (): Promise<HousesApiResponse> => {
  const response = await axiosClient.get<HousesApiResponse>(
    //`${BACKEND_API_BASE}/houses/house`
     `${FALLBACK_BACKEND_URL}/houses/house`
  );
  return response.data;
};

/**
 * Lấy danh sách khu vực chức năng theo houseId (GET /api/houses/functionalAreas/{houseId}).
 */
export const getFunctionalAreasByHouseId = async (
  houseId: string
): Promise<ApiResponse<FunctionalAreaFromApi[]>> => {
  const url = `${FALLBACK_BACKEND_URL}/houses/functionalAreas/${encodeURIComponent(
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
  const url = `${FALLBACK_BACKEND_URL}/assets/houses/${encodeURIComponent(
    houseId
  )}/iot/alerts?${sp.toString()}`;
  const response = await axiosClient.get<HouseIotAlertsApiResponse>(url);
  return response.data;
};

