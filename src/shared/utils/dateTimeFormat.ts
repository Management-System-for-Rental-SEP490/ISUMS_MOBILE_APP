/**
 * Chuẩn hóa hiển thị ngày/giờ trong app Tenant — gom format đã dùng rải rác để dễ bảo trì.
 * Quy tắc dùng file này: `.cursor/rules/010-architecture-conventions.mdc` (mục Ngày & giờ).
 */

const TENANT_ISSUE_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour12: false,
};

/** Ticket / câu hỏi: giờ:phút + ngày theo locale (fallback HH:mm, dd/mm/yyyy nếu Intl lỗi). */
export function formatTenantIssueDateTime(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    const s = d.toLocaleString(locale, TENANT_ISSUE_DATETIME_OPTIONS);
    if (s) return s;
  } catch {
    /* Hermes / Intl edge cases */
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * Chuỗi "X giây/phút/giờ/ngày trước" — key i18n notification.time_* với {{n}}.
 * @param useSubMinuteSeconds true = tenant (IoT); false = không dùng time_seconds (staff không có key đó).
 */
export function formatTimeAgoI18n(
  date: Date,
  t: (key: string, opts?: { n?: number }) => string,
  useSubMinuteSeconds = false
): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (useSubMinuteSeconds && diffSeconds < 60) {
    return t("notification.time_seconds", { n: Math.max(diffSeconds, 1) });
  }
  if (diffMins < 60) return t("notification.time_minutes", { n: diffMins || 1 });
  if (diffHours < 24) return t("notification.time_hours", { n: diffHours });
  return t("notification.time_days", { n: diffDays });
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Ngày local yyyy-mm-dd (key chọn ngày lọc thông báo). */
export function toLocalYyyyMmDd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Nhãn ngắn ngày/tháng số theo locale (datepicker 7 ngày). */
export function formatDayMonthNumeric(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

const CONTRACT_DAY_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

/** Giống `formatTenantIssueDateTime` — dùng cho chuỗi thời gian parse được thành `Date` local. */
const COMPACT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour12: false,
};

/**
 * `vnp_PayDate` từ VNPay: 14 ký tự `yyyyMMddHHmmss` — hiển thị theo locale (thành phần số là giờ địa phương).
 */
export function formatVnpPayDateFromGateway(raw: string, locale: string): string | null {
  const s = String(raw ?? "").trim();
  if (!/^\d{14}$/.test(s)) return null;
  const y = Number(s.slice(0, 4));
  const mo = Number(s.slice(4, 6)) - 1;
  const d = Number(s.slice(6, 8));
  const h = Number(s.slice(8, 10));
  const mi = Number(s.slice(10, 12));
  const sec = Number(s.slice(12, 14));
  const date = new Date(y, mo, d, h, mi, sec);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const out = date.toLocaleString(locale, COMPACT_DATETIME_OPTIONS);
    return out?.trim() ? out : null;
  } catch {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(mi)}, ${pad(d)}/${pad(mo + 1)}/${y}`;
  }
}

/** Ngày hợp đồng (bắt đầu/kết thúc) theo locale — ISO 8601 từ BE. */
export function formatTenantContractDay(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    const s = d.toLocaleDateString(locale, CONTRACT_DAY_OPTIONS);
    if (s) return s;
  } catch {
    /* Hermes / Intl edge cases */
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const VN_OFFSET_PARTS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

/**
 * Chuỗi `paidAt` gửi BE (ví dụ thanh toán tiền mặt ticket): giờ theo `Asia/Ho_Chi_Minh`, hậu tố `+07:00`, millis `.000`.
 * Dùng thay vì format tay trong màn hình — tuân quy tắc ngày giờ tập trung.
 */
export function formatPaidAtVietnamIsoForApi(d: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", VN_OFFSET_PARTS).formatToParts(d);
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }
    const y = map.year;
    const mo = map.month;
    const day = map.day;
    const h = map.hour;
    const mi = map.minute;
    const s = map.second;
    if (y && mo && day && h != null && mi != null && s != null) {
      return `${y}-${mo}-${day}T${h}:${mi}:${s}.000+07:00`;
    }
  } catch {
    /* fall through */
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000+07:00`;
}
