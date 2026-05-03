import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type { ApiResponse, UserProfileResponse } from "../types/api";
import { useAuthStore } from "../../store/useAuthStore";
import { getTenantHouses } from "./houseApi";
import i18n from "../i18n";
import { AppLocaleCode, toAppLocaleCode } from "../utils/resolveLocalizedJsonString";

/**
 * Lấy thông tin chi tiết user hiện tại (GET /api/users/me).
 * Cùng BACKEND_API_BASE với toàn bộ REST app.
 */
export const getUserProfile = async (): Promise<UserProfileResponse | null> => {
  const url = `${BACKEND_API_BASE}/users/me`;
  try {
    const response = await axiosClient.get<ApiResponse<UserProfileResponse>>(url);
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    // Log chi tiết để debug
    console.error(`[UserProfile] Lỗi gọi API ${url}:`);
    if (error.response) {
        // Server trả về response lỗi (4xx, 5xx)
        console.error(`- Status: ${error.response.status}`);
        console.error(`- Data:`, error.response.data);
    } else if (error.request) {
        // Không nhận được response (Network Error)
        console.error("- Không nhận được phản hồi từ server (Network Error hoặc Server Down)");
    } else {
        console.error("- Lỗi setup request:", error.message);
    }
    return null;
  }
};

/**
 * Fields a tenant can self-update from the mobile profile screen. The VN
 * CCCD block + foreign-tenant passport block are writable too — BE upserts
 * whichever is present per the tenantType branch; passing blank/empty
 * strings on the "wrong" block is a no-op.
 *
 * `roles` and `mainHouseId` are intentionally NOT in this payload — mobile
 * uses dedicated endpoints (PUT /users/main-house, role grants are admin).
 */
export type UserProfileUpdatePayload = Partial<
  Pick<
    UserProfileResponse,
    | "name"
    | "phoneNumber"
    | "identityNumber"
    // VN block
    | "dateOfIssue"
    | "placeOfIssue"
    | "permanentAddress"
    // Shared
    | "dateOfBirth"
    | "gender"
    // Foreign block
    | "passportNumber"
    | "passportIssueDate"
    | "passportExpiryDate"
    | "nationality"
    | "visaType"
    | "visaExpiryDate"
  >
>;

/** Cập nhật hồ sơ user hiện tại (PUT /api/users/me). */
export const updateUserProfile = async (
  payload: UserProfileUpdatePayload
): Promise<UserProfileResponse> => {
  const url = `${BACKEND_API_BASE}/users/me`;
  const response = await axiosClient.put<ApiResponse<UserProfileResponse>>(url, payload);
  if (response.data?.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(
    (response.data as { message?: string } | undefined)?.message ?? "Cập nhật hồ sơ thất bại"
  );
};

export type UpdateUserLanguagePayload = {
  language: AppLocaleCode;
};

/** Cập nhật ngôn ngữ user hiện tại (PUT /api/users/language). */
export const updateUserLanguage = async (
  payload: UpdateUserLanguagePayload
): Promise<void> => {
  const language = toAppLocaleCode(payload.language);
  const url = `${BACKEND_API_BASE}/users/language`;
  const response = await axiosClient.put<ApiResponse<unknown>>(url, { language });
  if (response.data?.success) return;
  throw new Error(
    (response.data as { message?: string } | undefined)?.message ??
      "Cập nhật ngôn ngữ thất bại"
  );
};

export type UpdateMainHousePayload = {
  houseId: string;
};

/** Cập nhật nhà chính của tenant (PUT /api/users/main-house). */
export const updateMainHouse = async (
  payload: UpdateMainHousePayload
): Promise<string> => {
  const url = `${BACKEND_API_BASE}/users/main-house`;
  const response = await axiosClient.put<ApiResponse<string>>(url, payload);
  if (response.data?.success) {
    return response.data?.data ?? "";
  }
  throw new Error(
    (response.data as { message?: string } | undefined)?.message ??
      "Cập nhật nhà chính thất bại"
  );
};

/**
 * Sau khi đăng nhập / mở lại app:
 * - GET /users/me có `mainHouseId` → gán store (nhà mặc định sau lần chọn đầu, lưu bằng PUT /users/main-house).
 * - Chưa có `mainHouseId` và chỉ 1 nhà (my-access) → PUT main-house + gán store.
 * - Nhiều nhà mà chưa có `mainHouseId` → không tự PUT, không gán từ token; Home mở modal chọn lần đầu.
 */
export async function ensureTenantMainHouseSynced(): Promise<void> {
  const profile = await getUserProfile();
  if (!profile) return;

  const savedLanguage = toAppLocaleCode(profile.language ?? "vi");
  if (toAppLocaleCode(i18n.language) !== savedLanguage) {
    await i18n.changeLanguage(savedLanguage);
  }

  const setHouseId = useAuthStore.getState().setHouseId;
  const rawMain = profile.mainHouseId;
  const mainId =
    typeof rawMain === "string" && rawMain.trim().length > 0 ? rawMain.trim() : null;

  if (mainId) {
    setHouseId(mainId);
    return;
  }

  let list: { id: string }[] = [];
  try {
    const housesRes = await getTenantHouses();
    list = housesRes.success && Array.isArray(housesRes.data) ? housesRes.data : [];
  } catch {
    return;
  }

  if (list.length === 1) {
    const onlyId = String(list[0]!.id ?? "").trim();
    if (!onlyId) return;
    try {
      await updateMainHouse({ houseId: onlyId });
    } catch (e) {
      console.warn("[ensureTenantMainHouseSynced] PUT main-house (single):", e);
      return;
    }
    setHouseId(onlyId);
    return;
  }

  if (list.length > 1) {
    setHouseId(null);
    return;
  }

  setHouseId(null);
}
