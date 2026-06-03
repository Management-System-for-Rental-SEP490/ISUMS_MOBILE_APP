import axios from "axios";
import axiosClient from "../api/axiosClient";
import {
  BACKEND_API_BASE,
  ISSUES_TENANT_LIST_TIMEOUT_MS,
  TICKET_CREATE_TIMEOUT_MS,
  TICKET_IMAGE_UPLOAD_TIMEOUT_MS,
} from "../api/config";
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
  TenantTicketImageFromApi,
} from "../types/api";

export type TenantTicketCreateType = "REPAIR" | "QUESTION";

export type CreateTenantTicketPayload = {
  houseId: string;
  assetId: string;
  title: string;
  description: string;
  type: TenantTicketCreateType;
};

function pickLocalizedString(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const text = value.trim();
    if (text.length > 0) return text;
  }
  return undefined;
}

/** Lấy chuỗi id/text đầu tiên khác rỗng (UUID, tên, …) từ nhiều nguồn BE có thể trả. */
function firstNonEmptyTrimmed(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s.length > 0) return s;
  }
  return undefined;
}

function normalizeIssueResponse(
  row: IssueTicketResponseFromApi
): IssueTicketResponseFromApi {
  return {
    ...row,
    content: pickLocalizedString(row.localizedContent, row.content) ?? "",
  };
}

function normalizeIssueQuote(row: IssueQuoteFromApi): IssueQuoteFromApi {
  return {
    ...row,
    items: (row.items ?? []).map((item) => ({
      ...item,
      itemName: pickLocalizedString(item.localizedItemName, item.itemName) ?? "",
      description:
        pickLocalizedString(item.localizedDescription, item.description) ??
        item.description ??
        null,
    })),
  };
}

/**
 * Chuẩn hoá một bản ghi báo giá từ BE cho client.
 *
 * **Mục đích:** Một số endpoint trả UUID báo giá trong `quoteId` / `quote_id` mà không (hoặc rỗng) trường `id`.
 * Khi đó `paymentQuote?.id` rỗng → app rơi sang thanh toán VNPay bằng `invoiceIds`; BE chỉ cập nhật ticket khi thanh toán luồng `quoteId` → ticket kẹt `WAITING_PAYMENT`.
 *
 * **Hành vi:** Gộp các ứng viên theo thứ tự `id` → `quoteId` → `quote_id`; nếu khớp `id` hiện tại thì trả nguyên bản, không thì trả shallow copy có `id` đã điền.
 */
export function normalizeIssueQuoteRow(row: IssueQuoteFromApi): IssueQuoteFromApi {
  const ext = row as IssueQuoteFromApi & { quote_id?: string | null };
  const merged =
    String(row.id ?? "").trim() ||
    String(row.quoteId ?? "").trim() ||
    String(ext.quote_id ?? "").trim();
  if (!merged) return row;
  if (merged === String(row.id ?? "").trim()) return row;
  return { ...row, id: merged };
}

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
    const localized = normalizeTenantTicket(row);
    const r = localized as TenantTicketFromApi & { quote?: IssueQuoteFromApi | null };
    const images =
      Array.isArray(r.images) && r.images.length > 1 ? [r.images[0]] : r.images;
    const quote =
      r.quote != null && typeof r.quote === "object"
        ? normalizeIssueQuoteRow({ ...r.quote, items: [] } satisfies IssueQuoteFromApi)
        : r.quote ?? undefined;
    return { ...r, images, quote } as TenantTicketFromApi;
  });
}

/**
 * Chuẩn hoá một ticket tenant sau GET list/detail: i18n title/description,
 * flatten tên/SĐT staff (flat + `assigned_staff` snake_case + object `assignedStaff`),
 * map `asset.display_name` → `displayName`, và chuẩn hoá `quote` / `latestTicketResponse`.
 */
