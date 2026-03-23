import axios from "axios";
import axiosClient from "../api/axiosClient";
import { FALLBACK_BACKEND_URL } from "../api/config";
import type { ApiResponse, IssueTicketResponseFromApi, TenantTicketFromApi } from "../types/api";

export type TenantTicketCreateType = "REPAIR" | "QUESTION";

export type CreateTenantTicketPayload = {
  houseId: string;
  assetId: string;
  title: string;
  description: string;
  type: TenantTicketCreateType;
};

/**
 * Danh sách ticket của tenant đang đăng nhập (GET /api/issues/tickets/tenant).
 */
export const getTenantTickets = async (): Promise<TenantTicketFromApi[]> => {
  const url = `${FALLBACK_BACKEND_URL}/issues/tickets/tenant`;
  const response = await axiosClient.get<ApiResponse<TenantTicketFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * Danh sách phản hồi (GET /api/issues/responses).
 */
export const getIssueResponses = async (): Promise<IssueTicketResponseFromApi[]> => {
  const url = `${FALLBACK_BACKEND_URL}/issues/responses`;
  const response = await axiosClient.get<ApiResponse<IssueTicketResponseFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * Tenant gửi ticket (POST /api/issues/tickets).
 */
export const createTenantTicket = async (
  payload: CreateTenantTicketPayload
): Promise<TenantTicketFromApi> => {
  const url = `${FALLBACK_BACKEND_URL}/issues/tickets`;
  try {
    const response = await axiosClient.post<ApiResponse<TenantTicketFromApi>>(url, payload);
    const body = response.data;
    if (body?.success && body.data && typeof body.data === "object" && "id" in body.data) {
      return body.data;
    }
    const msg =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Create ticket failed";
    throw new Error(msg);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const d = e.response?.data;
      if (d && typeof d === "object" && "message" in d && typeof (d as { message: string }).message === "string") {
        throw new Error((d as { message: string }).message);
      }
    }
    throw e;
  }
};
