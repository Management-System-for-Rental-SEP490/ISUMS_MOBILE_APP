import type { InvoicePaymentAttemptFromApi, TenantInvoiceFromApi } from "../types/api";
import { formatVndDisplay } from "./currencyFormat";

/**
 * Dịch mã loại hóa đơn từ BE (vd. MONTHLY_RENT) qua `tenant_invoice.type_<CODE>`.
 * Không có key → trả về chuỗi gốc (trim).
 */
export function translateTenantInvoiceTypeCode(
  code: string | null | undefined,
  t: (key: string) => string
): string {
  const raw = String(code ?? "").trim();
  if (!raw) return "";
  const norm = raw.toUpperCase().replace(/\s+/g, "_");
  const key = `tenant_invoice.type_${norm}`;
  const label = t(key);
  if (label !== key) return label;
  return raw;
}

/**
 * Tiêu đề hiển thị: ưu tiên `type` + `periodKey`; nếu thiếu `type` thì bóc `title` (có thể dạng "MONTHLY_RENT - kỳ").
 */
export function formatTenantInvoiceTitleForDisplay(
  inv: Pick<TenantInvoiceFromApi, "title" | "type" | "periodKey" | "id">,
  t: (key: string) => string
): string {
  const id = String(inv.id ?? "").trim();
  const typeRaw = String(inv.type ?? "").trim();
  const period = String(inv.periodKey ?? "").trim();

  if (typeRaw) {
    const typeLabel = translateTenantInvoiceTypeCode(typeRaw, t);
    if (period) return `${typeLabel} - ${period}`;
    return typeLabel;
  }

  const titleRaw = String(inv.title ?? "").trim();
  if (!titleRaw || titleRaw === id) {
    return t("tenant_invoice.invoice_placeholder_title");
  }
  const parts = titleRaw
    .split(/\s*-\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return t("tenant_invoice.invoice_placeholder_title");
  const headTr = translateTenantInvoiceTypeCode(parts[0]!, t);
  if (parts.length === 1) return headTr;
  return [headTr, ...parts.slice(1)].join(" - ");
}

/**
 * Tiêu đề trên thẻ (list / hero): chỉ nhãn loại đã dịch; không ghép `periodKey` dạng RENT_….
 * Khi chỉ có `title` từ BE: bỏ các đoạn RENT_* và token DEPOSIT thô (đã dịch ở phần đầu).
 */
export function formatTenantInvoiceCardTitle(
  inv: Pick<TenantInvoiceFromApi, "title" | "type" | "periodKey" | "id">,
  t: (key: string) => string
): string {
  const typeRaw = String(inv.type ?? "").trim();
  if (typeRaw) {
    return translateTenantInvoiceTypeCode(typeRaw, t);
  }
  const titleRaw = String(inv.title ?? "").trim();
  const id = String(inv.id ?? "").trim();
  if (!titleRaw || titleRaw === id) {
    return t("tenant_invoice.invoice_placeholder_title");
  }
  const parts = titleRaw
    .split(/\s*-\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return t("tenant_invoice.invoice_placeholder_title");
  const head = translateTenantInvoiceTypeCode(parts[0]!, t);
  const extra = parts.slice(1).filter((p) => {
    const u = p.toUpperCase();
    if (/^RENT_/i.test(p)) return false;
    if (u === "DEPOSIT") return false;
    return true;
  });
  if (extra.length === 0) return head;
  return [head, ...extra].join(" - ");
}

/** Hóa đơn gắn ticket sửa chữa (BE trả `issueTicketId` / tương đương trên list). */
export function isTenantTicketIssueInvoice(inv: Pick<TenantInvoiceFromApi, "issueTicketId">): boolean {
  return String(inv.issueTicketId ?? "").trim().length > 0;
}

/** Hóa đơn loại ISSUE từ BE (`type`: "ISSUE") — phí ticket, không tính vào tiền nhà theo tháng. */
export function isTenantInvoiceIssueType(inv: Pick<TenantInvoiceFromApi, "type">): boolean {
  return String(inv.type ?? "").trim().toUpperCase() === "ISSUE";
}

/** Tiền cọc / tiền thuê định kỳ — dùng với PAYMENT_RESTRICTED. */
export function isTenantInvoiceRentOrDepositType(inv: Pick<TenantInvoiceFromApi, "type">): boolean {
  const n = String(inv.type ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  return n === "MONTHLY_RENT" || n === "DEPOSIT";
}

/** Phí sửa chữa / ticket: mở màn `TenantIssueInvoice`, không dùng chi tiết hóa đơn tiền nhà. */
export function isTenantRepairInvoiceFlow(
  inv: Pick<TenantInvoiceFromApi, "issueTicketId" | "type">
): boolean {
  return isTenantTicketIssueInvoice(inv) || isTenantInvoiceIssueType(inv);
}

/**
 * Còn hóa đơn tiền nhà/cọc chưa trả trên căn — **không** tính hóa đơn issue (`type`: ISSUE hoặc gắn ticket).
 * Dùng banner / nhắc thanh toán tiền nhà; **không** dùng để chặn vào nhà (chặn theo `accessStatus` từ my-access).
 */
export function tenantHouseHasUnpaidRentExcludingIssue(
  invoices: TenantInvoiceFromApi[],
  houseId: string
): boolean {
  const hid = String(houseId ?? "").trim();
  if (!hid) return false;
  return invoices.some(
    (inv) =>
      String(inv.houseId ?? "").trim() === hid &&
      isTenantInvoicePayable(inv.status) &&
      !isTenantRepairInvoiceFlow(inv)
  );
}

export function isTenantInvoicePayable(status: string | undefined): boolean {
  const u = String(status ?? "").trim().toUpperCase();
  if (
    u === "PAID" ||
    u === "SETTLED" ||
    u === "COMPLETED" ||
    u === "SUCCESS" ||
    u === "CANCELLED" ||
    u === "VOID"
  ) {
    return false;
  }
  return true;
}

export function formatTenantInvoiceAmount(
  amount: number,
  currency: string | undefined,
  locale: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const cur = (currency ?? "VND").trim().toUpperCase();
  if (cur === "VND") {
    return formatVndDisplay(amount, locale, t);
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
}

/** Chỉ các lượt đã thành công (BE `status: SUCCESS`) — hiển thị lịch sử cho user. */
export function filterSuccessfulPayments(
  payments: InvoicePaymentAttemptFromApi[] | undefined
): InvoicePaymentAttemptFromApi[] {
  if (!payments?.length) return [];
  return [...payments]
    .filter((p) => String(p.status ?? "").trim().toUpperCase() === "SUCCESS")
    .sort((a, b) => {
      const ta = new Date(a.paidAt ?? a.createdAt ?? 0).getTime();
      const tb = new Date(b.paidAt ?? b.createdAt ?? 0).getTime();
      if (ta !== tb) return ta - tb;
      return String(a.id).localeCompare(String(b.id));
    });
}

/**
 * Tóm tắt một dòng — chỉ dựa trên giao dịch SUCCESS.
 * Một lượt: phương thức · số tiền; nhiều lượt: chuỗi dịch theo count.
 */
export function buildInvoicePaymentFlowSummary(
  payments: InvoicePaymentAttemptFromApi[] | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string,
  currency: string = "VND"
): string {
  const success = filterSuccessfulPayments(payments);
  if (success.length === 0) return "";

  const methodLabel = (m: string) => {
    const u = String(m ?? "").trim().toUpperCase();
    const mk = `tenant_invoice.payment_method_${u}`;
    const label = t(mk);
    return label !== mk ? label : m.trim() || "—";
  };

  if (success.length === 1) {
    const p = success[0]!;
    const amt = formatTenantInvoiceAmount(Number(p.amount ?? 0), currency, locale, t);
    return `${methodLabel(p.method)} · ${amt}`;
  }
  return t("tenant_invoice.payment_flow_success_count", { count: success.length });
}

export function filterPayableInvoices(items: TenantInvoiceFromApi[]): TenantInvoiceFromApi[] {
  return items.filter((x) => isTenantInvoicePayable(x.status));
}

const MS_PER_DAY = 86400000;

/**
 * Hóa đơn còn phải trả và có `dueDate` trong vòng `withinDays` ngày (kể cả quá hạn).
 * Tiền nhà / ticket issue đều nằm chung danh sách invoice — lọc theo trạng thái payable + hạn.
 */
export function isTenantInvoiceDueUrgent(
  inv: TenantInvoiceFromApi,
  withinDays: number = 7
): boolean {
  if (!isTenantInvoicePayable(inv.status)) return false;
  const raw = inv.dueDate;
  if (raw == null || String(raw).trim() === "") return false;
  const due = new Date(raw).getTime();
  if (!Number.isFinite(due)) return false;
  return due <= Date.now() + withinDays * MS_PER_DAY;
}

/** Sắp xếp theo căn (houseId), trong cùng căn: chưa thanh toán trước, rồi theo hạn. */
export function sortTenantInvoicesForDisplay(items: TenantInvoiceFromApi[]): TenantInvoiceFromApi[] {
  return [...items].sort((a, b) => {
    const ha = String(a.houseId ?? "");
    const hb = String(b.houseId ?? "");
    if (ha !== hb) return ha.localeCompare(hb);
    const ap = isTenantInvoicePayable(a.status) ? 0 : 1;
    const bp = isTenantInvoicePayable(b.status) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    if (da !== db) return da - db;
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Mốc thời gian gần nhất cho hóa đơn gắn ticket (đệ quy: đã trả → phát hành → tạo).
 * Dùng để xếp "ticket xử lý / phát sinh hóa đơn" mới nhất lên trước khi BE chưa trả `ticket.updatedAt` trên invoice.
 */
function tenantIssueInvoiceActivityMs(inv: TenantInvoiceFromApi): number {
  let max = 0;
  for (const raw of [inv.paidAt, inv.issuedAt, inv.createdAt]) {
    const t = raw != null && String(raw).trim() ? new Date(raw).getTime() : NaN;
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max;
}

/** Hóa đơn sửa chữa (`issueTicketId`): mới nhất theo hoạt động xử lý / thanh toán trước. */
export function sortTenantIssueInvoicesByTicketActivityDesc(
  items: TenantInvoiceFromApi[]
): TenantInvoiceFromApi[] {
  return [...items].sort((a, b) => {
    const ta = tenantIssueInvoiceActivityMs(a);
    const tb = tenantIssueInvoiceActivityMs(b);
    if (tb !== ta) return tb - ta;
    return String(a.id).localeCompare(String(b.id));
  });
}