function normalizeTenantTicket(row: TenantTicketFromApi): TenantTicketFromApi {
  const raw = row as unknown as Record<string, unknown>;

  const assignedStaff =
    row.assignedStaff ?? (raw.assigned_staff as TenantTicketFromApi["assignedStaff"] | undefined);
  const party =
    assignedStaff && typeof assignedStaff === "object"
      ? (assignedStaff as unknown as Record<string, unknown>)
      : null;

  const assetSrc =
    (row.asset as unknown as Record<string, unknown> | undefined) ??
    (raw.asset as Record<string, unknown> | undefined) ??
    (raw.asset_item as Record<string, unknown> | undefined);

  let mergedAsset = row.asset;
  if (assetSrc && typeof assetSrc === "object") {
    const displayName = pickLocalizedString(
      assetSrc.displayName as string | undefined,
      assetSrc.display_name as string | undefined
    );
    mergedAsset = {
      ...(assetSrc as unknown as NonNullable<TenantTicketFromApi["asset"]>),
      ...(displayName ? { displayName } : {}),
    };
  }

  const mergedAssignedStaffId =
    firstNonEmptyTrimmed(row.assignedStaffId, raw.assigned_staff_id, party?.id) ?? null;

  const mergedRow: TenantTicketFromApi = {
    ...row,
    assignedStaff: assignedStaff ?? row.assignedStaff,
    assignedStaffId: mergedAssignedStaffId,
    asset: mergedAsset ?? row.asset,
  };

  const staffName =
    pickLocalizedString(
      mergedRow.staffName,
      raw.staff_name as string | undefined,
      party?.name as string | undefined,
      party?.fullName as string | undefined,
      party?.full_name as string | undefined
    ) ?? null;
  const staffPhone =
    pickLocalizedString(
      mergedRow.staffPhone,
      raw.staff_phone as string | undefined,
      party?.phoneNumber as string | undefined,
      party?.phone as string | undefined,
      party?.phone_number as string | undefined
    ) ?? null;
  const quote =
    mergedRow.quote && typeof mergedRow.quote === "object" && "id" in mergedRow.quote && mergedRow.quote.id
      ? normalizeIssueQuote(mergedRow.quote)
      : mergedRow.quote ?? null;

  const rawLatest = mergedRow.latestTicketResponse;
  const latestTicketResponse =
    rawLatest && typeof rawLatest === "object" && String(rawLatest.id ?? "").trim()
      ? normalizeIssueResponse({
          ...rawLatest,
          ticketId: String(rawLatest.ticketId ?? "").trim() || mergedRow.id,
          actorId: String(rawLatest.actorId ?? "").trim(),
        })
      : null;

  return {
    ...mergedRow,
    title: pickLocalizedString(mergedRow.localizedTitle, mergedRow.title) ?? "",
    description: pickLocalizedString(mergedRow.localizedDescription, mergedRow.description) ?? "",
    staffName,
    staffPhone,
    quote,
    latestTicketResponse,
  };
}

/** URL thumbnail đầu tiên từ `images` embed (GET /issues/tickets/tenant). */
export function getTenantTicketThumbUrl(ticket: TenantTicketFromApi): string | undefined {
  const u = ticket.images?.[0]?.url?.trim();
  return u || undefined;
}

/** Tên thiết bị từ `asset` embed; hỗ trợ `display_name` (snake_case) một số bản BE. */
export function getTenantTicketAssetDisplayName(ticket: TenantTicketFromApi): string | null {
  const a = ticket.asset as Record<string, unknown> | undefined | null;
  if (!a || typeof a !== "object") return null;
  const n = pickLocalizedString(
    a.displayName as string | undefined,
    a.display_name as string | undefined
  );
  const t = n?.trim();
  return t || null;
}

/** Báo giá embed thành mảng (0–1 phần tử) cho UI quote. */
export function getTenantTicketEmbeddedQuotes(ticket: TenantTicketFromApi): IssueQuoteFromApi[] {
  if (ticket.quote?.id) return [ticket.quote];
  return [];
}

function normalizeIssueBanner(row: IssueBannerFromApi): IssueBannerFromApi {
  return {
    ...row,
    name: pickLocalizedString(row.localizedName, row.name) ?? "",
  };
}

/**
 * Danh sách ticket của tenant đang đăng nhập (GET /api/issues/tickets/tenant).
 */
