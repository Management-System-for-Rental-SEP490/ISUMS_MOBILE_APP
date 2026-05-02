import axios from "axios";
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE, FALLBACK_BACKEND_URL, ISSUES_TENANT_LIST_TIMEOUT_MS } from "../api/config";
import i18n from "../i18n";
import { toAppLocaleCode } from "../utils/resolveLocalizedJsonString";
import { useAuthStore } from "../../store/useAuthStore";
import type {
  ApiResponse,
  IssueBannerFromApi,
  IssueDetailFromApi,
  IssueQuoteFromApi,
  IssueTicketResponseFromApi,
  TenantTicketFromApi,
} from "../types/api";

export type TenantTicketCreateType = "REPAIR" | "QUESTION";

export type CreateTenantTicketPayload = {
  houseId: string;
  assetId: string;
  title: string;
  description: string;
  type: TenantTicketCreateType;
};

/**
 * Thu gọn body sau GET danh sách: `quote.items` làm payload phình; list chỉ cần `totalPrice`/status ẩn trong card.
 * Giữ tối đa một ảnh trong `images`. Màn chi tiết luôn tải lại đủ qua `getTenantTicketById`.
 *
 * @param rows - parse xong từ BE (có thể hàng trăm phần tử).
 * @returns Bản shallow copy an toàn cho React Query cache.
 */
function slimTenantTicketsForMemory(rows: TenantTicketFromApi[]): TenantTicketFromApi[] {
  if (!rows.length) return rows;
  return rows.map((row) => {
    const r = row as TenantTicketFromApi & { quote?: IssueQuoteFromApi | null };
    const images =
      Array.isArray(r.images) && r.images.length > 1 ? [r.images[0]] : r.images;
    const quote =
      r.quote != null && typeof r.quote === "object"
        ? ({ ...r.quote, items: [] } satisfies IssueQuoteFromApi)
        : r.quote ?? undefined;
    return { ...r, images, quote } as TenantTicketFromApi;
  });
}

/**
 * Danh sách ticket của tenant đang đăng nhập (GET /api/issues/tickets/tenant).
 */
export const getTenantTickets = async (): Promise<TenantTicketFromApi[]> => {
  const url = `${BACKEND_API_BASE}/issues/tickets/tenant`;
  //const url = `${FALLBACK_BACKEND_URL}/issues/tickets/tenant`;
  const response = await axiosClient.get<ApiResponse<TenantTicketFromApi[]>>(url, {
    timeout: ISSUES_TENANT_LIST_TIMEOUT_MS,
  });
  if (response.data?.success && Array.isArray(response.data.data)) {
    return slimTenantTicketsForMemory(response.data.data);
  }
  return [];
};

/**
 * Lấy ticket theo id (GET /issues/tickets/:id)
 * Postman hình 1 bạn gửi.
 */
export const getTenantTicketById = async (
  ticketId: string,
): Promise<TenantTicketFromApi | null> => {
  const id = ticketId?.trim();
  if (!id) return null;

  //const url = `${FALLBACK_BACKEND_URL}/issues/tickets/${encodeURIComponent(id)}`;
  const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(id)}`;
  const response = await axiosClient.get<ApiResponse<TenantTicketFromApi>>(url);

  if (response.data?.success && response.data.data && typeof response.data.data === "object") {
    return response.data.data;
  }

  return null;
};

/**
 * Danh sách phản hồi (GET /api/issues/responses).
 */
export const getIssueResponses = async (): Promise<IssueTicketResponseFromApi[]> => {
  const url = `${BACKEND_API_BASE}/issues/responses`;
  const response = await axiosClient.get<ApiResponse<IssueTicketResponseFromApi[]>>(url, {
    timeout: ISSUES_TENANT_LIST_TIMEOUT_MS,
  });
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * Danh sách banner sửa chữa/báo giá (GET /api/issues/banners).
 * Dùng cho luồng quote + payment.
 */
export const getIssueBanners = async (): Promise<IssueBannerFromApi[]> => {
  //const url = `${FALLBACK_BACKEND_URL}/issues/banners`;
  const url = `${BACKEND_API_BASE}/issues/banners`;
  const response = await axiosClient.get<ApiResponse<IssueBannerFromApi[]>>(url);
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
  //const url = `${FALLBACK_BACKEND_URL}/issues/tickets`;
  const url = `${BACKEND_API_BASE}/issues/tickets`;
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

export type TicketImageToUpload = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

/**
 * Upload ảnh đính kèm ticket tenant.
 * BE handle việc đẩy lên S3/AWS.
 * Endpoint: POST /issues/tickets/:id/images
 */
export const uploadTenantTicketImages = async (
  ticketId: string,
  images: TicketImageToUpload[],
): Promise<void> => {
  if (!ticketId || images.length === 0) return;

  //const url = `${FALLBACK_BACKEND_URL}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
  const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
  //const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
  const formData = new FormData();

  console.log("[uploadTenantTicketImages] start", {
    ticketId,
    count: images.length,
    files: images.map((img, idx) => ({
      idx,
      uri: img.uri,
      fileName: img.fileName,
      mimeType: img.mimeType,
    })),
  });

  images.forEach((img, idx) => {
    const name = img.fileName ?? `ticket-${ticketId}-${idx}.jpg`;
    const type = img.mimeType ?? "image/jpeg";

    // React Native FormData expects { uri, name, type }.
    formData.append(
      "files",
      {
        uri: img.uri,
        name,
        type,
      } as any,
    );
  });

  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error("Missing auth token for image upload");
  }

  try {
    console.log("[uploadTenantTicketImages] fetch POST", { url, ticketId });

    // Important: Không set Content-Type thủ công, RN sẽ tự set multipart boundary.
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": toAppLocaleCode(i18n.language),
      },
      body: formData,
    });

    const rawText = await response.text();
    let parsed: unknown = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = rawText;
    }

    const success = typeof parsed === "object" && parsed !== null && "success" in (parsed as any) ? (parsed as any).success : undefined;
    const message =
      typeof parsed === "object" && parsed !== null && "message" in (parsed as any) ? (parsed as any).message : undefined;

    console.log("[uploadTenantTicketImages] fetch response", {
      ticketId,
      ok: response.ok,
      status: response.status,
      success,
      message,
      rawTextSnippet: typeof rawText === "string" ? rawText.slice(0, 200) : undefined,
    });

    if (!response.ok) {
      throw new Error(message || `Upload failed (HTTP ${response.status})`);
    }

    if (parsed && typeof parsed === "object" && "success" in (parsed as any) && !(parsed as any).success) {
      throw new Error(message || "Upload failed");
    }
  } catch (e) {
    console.error("[uploadTenantTicketImages] upload failed", { ticketId, error: e });
    throw e instanceof Error ? e : new Error("Upload ticket images failed");
  }
};

