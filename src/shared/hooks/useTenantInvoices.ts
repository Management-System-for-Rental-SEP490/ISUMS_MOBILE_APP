import { useQuery } from "@tanstack/react-query";
import { fetchTenantInvoiceDetail, fetchTenantInvoices } from "../services/tenantInvoiceApi";
import type { TenantInvoiceDetailPayload } from "../services/tenantInvoiceApi";
import { ACTIVE_SCREEN_POLL_MS } from "./useTenantIssueTickets";

export const TENANT_INVOICES_QUERY_KEY = ["tenantInvoices"] as const;

export type UseTenantInvoicesOptions = {
  /**
   * Khi true: refetch định kỳ trong lúc query được mount — cập nhật trạng thái thanh toán / hóa đơn mới từ BE.
   * Gắn với `useIsFocused()` ở màn danh sách / home / chi tiết ticket.
   */
  focused?: boolean;
};

/**
 * Danh sách hóa đơn tenant (GET /payments/invoices).
 * `focused`: poll nhẹ khi màn đang mở; mặc định không poll (chỉ invalidation / pull refresh / mount theo staleTime global).
 */
export function useTenantInvoices(enabled: boolean = true, options?: UseTenantInvoicesOptions) {
  const focused = options?.focused ?? false;
  return useQuery({
    queryKey: TENANT_INVOICES_QUERY_KEY,
    queryFn: fetchTenantInvoices,
    enabled,
    refetchInterval: focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
    refetchIntervalInBackground: false,
  });
}

export const TENANT_INVOICE_DETAIL_KEYS = {
  byId: (invoiceId: string) => [...TENANT_INVOICES_QUERY_KEY, "detail", invoiceId] as const,
};

/**
 * Chi tiết một hóa đơn + lịch sử thanh toán — poll khi màn chi tiết đang focus để status / paidAt khớp BE.
 */
export function useTenantInvoiceDetailQuery(
  invoiceId: string | undefined,
  options: { focused: boolean; enabled?: boolean }
) {
  const id = String(invoiceId ?? "").trim();
  const enabled = Boolean(id) && options.enabled !== false;
  return useQuery<TenantInvoiceDetailPayload | null>({
    queryKey: TENANT_INVOICE_DETAIL_KEYS.byId(id),
    queryFn: () => fetchTenantInvoiceDetail(id),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
    refetchIntervalInBackground: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