export const getTenantTickets = async (): Promise<TenantTicketFromApi[]> => {
  const url = `${BACKEND_API_BASE}/issues/tickets/tenant`;
  //const url = `${BACKEND_API_BASE}/issues/tickets/tenant`;
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

  //const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(id)}`;
  const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(id)}`;
  const response = await axiosClient.get<ApiResponse<TenantTicketFromApi>>(url);

  if (response.data?.success && response.data.data && typeof response.data.data === "object") {
    const localized = normalizeTenantTicket(response.data.data);
    if (localized.quote != null && typeof localized.quote === "object") {
      return { ...localized, quote: normalizeIssueQuoteRow(localized.quote) } as TenantTicketFromApi;
    }
    return localized;
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
    return response.data.data.map(normalizeIssueResponse);
  }
  return [];
};

/**
 * Chi tiết một phản hồi staff theo id (GET /api/issues/responses/{id}).
 */
export const getIssueResponseById = async (
  responseId: string
): Promise<IssueTicketResponseFromApi | null> => {
  const id = String(responseId ?? "").trim();
  if (!id) return null;
  const url = `${BACKEND_API_BASE}/issues/responses/${encodeURIComponent(id)}`;
  const response = await axiosClient.get<ApiResponse<IssueTicketResponseFromApi>>(url);
  if (response.data?.success && response.data.data) {
    return normalizeIssueResponse(response.data.data);
  }
  return null;
};

/**
 * Danh sách banner sửa chữa/báo giá (GET /api/issues/banners).
 * Dùng cho luồng quote + payment.
 */
export const getIssueBanners = async (): Promise<IssueBannerFromApi[]> => {
  //const url = `${BACKEND_API_BASE}/issues/banners`;
  const url = `${BACKEND_API_BASE}/issues/banners`;
  const response = await axiosClient.get<ApiResponse<IssueBannerFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data.map(normalizeIssueBanner);
  }
  return [];
};

/**
 * Tenant gửi ticket (POST /api/issues/tickets).
 * Timeout 20s: đủ chỗ cho access token hết hạn → interceptor refresh (~2s) + retry.
 */
const issuesPerfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const createTenantTicket = async (
  payload: CreateTenantTicketPayload
): Promise<TenantTicketFromApi> => {
  const url = `${BACKEND_API_BASE}/issues/tickets`;
  const t0 = __DEV__ ? issuesPerfNow() : 0;
  if (__DEV__) {
    console.log("[TicketSubmit:API] createTenantTicket → POST /issues/tickets", {
      type: payload.type,
      houseId: payload.houseId,
      assetId: payload.assetId,
    });
  }
  try {
    const response = await axiosClient.post<ApiResponse<TenantTicketFromApi>>(url, payload, {
      timeout: TICKET_CREATE_TIMEOUT_MS,
    });
    const body = response.data;
    if (body?.success && body.data && typeof body.data === "object" && "id" in body.data) {
      if (__DEV__) {
        console.log(
          `[TicketSubmit:API] createTenantTicket OK ${(issuesPerfNow() - t0).toFixed(0)}ms — id=${body.data.id}`
        );
      }
      return body.data;
    }
    const msg =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Create ticket failed";
    throw new Error(msg);
  } catch (e) {
    if (__DEV__) {
      const st = axios.isAxiosError(e) ? e.response?.status : undefined;
      const code = axios.isAxiosError(e) ? e.code : undefined;
      console.warn(
        `[TicketSubmit:API] createTenantTicket FAIL ${(issuesPerfNow() - t0).toFixed(0)}ms` +
          (st != null ? ` status=${st}` : "") +
          (code ? ` code=${code}` : ""),
        e
      );
    }
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
/**
 * Upload ảnh đính kèm ticket — dùng axiosClient để hưởng interceptor auto-refresh token.
 *
 * Chiến lược retry tuần tự (lần lượt):
 * - Thử gửi toàn bộ images 1 lần.
 * - Nếu gặp lỗi network / timeout (không phải lỗi 4xx có nghĩa), chờ UPLOAD_RETRY_DELAY_MS rồi thử lại 1 lần.
 * - Interceptor axiosClient tự xử lý 401 → refresh token → retry — không cần xử lý thủ công.
 *
 * @param ticketId  ID ticket vừa tạo.
 * @param images    Danh sách ảnh cần upload.
 */
export const uploadTenantTicketImages = async (
  ticketId: string,
  images: TicketImageToUpload[],
): Promise<void> => {
  if (!ticketId || images.length === 0) return;

  const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(ticketId)}/images`;

  /** Tạo FormData từ danh sách ảnh. */
  const buildFormData = () => {
    const fd = new FormData();
    images.forEach((img, idx) => {
      fd.append("files", {
        uri: img.uri,
        name: img.fileName ?? `ticket-${ticketId}-${idx}.jpg`,
        type: img.mimeType ?? "image/jpeg",
      } as any);
    });
    return fd;
  };

  const UPLOAD_RETRY_DELAY_MS = 1_500;

  /** Gửi 1 lần và throw nếu lỗi. */
  const attempt = async (attemptNo: number) => {
    const t0 = __DEV__ ? issuesPerfNow() : 0;
    if (__DEV__) {
      console.log(
        `[TicketSubmit:API] uploadTenantTicketImages attempt ${attemptNo} — POST .../images`,
        { ticketId, count: images.length }
      );
    }
    // axiosClient có interceptor auto-refresh 401 và timeout từ TICKET_IMAGE_UPLOAD_TIMEOUT_MS.
    // Không set Content-Type thủ công — axios + RN tự đặt multipart/form-data + boundary.
    await axiosClient.post(url, buildFormData(), {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: TICKET_IMAGE_UPLOAD_TIMEOUT_MS,
    });
    if (__DEV__) {
      console.log(
        `[TicketSubmit:API] uploadTenantTicketImages attempt ${attemptNo} OK ${(issuesPerfNow() - t0).toFixed(0)}ms`
      );
    }
  };

  try {
    await attempt(1);
  } catch (e) {
    // Chỉ retry khi lỗi không có response (network/timeout) — không retry 4xx/5xx có nghĩa.
    const isNetworkOrTimeout =
      axios.isAxiosError(e) && (!e.response || e.code === "ECONNABORTED");

    if (isNetworkOrTimeout) {
      if (__DEV__) {
        console.warn("[TicketSubmit:API] upload lần 1 lỗi network/timeout, chờ 1.5s rồi thử lại", {
          ticketId,
          code: axios.isAxiosError(e) ? e.code : undefined,
        });
      }
      // Chờ trước khi thử lại — giảm xác suất hit server đang bận.
      await new Promise((res) => setTimeout(res, UPLOAD_RETRY_DELAY_MS));
      await attempt(2); // Throw thẳng nếu lần 2 vẫn lỗi
    } else {
      throw e instanceof Error ? e : new Error("Upload ticket images failed");
    }
  }
};

