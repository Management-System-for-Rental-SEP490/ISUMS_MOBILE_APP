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
