import type { TenantInvoiceFromApi } from "../types/api";

export function isTenantInvoicePayable(status: string | undefined): boolean {
  const u = String(status ?? "").trim().toUpperCase();
  if (u === "PAID" || u === "SETTLED" || u === "COMPLETED" || u === "CANCELLED" || u === "VOID") {
    return false;
  }
  return true;
}

export function formatTenantInvoiceAmount(
  amount: number,
  currency: string | undefined,
  locale: string
): string {
  const cur = (currency ?? "VND").trim().toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur === "VND" ? "VND" : cur,
      maximumFractionDigits: cur === "VND" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
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
