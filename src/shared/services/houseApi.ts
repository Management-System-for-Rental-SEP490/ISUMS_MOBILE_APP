/**
 * API lấy danh sách nhà (houses) từ Backend chung.
 * Dùng axiosClient để tự động gắn Bearer token (từ useAuthStore)
 * và xử lý refresh token khi 401.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import { mapTenantAccessItemToHouse } from "../utils/tenantAccess";
import { resolveLocalizedJsonStringFromI18n } from "../utils/resolveLocalizedJsonString";
import type {
  ApiResponse,
  FunctionalAreaFromApi,
  HouseFromApi,
  HouseIotAlertsApiResponse,
  HousesApiResponse,
  TenantHouseAccessApiResponse,
} from "../types/api";

function localizeOptionalString(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  return resolveLocalizedJsonStringFromI18n(value);
}

function localizeNullableString(value: string | null | undefined): string | null {
  if (value == null) return null;
  return resolveLocalizedJsonStringFromI18n(value);
}

function localizeFunctionalAreaFromApi(fa: FunctionalAreaFromApi): FunctionalAreaFromApi {
  return {
    ...fa,
    name: resolveLocalizedJsonStringFromI18n(fa.name),
    description: localizeNullableString(fa.description),
  };
}

function localizeHouseFromApi(h: HouseFromApi): HouseFromApi {
  return {
    ...h,
    name: resolveLocalizedJsonStringFromI18n(h.name),
    description: localizeOptionalString(h.description),
    functionalAreas: Array.isArray(h.functionalAreas)
      ? h.functionalAreas.map(localizeFunctionalAreaFromApi)
      : h.functionalAreas,
  };
}

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
  const body = response.data;
  if (!body?.data || !Array.isArray(body.data)) return body;
  return {
    ...body,
    data: body.data.map(localizeHouseFromApi),
  };
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
    data: rows.map((item) =>
      mapTenantAccessItemToHouse({
        ...item,
        houseName: resolveLocalizedJsonStringFromI18n(item.houseName),
      })
    ),
  };
};

/**
 * Chi tiết một căn theo id (GET /api/houses/{id}).
 * BE trả payload đầy đủ — không có chọn field; client giảm tải bằng cách không gọi khi đã có tên trong `my-access` / danh sách nhà.
 */
export const getHouseById = async (houseId: string): Promise<ApiResponse<HouseFromApi> | null> => {
  const id = String(houseId ?? "").trim();
  if (!id) return null;
  try {
    const response = await axiosClient.get<ApiResponse<HouseFromApi>>(
      `${BACKEND_API_BASE}/houses/${encodeURIComponent(id)}`
    );
    const envelope = response.data;
    if (!envelope?.data) return envelope;
    return {
      ...envelope,
      data: localizeHouseFromApi(envelope.data),
    };
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
  const body = response.data;
  if (!body?.data || !Array.isArray(body.data)) return body;
  return {
    ...body,
    data: body.data.map(localizeFunctionalAreaFromApi),
  };
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
  const response = await axiosClient.get<HouseIotAlertsApiResponse>(url);
  return response.data;
};

