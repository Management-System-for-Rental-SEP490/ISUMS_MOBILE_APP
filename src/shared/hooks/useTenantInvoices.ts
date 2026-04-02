import { useQuery } from "@tanstack/react-query";
import { fetchTenantInvoices } from "../services/tenantInvoiceApi";

export const TENANT_INVOICES_QUERY_KEY = ["tenantInvoices"] as const;

export function useTenantInvoices(enabled: boolean = true) {
  return useQuery({
    queryKey: TENANT_INVOICES_QUERY_KEY,
    queryFn: fetchTenantInvoices,
    enabled,
  });
}
