// PRIMARY = API chung (users, houses, schedules…). FALLBACK/ngrok = bản dev cục bộ.
// Module asset (/assets/*) mặc định gọi ASSETS_API_BASE (= fallback); đổi sau qua env.

/**
 * Thời gian chờ tối đa (ms) cho mọi luồng tải dữ liệu (axios, pull-to-refresh/refetch, IoT REST usage…).
 * Đây là **trần**, không phải thời lượng tối thiểu: BE trả về sớm thì hiển thị ngay, không ép chờ 4 giây.
 * Quá hạn mà chưa có phản hồi hợp lệ → coi như không có dữ liệu; người dùng tải lại (vào lại trang / kéo refresh).
 */
export const DATA_LOAD_TIMEOUT_MS = 4000 as const;

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
  BACKEND_API_BASE
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

// --- Notification domain (REST + optional realtime/push) — defensive defaults ---

function readEnvBool(envKey: string, fallback: boolean): boolean {
  const v =
    typeof process !== "undefined" && process.env?.[envKey] !== undefined
      ? String(process.env[envKey]).trim().toLowerCase()
      : "";
  if (v === "") return fallback;
  return v === "1" || v === "true" || v === "yes";
}

/** Bật kết nối SSE/WS tới BE — mặc định false tới khi BE confirm endpoint. */
export const NOTIFICATION_REALTIME_ENABLED = readEnvBool(
  "EXPO_PUBLIC_NOTIFICATION_REALTIME_ENABLED",
  false
);

/** Đăng ký FCM/APNs qua POST device-tokens — mặc định false. */
export const NOTIFICATION_DEVICE_TOKEN_ENABLED = readEnvBool(
  "EXPO_PUBLIC_NOTIFICATION_DEVICE_TOKEN_ENABLED",
  false
);

/** Poll REST khi stream tắt/lỗi — mặc định true. */
export const NOTIFICATION_POLL_FALLBACK_ENABLED = readEnvBool(
  "EXPO_PUBLIC_NOTIFICATION_POLL_FALLBACK_ENABLED",
  true
);

const rawPollMs = (() => {
  const v =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS
      ? Number(process.env.EXPO_PUBLIC_NOTIFICATION_POLL_INTERVAL_MS)
      : NaN;
  const n = Number.isFinite(v) ? v : 20000;
  return Math.min(30_000, Math.max(10_000, n));
})();

/** Khoảng poll fallback (ms), clamp 10_000..30_000. */
export const NOTIFICATION_POLL_INTERVAL_MS = rawPollMs;

/**
 * BE đã có PATCH read-all hay chưa — tick trên Swagger trước khi bật true.
 * false: không render nút "đọc hết" (tránh 404).
 */
export const NOTIFICATION_READ_ALL_AVAILABLE = readEnvBool(
  "EXPO_PUBLIC_NOTIFICATION_READ_ALL_AVAILABLE",
  false
);

/** URL stream (SSE/WS) — để trống nếu chưa có BE. */
export const NOTIFICATION_STREAM_URL = readEnvTrimmed(
  "EXPO_PUBLIC_NOTIFICATION_STREAM_URL",
  ""
);

const rawIdleMs = (() => {
  const v =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_NOTIFICATION_STREAM_IDLE_MS
      ? Number(process.env.EXPO_PUBLIC_NOTIFICATION_STREAM_IDLE_MS)
      : NaN;
  const n = Number.isFinite(v) ? v : 180_000;
  return Math.min(600_000, Math.max(60_000, n));
})();

/**
 * Không nhận byte nào từ SSE trong khoảng này → coi như kết nối chết, reconnect (backoff).
 * BE nên gửi heartbeat/comment định kỳ để tránh disconnect oan.
 */
export const NOTIFICATION_STREAM_IDLE_MS = rawIdleMs;

const rawStreamMaxRetries = (() => {
  const v =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_NOTIFICATION_STREAM_MAX_RETRIES
      ? Number(process.env.EXPO_PUBLIC_NOTIFICATION_STREAM_MAX_RETRIES)
      : NaN;
  const n = Number.isFinite(v) ? v : 12;
  return Math.min(50, Math.max(1, Math.floor(n)));
})();

/** Giới hạn vòng reconnect (5xx/mạng/idle); 4xx fatal không tính. */
export const NOTIFICATION_STREAM_MAX_RETRIES = rawStreamMaxRetries;

const rawMalformed = (() => {
  const v =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_NOTIFICATION_STREAM_MAX_MALFORMED_STREAK
      ? Number(process.env.EXPO_PUBLIC_NOTIFICATION_STREAM_MAX_MALFORMED_STREAK)
      : NaN;
  const n = Number.isFinite(v) ? v : 20;
  return Math.min(100, Math.max(5, Math.floor(n)));
})();

/** Số dòng `data:` parse lỗi liên tiếp trước khi đóng SSE (tránh drop 1 chunk oan). */
export const NOTIFICATION_STREAM_MAX_MALFORMED_STREAK = rawMalformed;
