import { isAxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  errors?: Array<{ message?: string; field?: string; code?: string }>;
};

function isAxiosTimeoutError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  return (
    error.code === "ECONNABORTED" || /timeout/i.test(String(error.message ?? ""))
  );
}

/** HTML / trang document do gateway hoặc server trả nhầm — không đưa lên UI. */
function isLikelyHtmlOrDocumentBody(text: string): boolean {
  const s = text.trimStart();
  if (!s.length) return false;
  if (s.length > 120_000) return true;
  const head = s.slice(0, 800);
  if (/^<!DOCTYPE\s+html/i.test(head)) return true;
  if (/^<html[\s>/]/i.test(head)) return true;
  if (/^<\?xml/i.test(head)) return true;
  if (
    head.startsWith("<") &&
    /<\/(html|head|body)>/i.test(text.slice(0, Math.min(text.length, 8000)))
  ) {
    return true;
  }
  return false;
}

function logRawApiBodyNotForUi(label: string, payload: string): void {
  const max = 8000;
  const suffix =
    payload.length > max ? `\n… (truncated, ${payload.length} chars total)` : "";
  console.warn(`[ISUMS][api-error] ${label} — raw body logged only, not shown in UI:`, `${payload.slice(0, max)}${suffix}`);
}

export type CollectApiErrorResult = {
  status?: number;
  statusText?: string;
  /** Nội dung từ `message` / `errors[]` của BE — ưu tiên hiển thị cho user. */
  lines: string[];
};

/**
 * Trích `message` và từng phần tử `errors` từ body axios (swagger ApiResponse).
 */
export function collectApiErrorTexts(error: unknown): CollectApiErrorResult {
  const ax = error as {
    message?: string;
    response?: { status?: number; statusText?: string; data?: unknown };
  };
  const status = typeof ax.response?.status === "number" ? ax.response.status : undefined;
  const statusText =
    typeof ax.response?.statusText === "string" ? ax.response.statusText.trim() : undefined;
  const data = ax.response?.data;
  const lines: string[] = [];

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const o = data as ApiErrorBody;
    if (typeof o.message === "string" && o.message.trim()) {
      const m = o.message.trim();
      if (isLikelyHtmlOrDocumentBody(m)) {
        logRawApiBodyNotForUi("response.data.message looks like HTML", m);
      } else {
        lines.push(m);
      }
    }
    if (Array.isArray(o.errors)) {
      for (const e of o.errors) {
        if (!e || typeof e !== "object") continue;
        const m = typeof e.message === "string" ? e.message.trim() : "";
        if (!m) continue;
        if (isLikelyHtmlOrDocumentBody(m)) {
          logRawApiBodyNotForUi("response.errors[].message looks like HTML", m);
          continue;
        }
        const f = typeof e.field === "string" && e.field.trim() ? `${e.field.trim()}: ` : "";
        const c = typeof e.code === "string" && e.code.trim() ? `[${e.code.trim()}] ` : "";
        lines.push(`${c}${f}${m}`);
      }
    }
  } else if (typeof data === "string" && data.trim()) {
    const raw = data.trim();
    if (isLikelyHtmlOrDocumentBody(raw)) {
      logRawApiBodyNotForUi("response.data is HTML/string document", raw);
    } else {
      lines.push(raw);
    }
  }

  const axiosMsg = typeof ax.message === "string" ? ax.message.trim() : "";
  if (
    lines.length === 0 &&
    axiosMsg &&
    !/^Request failed with status code \d+$/i.test(axiosMsg) &&
    axiosMsg !== "Network Error"
  ) {
    lines.push(axiosMsg);
  }

  return { status, statusText, lines };
}

type TAlert = (key: string, options?: Record<string, string | number>) => string;

function defaultBodyForPayment(
  kind: "vnpay_return" | "payment_link",
  status: number | undefined,
  t: TAlert
): string {
  if (kind === "vnpay_return") {
    if (status === 404) return t("tenant_payment.return_validate_error_404");
    if (status === 403) return t("tenant_payment.return_validate_error_403");
    if (status === 401) return t("tenant_payment.error_401");
    return t("tenant_payment.return_validate_error");
  }
  if (status === 403) return t("tenant_payment.create_link_error_403");
  if (status === 401) return t("tenant_payment.error_401");
  return t("tenant_payment.link_error");
}

/**
 * Một chuỗi thông báo lỗi đầy đủ: ưu tiên nội dung BE, kèm dòng HTTP kỹ thuật (status + reason).
 */
function looksLikeQuotePendingPaymentError(text: string): boolean {
  const u = text.toLowerCase();
  return (
    u.includes("pending payment") ||
    u.includes("complete the transaction") ||
    u.includes("wait for a timeout")
  );
}

export function formatApiErrorForTenantAlert(
  error: unknown,
  t: TAlert,
  kind: "vnpay_return" | "payment_link"
): string {
  const { status, statusText, lines } = collectApiErrorTexts(error);
  const fromApi = lines.join("\n").trim();
  const body = fromApi || defaultBodyForPayment(kind, status, t);

  const showQuotePendingHint =
    kind === "payment_link" &&
    status === 400 &&
    looksLikeQuotePendingPaymentError(body);

  let out = body;
  if (status != null && !showQuotePendingHint) {
    const phrase = statusText?.length ? ` ${statusText}` : "";
    const httpLine = t("tenant_payment.server_http_line", { status, phrase });
    out = `${body}\n\n${httpLine}`;
  }

  if (showQuotePendingHint) {
    out = `${out}\n\n${t("tenant_payment.quote_pending_payment_hint")}`;
  }

  return out;
}

