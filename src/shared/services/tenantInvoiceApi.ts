import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type {
  ApiResponse,
  InvoicePaymentAttemptFromApi,
  TenantInvoiceFromApi,
} from "../types/api";

type TenantInvoiceApiRow = {
  id: string;
  contractId?: string | null;
  houseId?: string | null;
  houseName?: string | null;
  type?: string | null;
  periodKey?: string | null;
  totalAmount?: number | null;
  baseAmount?: number | null;
  penaltyAmount?: number | null;
  status?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  issueTicketId?: string | null;
  issueId?: string | null;
  ticketId?: string | null;
};

type TenantInvoicesApiResponse = ApiResponse<TenantInvoiceApiRow[]>;

function resolveIssueTicketId(row: TenantInvoiceApiRow): string | null {
  const candidates = [row.issueTicketId, row.issueId, row.ticketId];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  return null;
}

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
    houseName: row.houseName != null ? String(row.houseName).trim() || null : null,
    notes: null,
    contractId: row.contractId ?? null,
    type: type || null,
    periodKey: periodKey || null,
    totalAmount: Number(row.totalAmount ?? 0),
    baseAmount: Number(row.baseAmount ?? 0),
    penaltyAmount: Number(row.penaltyAmount ?? 0),
    createdAt: row.createdAt ?? null,
    issueTicketId: resolveIssueTicketId(row),
  };
}

type TenantInvoiceDetailApiRow = TenantInvoiceApiRow & {
  payments?: unknown[];
};

function mapPaymentAttempt(raw: unknown): InvoicePaymentAttemptFromApi | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    amount: Number(o.amount ?? 0),
    method: String(o.method ?? "").trim().toUpperCase() || "UNKNOWN",
    status: String(o.status ?? "").trim().toUpperCase() || "UNKNOWN",
    gatewayTxnId: o.gatewayTxnId != null ? String(o.gatewayTxnId) : null,
    paidAt: o.paidAt != null ? String(o.paidAt) : null,
    createdAt: o.createdAt != null ? String(o.createdAt) : null,
  };
}

export type TenantInvoiceDetailPayload = {
  invoice: TenantInvoiceFromApi;
  payments: InvoicePaymentAttemptFromApi[];
};

/**
 * GET /api/payments/invoices/{invoiceId} — chi tiết + lịch sử `payments`.
 */
export async function fetchTenantInvoiceDetail(invoiceId: string): Promise<TenantInvoiceDetailPayload | null> {
  const id = String(invoiceId ?? "").trim();
  if (!id) return null;

  const response = await axiosClient.get<ApiResponse<TenantInvoiceDetailApiRow>>(
    `${BACKEND_API_BASE}/payments/invoices/${encodeURIComponent(id)}`
  );

  const body = response.data;
  if (!body?.success || !body.data || typeof body.data !== "object") return null;

  const row = body.data;
  const base = mapTenantInvoiceRow(row);
  if (!base.id) return null;

  const rawPayments = Array.isArray(row.payments) ? row.payments : [];
  const payments = rawPayments.map(mapPaymentAttempt).filter((x): x is InvoicePaymentAttemptFromApi => x != null);

  return { invoice: base, payments };
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
