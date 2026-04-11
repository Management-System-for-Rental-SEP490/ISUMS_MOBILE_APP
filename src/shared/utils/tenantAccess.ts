import type {
  HouseFromApi,
  TenantHouseAccessFromApi,
  TenantHouseAccessStatus,
  TenantInvoiceFromApi,
} from "../types/api";
import { isTenantInvoicePayable, isTenantInvoiceRentOrDepositType } from "./tenantInvoice";

/** Chặn dùng app theo GET /api/houses/my-access: handover/deposit hoặc PAYMENT_RESTRICTED + hóa đơn cọc/thuê. */
export type TenantAccessBlockKind = "handover" | "deposit" | "payment_restricted";

/**
 * Map một phần tử my-access sang HouseFromApi (id = houseId, name = houseName).
 */
export function mapTenantAccessItemToHouse(
  item: TenantHouseAccessFromApi
): HouseFromApi {
  return {
    id: item.houseId,
    userRentalId: null,
    name: item.houseName,
    address: item.address ?? "",
    status: "RENTED",
    handoverDate: item.handoverDate,
    accessStatus: item.accessStatus,
    accessReason: item.reason ?? undefined,
    hasUnpaidInvoice: item.hasUnpaidInvoice ?? false,
    pendingInvoiceId: item.pendingInvoiceId ?? undefined,
    memberRole: item.memberRole,
    contractDocuments: item.contractDocuments,
  };
}

/** Đã tới hoặc qua ngày bàn giao theo lịch local (so sánh phần ngày). */
export function isHandoverDateReached(handoverDate?: string | null): boolean {
  if (!handoverDate?.trim()) return true;
  const d = new Date(handoverDate);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  const ymd = (x: Date) =>
    x.getFullYear() * 10_000 + (x.getMonth() + 1) * 100 + x.getDate();
  return ymd(now) >= ymd(d);
}

/**
 * Loại chặn tính năng đầy đủ theo `accessStatus` từ my-access. `null` = không chặn (kể cả PENDING_FIRST_RENT: vào được, nhắc ở banner).
 * `PAYMENT_RESTRICTED`: cần `invoices` để xác nhận có hóa đơn DEPOSIT/MONTHLY_RENT còn phải trả trên đúng căn.
 */
export function getTenantAccessBlock(
  house: HouseFromApi | null | undefined,
  invoices?: TenantInvoiceFromApi[]
): TenantAccessBlockKind | null {
  if (!house) return null;
  const st = (house.accessStatus ?? "").trim().toUpperCase();

  if (st === "PENDING_DEPOSIT") return "deposit";
  if (st === "PENDING_HANDOVER") return "handover";

  if (st === "PAYMENT_RESTRICTED") {
    const hid = String(house.id ?? "").trim();
    if (!hid || !Array.isArray(invoices) || invoices.length === 0) {
      if (typeof __DEV__ !== "undefined" && __DEV__) {
        // eslint-disable-next-line no-console
        console.warn("[TenantAccess] PAYMENT_RESTRICTED but no invoices to match rent/deposit");
      }
      return null;
    }
    const hasMatch = invoices.some(
      (inv) =>
        String(inv.houseId ?? "").trim() === hid &&
        isTenantInvoiceRentOrDepositType(inv) &&
        isTenantInvoicePayable(inv.status)
    );
    if (hasMatch) return "payment_restricted";
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[TenantAccess] PAYMENT_RESTRICTED but no unpaid DEPOSIT/MONTHLY_RENT for house");
    }
    return null;
  }

  return null;
}

/** Chưa bàn giao theo API — dùng cho NFC/quét; không phụ thuộc thứ tự ưu tiên banner thanh toán ở trên. */
export function isTenantHandoverStatusPending(
  house: HouseFromApi | null | undefined
): boolean {
  if (!house) return false;
  return (house.accessStatus ?? "").trim().toUpperCase() === "PENDING_HANDOVER";
}

/**
 * Dịch `reason` / `accessStatus` từ API sang câu thân thiện.
 * Không trả về mã thô (ví dụ ACCESS_PENDING_FIRST_RENT) khi thiếu key — để UI fallback sang `home.access.*_body`.
 */
export function translateTenantAccessReason(
  accessReason: string | null | undefined,
  accessStatus: string | null | undefined,
  t: (key: string) => string
): string {
  const codes: string[] = [];
  const push = (s?: string | null) => {
    const u = String(s ?? "").trim().toUpperCase();
    if (!u) return;
    codes.push(u);
    if (u.startsWith("PENDING_") && !u.startsWith("ACCESS_")) {
      codes.push(`ACCESS_${u}`);
    }
    if (u.startsWith("ACCESS_PENDING_")) {
      codes.push(u.replace(/^ACCESS_/, ""));
    }
  };
  push(accessReason);
  push(accessStatus);
  const seen = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    const key = `home.access_reason.${code}`;
    const label = t(key);
    if (label !== key) return label;
  }
  return "";
}

/** Nhãn hiển thị `accessStatus` từ my-access (fallback: mã gốc). */
export function formatTenantAccessStatusForDisplay(
  status: TenantHouseAccessStatus | string | undefined,
  t: (key: string) => string
): string {
  const u = String(status ?? "").trim().toUpperCase();
  if (!u) return "—";
  const key = `home.house_access_status.${u}`;
  const label = t(key);
  if (label !== key) return label;
  return String(status ?? "").trim() || "—";
}

/** Nhãn vai trò thành viên (OWNER, …). */
export function formatTenantMemberRoleForDisplay(
  role: string | undefined,
  t: (key: string) => string
): string {
  const u = String(role ?? "").trim().toUpperCase();
  if (!u) return "—";
  const key = `home.house_member_role.${u}`;
  const label = t(key);
  if (label !== key) return label;
  return String(role ?? "").trim();
}