export type TenantTicketImageFromApi = {
  id: string;
  url: string;
  createdAt?: string | null;
};

/**
 * Lấy danh sách ảnh đính kèm của ticket tenant.
 * Endpoint: GET /issues/tickets/:id/images
 */
export const getTenantTicketImages = async (
  ticketId: string,
): Promise<TenantTicketImageFromApi[]> => {
  if (!ticketId) return [];

  //const url = `${FALLBACK_BACKEND_URL}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
  const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
  const response = await axiosClient.get<ApiResponse<TenantTicketImageFromApi[]>>(url);

  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
};

/**
 * Lấy danh sách báo giá theo ticket.
 * - Ưu tiên GET /api/issues/quotes/ticket/:ticketId (Swagger).
 * - Nếu 404, thử GET /api/issues/tickets/:ticketId/quotes (một số bản BE đặt route này).
 */
export const getIssueQuotesByTicket = async (
  ticketId: string
): Promise<IssueQuoteFromApi[]> => {
  if (!ticketId?.trim()) return [];
  const id = encodeURIComponent(ticketId);

  const parseQuotes = (body: ApiResponse<IssueQuoteFromApi[]> | undefined): IssueQuoteFromApi[] | null => {
    if (body?.success && Array.isArray(body.data)) return body.data;
    return null;
  };

  const primary = `${BACKEND_API_BASE}/issues/quotes/ticket/${id}`;
  try {
    const response = await axiosClient.get<ApiResponse<IssueQuoteFromApi[]>>(primary);
    const rows = parseQuotes(response.data);
    if (rows != null) return rows;
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw e;
  }

  const alt = `${BACKEND_API_BASE}/issues/tickets/${id}/quotes`;
  try {
    const response = await axiosClient.get<ApiResponse<IssueQuoteFromApi[]>>(alt);
    const rows = parseQuotes(response.data);
    if (rows != null) return rows;
  } catch {
    /* im lặng — coi như không có báo giá */
  }

  return [];
};

/**
 * Xác nhận báo giá của tenant (PUT /api/issues/quotes/:quoteId/status)
 * Endpoint này được backend xử lý như một thao tác "xác nhận" và đẩy ticket sang WAITING_PAYMENT.
 * (hình 3 Postman bạn gửi)
 */
export const confirmIssueQuoteStatus = async (quoteId: string): Promise<void> => {
  if (!quoteId?.trim()) return;
  const url = `${BACKEND_API_BASE}/issues/quotes/${encodeURIComponent(quoteId)}/status`;
 // const url = `${FALLBACK_BACKEND_URL}/issues/quotes/${encodeURIComponent(quoteId)}/status`;
  // BE yêu cầu PUT để xác nhận.
  // Theo Postman bạn cung cấp: body phải gửi { status: "APPROVED" }.
  const response = await axiosClient.put<ApiResponse<unknown>>(url, { status: "APPROVED" });
  if (!response.data?.success) {
    const msg =
      typeof response.data?.message === "string" && response.data.message
        ? response.data.message
        : "Confirm quote failed";
    throw new Error(msg);
  }
};

/**
 * GET `/api/issues/{issueId}` — đồng bộ trạng thái issue sau thanh toán (khi BE triển khai).
 * Trả `null` nếu 404 hoặc wrapper không có `data`.
 */
export const getIssueById = async (issueId: string): Promise<IssueDetailFromApi | null> => {
  const id = String(issueId ?? "").trim();
  if (!id) return null;
  const url = `${BACKEND_API_BASE}/issues/${encodeURIComponent(id)}`;
  try {
    const response = await axiosClient.get<ApiResponse<IssueDetailFromApi>>(url);
    if (response.data?.success && response.data.data && typeof response.data.data === "object") {
      return response.data.data;
    }
    return null;
  } catch {
    return null;
  }
};

