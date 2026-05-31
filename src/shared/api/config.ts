// Một base REST duy nhất: EXPO_PUBLIC_BACKEND_API_PRIMARY (Keycloak / AWS IoT là host khác).

/**
 * Thời gian chờ tối đa (ms) cho mọi luồng tải dữ liệu (axios, pull-to-refresh/refetch, IoT REST usage…).
 * Đây là **trần**, không phải thời lượng tối thiểu: BE trả về sớm thì hiển thị ngay, không ép chờ 4 giây.
 * Quá hạn mà chưa có phản hồi hợp lệ → coi như không có dữ liệu; người dùng tải lại (vào lại trang / kéo refresh).
 */
export const DATA_LOAD_TIMEOUT_MS = 6000 as const;

/** Cùng giá trị với {@link DATA_LOAD_TIMEOUT_MS} — `axios` dùng làm `timeout` (hủy request nếu quá lâu). */
export const API_REQUEST_TIMEOUT_MS = DATA_LOAD_TIMEOUT_MS;

/**
 * Sau hydrate + đăng nhập: invalidate cache một lần — chỉ lịch làm mới nền, không ép delay hiển thị UI.
 */
export const APP_BACKGROUND_SOFT_INVALIDATE_DELAY_MS = 2_000 as const;

/**
 * React Query — `staleTime` mặc định (chuyển màn / remount / kéo refresh).
 * Hai hook danh sách ticket staff & tenant giữ `staleTime: Infinity` + poll riêng.
 */
export const QUERY_DEFAULT_STALE_TIME_MS = 5_000 as const;

/** Cùng contract `queryKey` với app Staff (đợt invalidate nền bỏ qua hai danh sách ticket). */
export function isIssueTicketStaffOrTenantListQueryKey(queryKey: readonly unknown[]): boolean {
  if (queryKey[0] !== "issues") return false;
  if (queryKey[1] === "tickets" && queryKey[2] === "staff") return true;
  if (queryKey[1] === "tenantTickets" && queryKey[2] === "list") return true;
  return false;
}

/**
 * Chu kỳ poll GET khi màn đang mở — đồng bộ với Staff app (`STAFF_FOREGROUND_GET_POLL_MS`).
 * Ticket, hóa đơn, thông báo fallback, REST tiêu thụ điện/nước theo căn đang hiển thị…
 */
export const APP_FOREGROUND_GET_POLL_MS = 5000 as const;

/**
 * Poll GET danh sách ticket tenant (list + responses cùng bundle) — 9s; khớp staff `STAFF_TICKET_LIST_POLL_MS`.
 * Các query chi tiết / hóa đơn / IoT vẫn dùng {@link APP_FOREGROUND_GET_POLL_MS}.
 */
export const TENANT_TICKET_LIST_POLL_MS = 9_000 as const;

/**
 * Timeout dài hơn cho GET danh sách issues không phân trang (ticket tenant + responses):
 * payload lớn và nén (vd. zstd) → download + JSON.parse có thể vượt {@link DATA_LOAD_TIMEOUT_MS}.
 * Chỉ truyền vào các request trong `issuesApi` tương ứng — không nâng timeout mặc định toàn app.
 */
export const ISSUES_TENANT_LIST_TIMEOUT_MS = 90_000 as const;

function readEnvTrimmed(envKey: string): string {
  const v =
    typeof process !== "undefined" && process.env?.[envKey]
      ? String(process.env[envKey]).trim()
      : "";
  return v;
}

export const PRIMARY_BACKEND_URL = readEnvTrimmed("EXPO_PUBLIC_BACKEND_API_PRIMARY");

export const BACKEND_URL_PRIMARY = PRIMARY_BACKEND_URL;

/** Base REST duy nhất (users, nhà, `/assets/*`, …). `.env`: `EXPO_PUBLIC_BACKEND_API_PRIMARY`. */
export const BACKEND_API_BASE = PRIMARY_BACKEND_URL;

/** Alias cho IoT forecast API — đi qua axiosClient + Bearer token chung. */
export const ASSETS_API_BASE = PRIMARY_BACKEND_URL;

/** WebSocket telemetry — `.env`: `EXPO_PUBLIC_IOT_WS_URL` */
export const IOT_WS_URL = readEnvTrimmed("EXPO_PUBLIC_IOT_WS_URL");

/** REST usage điện/nước — `.env`: `EXPO_PUBLIC_IOT_REST_BASE` */
export const IOT_REST_BASE = readEnvTrimmed("EXPO_PUBLIC_IOT_REST_BASE");

/**
 * Legacy: URL template tự ghép (trước khi có POST /api/payments/vnpay).
 * Luồng tenant hiện dùng `createVnpayPaymentLink` trong `tenantPaymentApi.ts`.
 */
export const TENANT_PAYMENT_URL_TEMPLATE = readEnvTrimmed(
  "EXPO_PUBLIC_TENANT_PAYMENT_URL_TEMPLATE"
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
  const n = Number.isFinite(v) ? v : APP_FOREGROUND_GET_POLL_MS;
  return Math.min(300_000, Math.max(APP_FOREGROUND_GET_POLL_MS, n));
})();

/** Khoảng poll fallback — mặc định cùng {@link APP_FOREGROUND_GET_POLL_MS}, clamp ≥ 5s. */
export const NOTIFICATION_POLL_INTERVAL_MS = rawPollMs;

/**
 * BE đã có PATCH read-all hay chưa — tick trên Swagger trước khi bật true.
 * false: không render nút "đọc hết" (tránh 404).
 */
export const NOTIFICATION_READ_ALL_AVAILABLE = readEnvBool(
  "EXPO_PUBLIC_NOTIFICATION_READ_ALL_AVAILABLE",
  false
);

/** URL stream (SSE/WS) — tùy chọn trong `.env`. */
export const NOTIFICATION_STREAM_URL = readEnvTrimmed("EXPO_PUBLIC_NOTIFICATION_STREAM_URL");

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
