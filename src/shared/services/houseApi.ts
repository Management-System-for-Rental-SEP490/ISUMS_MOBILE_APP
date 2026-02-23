/**
 * API lấy danh sách và thông tin nhà (houses) cho Staff.
 * Dùng axiosClient để tự động gắn Bearer token (từ useAuthStore) và xử lý refresh token khi 401.
 */
import axiosClient from "../api/axiosClient";
import type { HousesApiResponse } from "../types";

/** Base URL của Backend API (houses, categories, items, event, images). Có thể chuyển sang biến môi trường sau. */
const HOUSES_API_BASE =
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
    `${HOUSES_API_BASE}/houses`
  );
  return response.data;
};