export type { TenantTicketImageFromApi };

/**
 * Lấy danh sách ảnh đính kèm của ticket tenant.
 * Endpoint: GET /issues/tickets/:id/images
 */
export const getTenantTicketImages = async (
  ticketId: string,
): Promise<TenantTicketImageFromApi[]> => {
  if (!ticketId) return [];

  //const url = `${BACKEND_API_BASE}/issues/tickets/${encodeURIComponent(ticketId)}/images`;
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
    if (body?.success && Array.isArray(body.data)) return body.data.map(normalizeIssueQuote);
    return null;
  };

  const mapNorm = (rows: IssueQuoteFromApi[]) => rows.map(normalizeIssueQuoteRow);

  const primary = `${BACKEND_API_BASE}/issues/quotes/ticket/${id}`;
  try {
    const response = await axiosClient.get<ApiResponse<IssueQuoteFromApi[]>>(primary);
    const rows = parseQuotes(response.data);
    if (rows != null) return mapNorm(rows);
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw e;
  }

  const alt = `${BACKEND_API_BASE}/issues/tickets/${id}/quotes`;
  try {
    const response = await axiosClient.get<ApiResponse<IssueQuoteFromApi[]>>(alt);
    const rows = parseQuotes(response.data);
    if (rows != null) return mapNorm(rows);
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
 // const url = `${BACKEND_API_BASE}/issues/quotes/${encodeURIComponent(quoteId)}/status`;
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

