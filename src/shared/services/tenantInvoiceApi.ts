import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type { ApiResponse, TenantInvoiceFromApi } from "../types/api";

type TenantInvoiceApiRow = {
  id: string;
  contractId?: string | null;
  houseId?: string | null;
  type?: string | null;
  periodKey?: string | null;
  totalAmount?: number | null;
  baseAmount?: number | null;
  penaltyAmount?: number | null;
  status?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
};

type TenantInvoicesApiResponse = ApiResponse<TenantInvoiceApiRow[]>;

function mapTenantInvoiceRow(row: TenantInvoiceApiRow): TenantInvoiceFromApi {
  const type = String(row.type ?? "").trim();
  const periodKey = String(row.periodKey ?? "").trim();
  const titleFromApi = [type, periodKey].filter((x) => x.length > 0).join(" - ");

  return {
    id: String(row.id ?? "").trim(),
    title: titleFromApi || String(row.id ?? "").trim(),
    amount: Number(row.totalAmount ?? 0),
    currency: "VND",
    dueDate: row.dueDate ?? null,
    issuedAt: row.createdAt ?? null,
    paidAt: row.paidAt ?? null,
    status: String(row.status ?? "").trim().toUpperCase() || "UNPAID",
    houseId: row.houseId ?? null,
    notes: null,
    contractId: row.contractId ?? null,
    type: type || null,
    periodKey: periodKey || null,
    totalAmount: Number(row.totalAmount ?? 0),
    baseAmount: Number(row.baseAmount ?? 0),
    penaltyAmount: Number(row.penaltyAmount ?? 0),
    createdAt: row.createdAt ?? null,
  };
}

/**
 * GET /api/payments/invoices
 * - Trả toàn bộ hóa đơn của tenant (mọi căn); lọc theo nhà ở UI nếu cần.
 */
export async function fetchTenantInvoices(): Promise<TenantInvoiceFromApi[]> {
  const response = await axiosClient.get<TenantInvoicesApiResponse>(
    `${BACKEND_API_BASE}/payments/invoices`
  );

  const body = response.data;
  if (!body?.success || !Array.isArray(body.data)) return [];

  return body.data
    .map(mapTenantInvoiceRow)
    .filter((x) => x.id.length > 0);
}
