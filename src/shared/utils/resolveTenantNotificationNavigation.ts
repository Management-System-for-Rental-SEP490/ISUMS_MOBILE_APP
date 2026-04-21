/**
 * Map thông báo nghiệp vụ tenant → route an toàn.
 * entityId bắt buộc khi category (hoặc heuristic type) có đích điều hướng; SYSTEM/broadcast không ép entity.
 */
import type { AppNotificationFromApi } from "../types/api";
import type { RootStackParamList } from "../types";
import {
  categoryRequiresEntityIdForNavigation,
  isSystemOrBroadcastCategory,
} from "./notificationEntityRules";

function logNavGuard(reason: string, meta?: Record<string, unknown>) {
  if (__DEV__) {
    console.warn("[ISUMS][NotificationNav]", reason, meta ?? "");
  }
}

function isNonEmptyEntityId(raw: string | null | undefined): boolean {
  return String(raw ?? "").trim().length > 0;
}

/**
 * Category trống: suy từ type/action có cần entity để navigate không (tránh miss ticket khi BE chưa gửi category).
 */
function heuristicRequiresEntityWhenCategoryEmpty(n: AppNotificationFromApi): boolean {
  const hasCat = String(n.category ?? "").trim().length > 0;
  if (hasCat) return false;
  const b = `${n.actionType ?? ""} ${n.type ?? ""}`.toUpperCase();
  return (
    b.includes("TICKET") ||
    b.includes("ISSUE") ||
    b.includes("MAINTENANCE") ||
    b.includes("INVOICE") ||
    b.includes("JOB") ||
    b.includes("WORK_SLOT") ||
    b.includes("CONTRACT")
  );
}

function requiresEntityForThisNotification(n: AppNotificationFromApi): boolean {
  if (isSystemOrBroadcastCategory(n.category)) return false;
  if (categoryRequiresEntityIdForNavigation(n.category)) return true;
  return heuristicRequiresEntityWhenCategoryEmpty(n);
}

function parseTenantDeepLink(deepLink: string | null | undefined): {
  path: string;
  issueTicketId: string | null;
} | null {
  const d = String(deepLink ?? "").trim();
  if (!d) return null;
  try {
    const normalized = d.startsWith("isumstenant:") && !d.includes("://")
      ? d.replace(/^isumstenant:/, "isumstenant://")
      : d;
    const u = new URL(normalized);
    const path = (u.pathname || "").replace(/^\//, "");
    const issueTicketId = u.searchParams.get("issueTicketId");
    return { path, issueTicketId };
  } catch {
    return null;
  }
}

export type TenantNotificationNav =
  | {
      kind: "stack";
      screen: keyof RootStackParamList;
      params?: RootStackParamList[keyof RootStackParamList];
    }
  | { kind: "none" }
  | { kind: "fallbackHome"; reason: string };

export function resolveTenantNotificationNavigation(n: AppNotificationFromApi): TenantNotificationNav {
  const blob = `${n.actionType ?? ""} ${n.type ?? ""} ${n.category ?? ""}`.toUpperCase();
  const entityOk = isNonEmptyEntityId(n.entityId);
  const needEntity = requiresEntityForThisNotification(n);

  if (needEntity && !entityOk) {
    logNavGuard("required_entity_missing", { id: n.id, category: n.category, type: n.type });
    return { kind: "fallbackHome", reason: "required_entity_missing" };
  }

  const parsed = parseTenantDeepLink(n.deepLink);
  if (parsed) {
    if (parsed.path.includes("invoice") || parsed.path.includes("billing")) {
      return {
        kind: "stack",
        screen: "TenantInvoiceList",
        params: parsed.issueTicketId ? { issueTicketId: parsed.issueTicketId } : undefined,
      };
    }
    if (parsed.path.includes("ticket") || parsed.path.includes("issue")) {
      if (!entityOk) {
        logNavGuard("deep_link_ticket_missing_entity", { id: n.id, deepLink: n.deepLink });
        return { kind: "fallbackHome", reason: "deep_link_ticket_missing_entity" };
      }
      return { kind: "stack", screen: "TenantTicketList", params: undefined };
    }
  }

  if (blob.includes("INVOICE") || blob.includes("BILLING") || blob.includes("PAYMENT")) {
    return { kind: "stack", screen: "TenantInvoiceList", params: undefined };
  }
  if (blob.includes("CONTRACT")) {
    return { kind: "stack", screen: "ProfileScreen", params: undefined };
  }
  const ticketLike =
    blob.includes("TICKET") || blob.includes("ISSUE") || blob.includes("MAINTENANCE");
  if (ticketLike && entityOk) {
    return { kind: "stack", screen: "TenantTicketList", params: undefined };
  }

  return { kind: "none" };
}
