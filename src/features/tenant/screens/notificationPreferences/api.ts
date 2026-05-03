import axiosClient from "@shared/api/axiosClient";
import { BACKEND_API_BASE } from "@shared/api/config";

/**
 * Notification preferences + subscription + voice history APIs
 * for the mobile tenant flow. Mirrors the web FE preferences.api.js
 * and hits the same BE endpoints.
 *
 * <p>Mobile axiosClient is created without a baseURL — each call must
 * prepend {@link BACKEND_API_BASE} explicitly. Web FE relies on a Vite
 * proxy for the same paths.
 */

export interface NotificationPreferences {
  userId: string;
  language: "vi_VN" | "en_US" | "ja_JP";
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursOverrideCritical: boolean;
  voiceMaxRetries: number;
  voiceRetryIntervalSec: number;
  voiceRateLimitSec: number;
  voiceGender: "MALE" | "FEMALE";
  voiceSpeed: number;
  dtmfAckEnabled: boolean;
  escalationEnabled: boolean;
  escalationTargetUserId: string | null;
  voiceConsentGivenAt: string | null;
}

export interface SubscriptionInfo {
  userId: string;
  tier: "FREE" | "PREMIUM";
  premiumStartedAt: string | null;
  premiumUntil: string | null;
  voiceQuotaMonthly: number;
  voiceUsedThisMonth: number;
  voiceRemaining: number;
  smsQuotaMonthly: number;
  smsUsedThisMonth: number;
  smsRemaining: number;
}

export interface VoiceCallEntry {
  id: string;
  userId: string;
  alertId: string | null;
  eventType: string;
  locale: string;
  status: string;
  dtmfReceived: string | null;
  acknowledgedAt: string | null;
  attemptNumber: number;
  maxAttempts: number;
  durationSec: number | null;
  costVnd: number | null;
  createdAt: string;
}

export interface UpdatePreferencesPatch {
  language?: NotificationPreferences["language"];
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  voiceEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  quietHoursOverrideCritical?: boolean;
  voiceMaxRetries?: number;
  voiceRetryIntervalSec?: number;
  voiceRateLimitSec?: number;
  voiceGender?: "MALE" | "FEMALE";
  voiceSpeed?: number;
  dtmfAckEnabled?: boolean;
  escalationEnabled?: boolean;
  escalationTargetUserId?: string | null;
  voiceConsentGranted?: boolean;
}

const unwrap = <T>(r: { data?: { data?: T } & T }): T =>
  (r?.data as any)?.data ?? (r?.data as T);

export const fetchPreferences = async (): Promise<NotificationPreferences> => {
  const r = await axiosClient.get(`${BACKEND_API_BASE}/notifications/preferences/me`);
  return unwrap<NotificationPreferences>(r);
};

export const updatePreferences = async (
  patch: UpdatePreferencesPatch
): Promise<NotificationPreferences> => {
  const r = await axiosClient.put(`${BACKEND_API_BASE}/notifications/preferences/me`, patch);
  return unwrap<NotificationPreferences>(r);
};

export const fetchSubscription = async (): Promise<SubscriptionInfo> => {
  const r = await axiosClient.get(`${BACKEND_API_BASE}/notifications/preferences/me/subscription`);
  return unwrap<SubscriptionInfo>(r);
};

export const fireTestVoice = async () => {
  const r = await axiosClient.post(`${BACKEND_API_BASE}/notifications/preferences/me/test-voice`);
  return unwrap<any>(r);
};

/**
 * Subscription plan catalogue — landlord curates these via the web
 * admin page. Mobile picker fetches the active list and renders one
 * tile per plan. Names live in a JSON i18n blob; FE picks per locale.
 */
export interface SubscriptionPlan {
  id: string;
  code: string;
  nameTranslations: string | null;
  durationDays: number;
  priceVnd: number;
  voiceQuotaMonthly: number;
  smsQuotaMonthly: number;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

export const fetchPlans = async (): Promise<SubscriptionPlan[]> => {
  const r = await axiosClient.get(
    `${BACKEND_API_BASE}/notifications/subscriptions/plans`
  );
  // Defensive unwrap — BE wraps in {success,data,message}, but some
  // axios setups auto-unwrap. Try every candidate and bail to [].
  const body: any = r?.data;
  const candidates = [body?.data, body, body?.items];
  for (const c of candidates) {
    if (Array.isArray(c)) return c as SubscriptionPlan[];
  }
  // eslint-disable-next-line no-console
  console.warn("[Premium] fetchPlans got non-array response:", body);
  return [];
};

/** Decode {@link SubscriptionPlan#nameTranslations} for the active locale. */
export function planDisplayName(plan: SubscriptionPlan, locale: string): string {
  if (!plan.nameTranslations) return plan.code;
  try {
    const map = JSON.parse(plan.nameTranslations);
    const short = (locale || "vi").slice(0, 2) as "vi" | "en" | "ja";
    return map[short] || map.vi || map.en || plan.code;
  } catch {
    return plan.nameTranslations || plan.code;
  }
}

/**
 * PREMIUM subscription upgrade via Payment-Service VNPay flow. Returns
 * a signed VNPay URL string opened via {@code WebBrowser.openBrowserAsync}.
 *
 * <p>Two purchase shapes — pass {@code planId} for a curated catalogue
 * plan (BE looks up authoritative price + duration), or {@code months}
 * for the legacy flat-rate flow. The BE prefers planId when both arrive.
 */
export const createSubscriptionPaymentLink = async (args: {
  planId?: string;
  months?: number;
  bankCode?: string | null;
  locale?: string;
}): Promise<string> => {
  try {
    const r = await axiosClient.post(
      `${BACKEND_API_BASE}/payments/vnpay/subscription`,
      {
        planId:   args.planId   ?? null,
        months:   args.months   ?? null,
        bankCode: args.bankCode ?? null,
        locale:   args.locale   ?? "vn",
      }
    );
    return unwrap<string>(r);
  } catch (err: any) {
    // Surface the BE's friendly message (Vietnamese — e.g. "Bạn có 1 yêu
    // cầu thanh toán PREMIUM đang chờ...") instead of axios's generic
    // "Request failed with status code 400" — the modal alert prints
    // err.message verbatim.
    const beMessage = err?.response?.data?.message;
    if (typeof beMessage === "string" && beMessage.length > 0) {
      const wrapped = new Error(beMessage);
      // Preserve the original error chain so consumers can still inspect
      // status / response if they need granular handling.
      (wrapped as any).cause = err;
      (wrapped as any).status = err?.response?.status;
      throw wrapped;
    }
    throw err;
  }
};

export interface ManagerSummary {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export const fetchManagers = async (): Promise<ManagerSummary[]> => {
  const r = await axiosClient.get(`${BACKEND_API_BASE}/users/managers`);
  const wrapped = (r?.data as any)?.data ?? r?.data;
  return Array.isArray(wrapped) ? wrapped : [];
};

export const fetchCallHistory = async (page = 0, size = 20) => {
  const r = await axiosClient.get(`${BACKEND_API_BASE}/notifications/calls/me`, {
    params: { page, size },
  });
  return unwrap<{
    content: VoiceCallEntry[];
    totalElements: number;
    totalPages: number;
    number: number;
  }>(r);
};
