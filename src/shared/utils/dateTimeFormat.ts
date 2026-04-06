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
