import type { HouseFromApi } from "../types/api";

/** Rút gọn UUID / id căn để hiển thị khi không có tên từ my-access. */
export function shortHouseIdForDisplay(houseId: string): string {
  const h = String(houseId ?? "").trim();
  if (!h) return "—";
  return h.length > 10 ? `${h.slice(0, 8)}…` : h;
}

/** Tập `houseId` có trong GET /houses/my-access. */
export function tenantAccessibleHouseIdSet(tenantHouses: HouseFromApi[]): Set<string> {
  const s = new Set<string>();
  for (const row of tenantHouses) {
    const id = String(row.id ?? "").trim();
    if (id) s.add(id);
  }
  return s;
}

/** Căn có `houseId` nhưng không nằm trong danh sách my-access. */
export function isHouseIdOutsideTenantAccess(
  houseId: string | null | undefined,
  accessIds: Set<string>
): boolean {
  const h = String(houseId ?? "").trim();
  if (!h) return false;
  return !accessIds.has(h);
}

type InvoiceHouseMeta = { houseId?: string | null; houseName?: string | null };

/** Lấy `houseName` từ bản ghi hóa đơn (BE có thể trả kèm). */
export function pickHouseDisplayLabelFromInvoices(
  invoices: InvoiceHouseMeta[],
  houseId: string
): string | null {
  const hid = String(houseId ?? "").trim();
  if (!hid) return null;
  for (const inv of invoices) {
    if (String(inv.houseId ?? "").trim() !== hid) continue;
    const n = String(inv.houseName ?? "").trim();
    if (n.length > 0) return n;
  }
  return null;
}

export type TenantHouseFilterOption = {
  id: string;
  label: string;
  /** Chỉ có trên hóa đơn/hợp đồng — không còn trong my-access. */
  notInAccessList: boolean;
};

/**
 * Gộp nhà từ my-access với `houseId` lệch (hợp đồng, hóa đơn).
 * Nhãn ưu tiên: tên my-access → `houseName` trên invoice → id rút gọn.
 */
export function buildTenantHouseFilterOptions(
  tenantHouses: HouseFromApi[],
  fallbackHouseIds: string[],
  invoicesForNames: InvoiceHouseMeta[]
): TenantHouseFilterOption[] {
  const accessSet = tenantAccessibleHouseIdSet(tenantHouses);
  const options: TenantHouseFilterOption[] = [];

  for (const h of tenantHouses) {
    const id = String(h.id ?? "").trim();
    if (!id) continue;
    const name = String(h.name ?? "").trim();
    options.push({
      id,
      label: name.length ? name : shortHouseIdForDisplay(id),
      notInAccessList: false,
    });
  }

  const uniqueFallback = [
    ...new Set(fallbackHouseIds.map((x) => String(x ?? "").trim()).filter(Boolean)),
  ].filter((id) => !accessSet.has(id));

  for (const id of uniqueFallback) {
    const fromInv = pickHouseDisplayLabelFromInvoices(invoicesForNames, id);
    options.push({
      id,
      label: fromInv ?? shortHouseIdForDisplay(id),
      notInAccessList: true,
    });
  }

  options.sort((a, b) => a.id.localeCompare(b.id));
  return options;
}

export function houseLabelByIdFromFilterOptions(
  options: TenantHouseFilterOption[]
): Map<string, string> {
  const m = new Map<string, string>();
  for (const o of options) m.set(o.id, o.label);
  return m;
}

/**
 * Bổ sung tên từ GET /houses/{id} cho chip căn «mồ côi» khi hóa đơn không có `houseName`.
 */
export function enrichTenantHouseOptionsWithByIdApi(
  tenantHouses: HouseFromApi[],
  fallbackHouseIds: string[],
  invoicesForNames: InvoiceHouseMeta[],
  namesByIdFromApi: Map<string, string>
): TenantHouseFilterOption[] {
  const base = buildTenantHouseFilterOptions(
    tenantHouses,
    fallbackHouseIds,
    invoicesForNames
  );
  if (namesByIdFromApi.size === 0) return base;
  return base.map((o) => {
    if (!o.notInAccessList) return o;
    if (pickHouseDisplayLabelFromInvoices(invoicesForNames, o.id)) return o;
    const api = namesByIdFromApi.get(o.id)?.trim();
    if (!api) return o;
    return { ...o, label: api };
  });
}
