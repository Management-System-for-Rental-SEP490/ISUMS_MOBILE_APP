import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type { ApiResponse, VnpayPaymentCreateRequest } from "../types/api";

/** URL redirect sau thanh toán có đủ tham số VNPay để gửi BE xác thực. */
export function isLikelyVnpayReturnNavigation(url: string): boolean {
  const u = String(url ?? "").trim();
  if (!u || u.startsWith("about:")) return false;
  return (
    /[?&]vnp_ResponseCode=/i.test(u) && /[?&]vnp_SecureHash=/i.test(u)
  );
}

/**
 * Đọc `vnp_ResponseCode` từ URL redirect (chuẩn VNPay: `00` = thành công).
 */
export function getVnpayResponseCodeFromReturnUrl(url: string): string | null {
  const u = String(url ?? "").trim();
  if (!u) return null;
  try {
    const parsed = new URL(u, "https://vn-pay-return.invalid");
    const raw =
      parsed.searchParams.get("vnp_ResponseCode") ??
      parsed.searchParams.get("vnp_responsecode");
    const c = String(raw ?? "").trim();
    return c.length ? c : null;
  } catch {
    const m = /[?&]vnp_ResponseCode=([^&]*)/i.exec(u);
    if (!m?.[1]) return null;
    try {
      return decodeURIComponent(m[1].replace(/\+/g, " ")).trim() || null;
    } catch {
      return m[1].trim() || null;
    }
  }
}

/** Cổng VNPay báo giao dịch thành công (khi BE xác thực GET lỗi vẫn có thể hiển thị luồng thành công lạc quan). */
export function isVnpayReturnGatewaySuccess(url: string): boolean {
  return getVnpayResponseCodeFromReturnUrl(url) === "00";
}

