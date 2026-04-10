// PRIMARY = API chung (users, houses, schedules…). FALLBACK/ngrok = bản dev cục bộ.
// Module asset (/assets/*) mặc định gọi ASSETS_API_BASE (= fallback); đổi sau qua env.

/**
 * Thời gian chờ tối đa (ms) cho mọi luồng tải dữ liệu (axios, pull-to-refresh/refetch, IoT REST usage…).
 * Đây là **trần**, không phải thời lượng tối thiểu: BE trả về sớm thì hiển thị ngay, không ép chờ 8 giây.
 * Quá hạn mà chưa có phản hồi hợp lệ → coi như không có dữ liệu; người dùng tải lại (vào lại trang / kéo refresh).
 */
export const DATA_LOAD_TIMEOUT_MS = 8000 as const;

/** Cùng giá trị với {@link DATA_LOAD_TIMEOUT_MS} — `axios` dùng làm `timeout` (hủy request nếu quá lâu). */
export const API_REQUEST_TIMEOUT_MS = DATA_LOAD_TIMEOUT_MS;

const DEFAULT_PRIMARY = "https://api.isums.pro/api";
const DEFAULT_FALLBACK = "https://unrestrictable-lan-syzygial.ngrok-free.dev/api";

function readEnvTrimmed(envKey: string, fallback: string): string {
  const v =
    typeof process !== "undefined" && process.env?.[envKey]
      ? String(process.env[envKey]).trim()
      : "";
  return v || fallback;
}

export const PRIMARY_BACKEND_URL = readEnvTrimmed(
  "EXPO_PUBLIC_BACKEND_API_PRIMARY",
  DEFAULT_PRIMARY
);

export const FALLBACK_BACKEND_URL = readEnvTrimmed(
  "EXPO_PUBLIC_BACKEND_API_FALLBACK",
  DEFAULT_FALLBACK
);

/** Alias cho interceptor axios — trùng PRIMARY / FALLBACK. */
export const BACKEND_URL_PRIMARY = PRIMARY_BACKEND_URL;
export const BACKEND_URL_FALLBACK = FALLBACK_BACKEND_URL;

/** Base cho users, houses, Keycloak-adjacent REST — luôn primary; axios lỗi mạng → retry FALLBACK. */
export const BACKEND_API_BASE = PRIMARY_BACKEND_URL;

/**
 * Base cho mọi route `/assets/*` (items, tags, categories, IoT trong asset module).
 * Mặc định = FALLBACK (ngrok). Khi merge lên primary: `EXPO_PUBLIC_ASSETS_API_BASE` = URL primary.
 */
export const ASSETS_API_BASE = readEnvTrimmed(
  "EXPO_PUBLIC_ASSETS_API_BASE",
  FALLBACK_BACKEND_URL
);

const DEFAULT_IOT_WS =
  "wss://a98erfaotg.execute-api.ap-southeast-1.amazonaws.com/production/";
const DEFAULT_IOT_REST =
  "https://m0etrbg5l2.execute-api.ap-southeast-1.amazonaws.com/dev";

/** WebSocket telemetry AWS — khai báo trong .env EXPO_PUBLIC_IOT_WS_URL */
export const IOT_WS_URL = readEnvTrimmed("EXPO_PUBLIC_IOT_WS_URL", DEFAULT_IOT_WS);

/** REST usage điện/nước — khai báo trong .env EXPO_PUBLIC_IOT_REST_BASE */
export const IOT_REST_BASE = readEnvTrimmed(
  "EXPO_PUBLIC_IOT_REST_BASE",
  DEFAULT_IOT_REST
);

/**
 * Legacy: URL template tự ghép (trước khi có POST /api/payments/vnpay).
 * Luồng tenant hiện dùng `createVnpayPaymentLink` trong `tenantPaymentApi.ts`.
 */
export const TENANT_PAYMENT_URL_TEMPLATE = readEnvTrimmed(
  "EXPO_PUBLIC_TENANT_PAYMENT_URL_TEMPLATE",
  ""
);
