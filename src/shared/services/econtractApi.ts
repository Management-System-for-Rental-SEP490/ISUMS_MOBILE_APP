import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type { ApiResponse, TenantEContractFromApi } from "../types/api";

/**
 * Danh sách hợp đồng điện tử của tenant đang đăng nhập (GET /api/econtracts/my, JWT bắt buộc).
 */
export const getMyEContracts = async (): Promise<TenantEContractFromApi[]> => {
  const url = `${BACKEND_API_BASE}/econtracts/my`;
  const response = await axiosClient.get<ApiResponse<TenantEContractFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * URL ký sẵn S3 để xem PDF (GET /api/econtracts/:id/pdf). JWT bắt buộc; link thường hết hạn sau ~30 phút.
 */
export const getEContractPresignedPdfUrl = async (contractId: string): Promise<string> => {
  const id = String(contractId ?? "").trim();
  if (!id) {
    throw new Error("MISSING_CONTRACT_ID");
  }
  const url = `${BACKEND_API_BASE}/econtracts/${encodeURIComponent(id)}/pdf`;
  const response = await axiosClient.get<ApiResponse<string>>(url);
  if (response.data?.success && typeof response.data.data === "string") {
    const u = response.data.data.trim();
    if (u.length > 0) return u;
  }
  const msg =
    typeof response.data?.message === "string" && response.data.message.trim()
      ? response.data.message.trim()
      : "PDF_URL_EMPTY";
  throw new Error(msg);
};