function vnpReturnGetParam(searchParams: URLSearchParams, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = searchParams.get(key);
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  const lower = keys.map((k) => k.toLowerCase());
  for (const [k, v] of searchParams.entries()) {
    if (lower.includes(k.toLowerCase()) && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

/** Các trường đọc từ query redirect VNPay để hiển thị (không thay thế xác thực chữ ký trên server). */
export type VnpayReturnUrlDisplayFields = {
  amountVnd: number | null;
  payDateRaw: string | null;
  orderInfo: string | null;
  transactionNo: string | null;
  bankCode: string | null;
  cardType: string | null;
  responseCode: string | null;
};

const EMPTY_VNP_DISPLAY: VnpayReturnUrlDisplayFields = {
  amountVnd: null,
  payDateRaw: null,
  orderInfo: null,
  transactionNo: null,
  bankCode: null,
  cardType: null,
  responseCode: null,
};

/**
 * Đọc tham số hiển thị từ URL return (vnp_Amount ×100, vnp_PayDate, …).
 */
export function parseVnpayReturnUrlForDisplay(redirectUrl: string): VnpayReturnUrlDisplayFields {
  let searchParams: URLSearchParams;
  try {
    searchParams = new URL(String(redirectUrl ?? "").trim()).searchParams;
  } catch {
    try {
      searchParams = new URL(String(redirectUrl ?? "").trim(), "https://vnpay.invalid").searchParams;
    } catch {
      return { ...EMPTY_VNP_DISPLAY };
    }
  }
  const amountRaw = vnpReturnGetParam(searchParams, "vnp_Amount");
  let amountVnd: number | null = null;
  if (amountRaw) {
    const n = parseInt(amountRaw, 10);
    if (Number.isFinite(n) && n >= 0) amountVnd = n / 100;
  }
  let orderInfo = vnpReturnGetParam(searchParams, "vnp_OrderInfo");
  if (orderInfo) {
    try {
      orderInfo = decodeURIComponent(orderInfo.replace(/\+/g, " "));
    } catch {
      /* giữ nguyên */
    }
  }
  return {
    amountVnd,
    payDateRaw: vnpReturnGetParam(searchParams, "vnp_PayDate"),
    orderInfo,
    transactionNo: vnpReturnGetParam(searchParams, "vnp_TransactionNo"),
    bankCode: vnpReturnGetParam(searchParams, "vnp_BankCode"),
    cardType: vnpReturnGetParam(searchParams, "vnp_CardType"),
    responseCode: vnpReturnGetParam(searchParams, "vnp_ResponseCode"),
  };
}

function isApiResponseShape(body: unknown): body is ApiResponse<string> {
  return Boolean(body && typeof body === "object" && "success" in body);
}

/** Gom danh sách URL GET để xác thực chữ ký VNPay (query giữ nguyên như redirect). */
function buildVnpayReturnValidateUrls(redirectUrl: string, search: string): string[] {
  const out: string[] = [];
  const add = (u: string) => {
    const x = u.trim();
    if (x && !out.includes(x)) out.push(x);
  };

  let parsed: URL | null = null;
  try {
    parsed = new URL(redirectUrl);
  } catch {
    try {
      parsed = new URL(redirectUrl, "https://vnpay-return.invalid");
    } catch {
      parsed = null;
    }
  }

  add(`${BACKEND_API_BASE}/payments/vnpay/return${search}`);

  if (parsed) {
    const noHash = redirectUrl.split("#")[0]?.trim() ?? "";
    if (noHash) add(noHash);
    const pathOnly = `${parsed.origin}${parsed.pathname}${search}`;
    add(pathOnly);
    add(`${parsed.origin}/payments/vnpay/return${search}`);
    add(`${parsed.origin}/payments/result${search}`);
    add(`${parsed.origin}/api/payments/vnpay/return${search}`);
    add(`${parsed.origin}/api/payments/result${search}`);
  }

  return out;
}

/**
 * Gửi toàn bộ query từ URL redirect VNPay lên BE (cùng Bearer) để xác thực chữ ký.
 * Thử lần lượt: API mobile (`api-dev`…), rồi các path trên **cùng host** với `vnp_ReturnUrl` (URL return do BE/VNPay cấu hình cho luồng mobile).
 * Chỉ chấp nhận JSON dạng `ApiResponse` — không tin HTML trả về từ trang web.
 */
export async function validateVnpayReturnUrl(
  redirectUrl: string
): Promise<ApiResponse<string>> {
  let search = "";
  try {
    search = new URL(redirectUrl).search || "";
  } catch {
    try {
      search = new URL(redirectUrl, "https://vnpay-return.invalid").search || "";
    } catch {
      throw new Error("INVALID_VNPAY_RETURN_URL");
    }
  }
  if (!search || search === "?") {
    throw new Error("EMPTY_VNPAY_RETURN_QUERY");
  }

  const candidates = buildVnpayReturnValidateUrls(redirectUrl, search);
  let lastError: unknown;

  if (__DEV__) {
    console.log("[VNPAY] validateVnpayReturnUrl", {
      candidateCount: candidates.length,
      hasVnpResponseCode: search.includes("vnp_ResponseCode="),
    });
  }

  for (const requestUrl of candidates) {
    try {
      const response = await axiosClient.get<unknown>(requestUrl);
      const body = response.data;
      if (isApiResponseShape(body)) {
        if (__DEV__) {
          console.log("[VNPAY] validateVnpayReturnUrl ok", {
            requestHost: (() => {
              try {
                return new URL(requestUrl).host;
              } catch {
                return "?";
              }
            })(),
            success: body.success,
            message: typeof body.message === "string" ? body.message.slice(0, 120) : undefined,
          });
        }
        return body;
      }
    } catch (e: unknown) {
      lastError = e;
      const status = (e as { response?: { status?: number } })?.response?.status;
      /** 401: token hết hạn — không thử host khác. 403: có thể chỉ host này cấm — thử URL kế tiếp. */
      if (status === 401) throw e;
    }
  }

  if (__DEV__) {
    const st = (lastError as { response?: { status?: number } })?.response?.status;
    console.warn("[VNPAY] validateVnpayReturnUrl exhausted", { lastHttpStatus: st });
  }
  if (lastError) throw lastError;
  throw new Error("VNPAY_RETURN_VALIDATE_FAILED");
}

/** Giá trị `language` khi không xác định được từ cài đặt app / người dùng chưa chọn. */
export const DEFAULT_VNPAY_PAYMENT_LANGUAGE = "vn";

/**
 * Map `i18n.language` (hoặc tương đương) sang mã BE/VNPay mong đợi.
 * Không nhận diện được → `vn`.
 */
export function resolveVnpayPaymentLanguage(appLanguage: string | undefined): string {
  const raw = String(appLanguage ?? "").trim().toLowerCase();
  if (!raw) return DEFAULT_VNPAY_PAYMENT_LANGUAGE;
  if (raw.startsWith("vi")) return "vn";
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ja")) return "ja";
  return DEFAULT_VNPAY_PAYMENT_LANGUAGE;
}

export type CreateVnpayPaymentLinkOptions = {
  /** Bỏ qua để dùng `resolveVnpayPaymentLanguage` từ `appLanguage`. */
  locale?: string;
  /** @deprecated Dùng `locale`; giữ tạm để gọi cũ. */
  language?: string;
  /** Ngôn ngữ hiện tại của app (react-i18next `i18n.language`). */
  appLanguage?: string;
  /** Mã ngân hàng VNPay (tùy chọn). */
  bankCode?: string;
};

/**
 * Swagger **Invoice** flow: `{ invoiceIds }` — tiền nhà / cọc (một hoặc nhiều hóa đơn thuê & deposit).
 */
export type CreateVnpayPaymentInvoicePayload = { invoiceIds: string[]; quoteId?: never };
/**
 * Swagger **Quote** flow: `{ quoteId }` — báo giá sửa chữa đã duyệt (ticket thường WAITING_PAYMENT).
 */
export type CreateVnpayPaymentQuotePayload = { quoteId: string; invoiceIds?: never };

export type CreateVnpayPaymentLinkPayload = CreateVnpayPaymentInvoicePayload | CreateVnpayPaymentQuotePayload;

function resolveVnpayLocale(options?: CreateVnpayPaymentLinkOptions): string {
  const direct = options?.locale?.trim() || options?.language?.trim();
  if (direct) return direct;
  return resolveVnpayPaymentLanguage(options?.appLanguage);
}

/** Gom `message` + từng phần tử `errors` (Swagger) khi POST tạo link trả `success: false`. */
function joinVnpayCreateLinkFailureMessage(resBody: ApiResponse<string> | undefined): string {
  const parts: string[] = [];
  if (typeof resBody?.message === "string" && resBody.message.trim()) {
    parts.push(resBody.message.trim());
  }
  if (Array.isArray(resBody?.errors)) {
    for (const e of resBody.errors) {
      if (!e || typeof e !== "object") continue;
      const m = typeof e.message === "string" ? e.message.trim() : "";
      if (!m) continue;
      const f = typeof e.field === "string" && e.field.trim() ? `${e.field.trim()}: ` : "";
      const c = typeof e.code === "string" && e.code.trim() ? `[${e.code.trim()}] ` : "";
      parts.push(`${c}${f}${m}`);
    }
  }
  return parts.join("\n").trim() || "Không tạo được link thanh toán";
}

/**
 * Tạo link thanh toán VNPay — **POST** `{BACKEND_API_BASE}/payments/vnpay`.
 *
 * Hai luồng (Swagger — chỉ một trong hai trong body):
 * - **Invoice:** `invoiceIds` (rental/deposit invoices).
 * - **Quote:** `quoteId` (approved repair quote; ticket thường WAITING_PAYMENT).
 *
 * `bankCode` mặc định `""`, `locale` từ app (`vn` / `en` / `ja`).
 *
 * **Response:** wrapper `success` + `data` là chuỗi URL VNPay. `Bearer` qua axios.
 *
 * @returns URL đầy đủ mở WebView.
 */
export async function createVnpayPaymentLink(
  payload: CreateVnpayPaymentLinkPayload,
  options?: CreateVnpayPaymentLinkOptions
): Promise<string> {
  const locale = resolveVnpayLocale(options);
  const bankCode = options?.bankCode != null ? String(options.bankCode) : "";

  const quoteRaw = "quoteId" in payload ? String(payload.quoteId ?? "").trim() : "";
  const idsRaw =
    "invoiceIds" in payload && Array.isArray(payload.invoiceIds) ? payload.invoiceIds : [];
  const invoiceIds = [...new Set(idsRaw.map((x) => String(x).trim()).filter(Boolean))];

  if (quoteRaw && invoiceIds.length > 0) {
    throw new Error("VNPAY_EXCLUSIVE_PAYLOAD");
  }
  if (!quoteRaw && invoiceIds.length === 0) {
    throw new Error("NO_VNPAY_TARGET");
  }

 
  const url = `${BACKEND_API_BASE}/payments/vnpay`;
  //const url = `https://unrestrictable-lan-syzygial.ngrok-free.dev/api/payments/vnpay`;
  const body: VnpayPaymentCreateRequest = quoteRaw
    ? { quoteId: quoteRaw, bankCode, locale }
    : { invoiceIds, bankCode, locale };

  if (__DEV__) {
    // ticket_issue_quote = body quoteId; rent_or_invoice_ids = body invoiceIds (tiền nhà/cọc, …)
    console.log("[VNPAY] createVnpayPaymentLink → POST", {
      postPath: "/payments/vnpay",
      nghiepVu: quoteRaw ? "ticket_issue_quote" : "rent_or_invoice_ids",
      quoteId: quoteRaw || undefined,
      invoiceCount: quoteRaw ? 0 : invoiceIds.length,
      invoiceIdsPreview: quoteRaw ? undefined : invoiceIds.slice(0, 5),
      locale,
    });
  }

  const response = await axiosClient.post<ApiResponse<string>>(url, body);
  const resBody = response.data;
  const link = typeof resBody?.data === "string" ? resBody.data.trim() : "";
  if (!resBody?.success || !link) {
    if (__DEV__) {
      console.warn("[VNPAY] createVnpayPaymentLink BE refused", {
        success: resBody?.success,
        message: typeof resBody?.message === "string" ? resBody.message.slice(0, 200) : resBody?.message,
      });
    }
    throw new Error(joinVnpayCreateLinkFailureMessage(resBody));
  }

  if (__DEV__) {
    try {
      const u = new URL(link);
      console.log("[VNPAY] createVnpayPaymentLink ok", {
        checkoutHost: u.host,
        pathname: u.pathname,
        linkLength: link.length,
      });
    } catch {
      console.log("[VNPAY] createVnpayPaymentLink ok", { linkLength: link.length });
    }
  }

  return link;
}
