import type { InvoicePaymentAttemptFromApi, IssueQuoteFromApi } from "../types/api";

export type InvoicePaymentIdResolution = "quoteId" | "ticketId" | "unknown";

/**
 * Xác định `payments[].id` là id báo giá hay id ticket (heuristic theo danh sách quotes đã tải).
 */
export function resolveInvoicePaymentId(
  rawPaymentId: string,
  issueTicketId: string | null | undefined,
  quotes: IssueQuoteFromApi[],
  ticketIdUsedForQuoteFetch: string | null | undefined
): InvoicePaymentIdResolution {
  const raw = String(rawPaymentId ?? "").trim();
  if (!raw) return "unknown";
  const quoteIds = new Set(quotes.map((q) => String(q.id ?? "").trim()).filter(Boolean));
  if (quoteIds.has(raw)) return "quoteId";
  const tid = String(issueTicketId ?? "").trim();
  if (tid && raw === tid) return "ticketId";
  const fetchTid = String(ticketIdUsedForQuoteFetch ?? "").trim();
  if (fetchTid && raw === fetchTid) return "ticketId";
  return "unknown";
}

export function logInvoicePaymentIdResolution(entry: {
  invoiceId: string;
  paymentIndex: number;
  rawPaymentId: string;
  issueTicketId: string | null;
  resolution: InvoicePaymentIdResolution;
  quotesCount: number;
  quoteIdsSample: string[];
}): void {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.log("[ISUMS][invoice-payment-id]", JSON.stringify(entry));
}

/**
 * Ghi log cho từng payment sau khi đã có `quotes` (cùng ticket).
 */
export function logAllInvoicePaymentIdResolutions(
  invoiceId: string,
  payments: InvoicePaymentAttemptFromApi[],
  issueTicketId: string | null | undefined,
  quotes: IssueQuoteFromApi[],
  ticketIdUsedForQuoteFetch: string | null | undefined
): void {
  if (!__DEV__) return;
  const quoteIdsSample = [...new Set(quotes.map((q) => String(q.id ?? "").trim()).filter(Boolean))].slice(
    0,
    5
  );
  payments.forEach((p, paymentIndex) => {
    const rawPaymentId = String(p.id ?? "").trim();
    const resolution = resolveInvoicePaymentId(
      rawPaymentId,
      issueTicketId,
      quotes,
      ticketIdUsedForQuoteFetch
    );
    logInvoicePaymentIdResolution({
      invoiceId,
      paymentIndex,
      rawPaymentId,
      issueTicketId: String(issueTicketId ?? "").trim() || null,
      resolution,
      quotesCount: quotes.length,
      quoteIdsSample,
    });
  });
}
