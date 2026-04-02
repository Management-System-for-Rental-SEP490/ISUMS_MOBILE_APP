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
 * Gửi toàn bộ query từ URL redirect VNPay lên BE (GET /api/payments/vnpay/return?...).
 * Chỉ tin `success` / `message` / `data` từ response — không tin query đã qua DevTools.
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
  const requestUrl = `${BACKEND_API_BASE}/payments/vnpay/return${search}`;
  const response = await axiosClient.get<ApiResponse<string>>(requestUrl);
  return response.data;
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
  language?: string;
  /** Ngôn ngữ hiện tại của app (react-i18next `i18n.language`). */
  appLanguage?: string;
};

/**
 * Tạo link thanh toán VNPay (POST /api/payments/vnpay).
 * @returns URL sandbox/production để mở trong WebView / trình duyệt.
 */
export async function createVnpayPaymentLink(
  invoiceIds: string[],
  options?: CreateVnpayPaymentLinkOptions
): Promise<string> {
  const ids = [...new Set(invoiceIds.map((x) => String(x).trim()).filter(Boolean))];
  if (ids.length === 0) {
    throw new Error("NO_INVOICE_IDS");
  }
  const language =
    options?.language?.trim() ||
    resolveVnpayPaymentLanguage(options?.appLanguage);

  const url = `${BACKEND_API_BASE}/payments/vnpay`;
  const body: VnpayPaymentCreateRequest = {
    invoiceIds: ids,
    language,
  };
  const response = await axiosClient.post<ApiResponse<string>>(url, body);
  const payload = response.data;
  const link = typeof payload?.data === "string" ? payload.data.trim() : "";
  if (!payload?.success || !link) {
    const msg =
      payload?.message ||
      payload?.errors?.[0]?.message ||
      "Không tạo được link thanh toán";
    throw new Error(msg);
  }
  return link;
}
