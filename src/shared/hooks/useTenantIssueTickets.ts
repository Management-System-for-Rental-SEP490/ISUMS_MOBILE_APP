import { useQuery } from "@tanstack/react-query";
import {
  getIssueQuotesByTicket,
  getIssueResponses,
  getTenantTicketById,
  getTenantTicketImages,
  getTenantTickets,
} from "../services/issuesApi";
import { getWorkSlotById } from "../services/scheduleApi";
import type { IssueTicketResponseFromApi, TenantTicketFromApi } from "../types/api";

/**
 * Cache React Query — danh sách ticket + responses (QUESTION).
 * `staleTime: Infinity`: không auto-refetch chỉ vì vào lại màn hoặc remount — danh sách giữ trong bộ nhớ phiên query.
 */
export const TENANT_ISSUE_TICKET_KEYS = {
  all: ["issues", "tenantTickets"] as const,
  list: () => [...TENANT_ISSUE_TICKET_KEYS.all, "list"] as const,
};

/**
 * Khoảng thời gian (ms) refetch định kỳ khi **màn đang mở** (`useIsFocused` / tab hiển thị).
 * Dùng chung cho ticket, hóa đơn, slot — đồng bộ status từ BE mà không cần pull-to-refresh.
 */
export const ACTIVE_SCREEN_POLL_MS = 30_000;

/** Danh sách ticket — cùng chu kỳ với `ACTIVE_SCREEN_POLL_MS`. */
export const TENANT_TICKET_LIST_POLL_MS = ACTIVE_SCREEN_POLL_MS;

/** Chi tiết ticket / ảnh / báo giá / responses (màn detail & luồng QUESTION). */
export const TENANT_TICKET_DETAIL_KEYS = {
  byId: (id: string) => [...TENANT_ISSUE_TICKET_KEYS.all, "detail", id] as const,
  images: (id: string) => [...TENANT_ISSUE_TICKET_KEYS.all, "images", id] as const,
  quotesForTicket: (id: string) => [...TENANT_ISSUE_TICKET_KEYS.all, "quotes", id] as const,
  responses: () => [...TENANT_ISSUE_TICKET_KEYS.all, "responses"] as const,
};

/** GET work slot theo id (dự báo khung giờ xử lý trên màn chi tiết ticket). */
export const TENANT_WORK_SLOT_KEYS = {
  byId: (slotId: string) => ["schedules", "tenantWorkSlot", slotId] as const,
};

export type TenantTicketListQueryData = {
  tickets: TenantTicketFromApi[];
  responses: IssueTicketResponseFromApi[];
};

async function tenantListFetchRetry<T>(loader: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await loader();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 320 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

type UseTenantTicketListQueryOptions = {
  /** Tab/màn Ticket list đang focus — bật poll; false thì chỉ hiển thị cache, không âm thầm gọi API. */
  focused: boolean;
};

/**
 * Dữ liệu danh sách ticket tenant (hai GET chính). Lần đầu tải; các lần sau dùng cache trừ khi invalidate / kéo refresh / polling.
 */
export function useTenantTicketListQuery(options: UseTenantTicketListQueryOptions) {
  const { focused } = options;
  return useQuery({
    queryKey: TENANT_ISSUE_TICKET_KEYS.list(),
    queryFn: async (): Promise<TenantTicketListQueryData> => {
      const [tickets, responses] = await tenantListFetchRetry(() =>
        Promise.all([getTenantTickets(), getIssueResponses()])
      );
      return { tickets, responses };
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 45 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: focused ? ACTIVE_SCREEN_POLL_MS : false,
    refetchIntervalInBackground: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

type TenantDetailPollOptions = {
  /** Màn/stack đang focus — bật `refetchInterval`; false thì không poll. */
  focused: boolean;
  /** `false` để không gọi API (vd. thiếu id hoặc loại ticket không cần). */
  enabled?: boolean;
};

const tenantDetailQueryDefaults = {
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: 45 * 60_000,
  refetchOnMount: false as const,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: true as const,
  refetchIntervalInBackground: false as const,
  retry: 2,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
};

/**
 * Chi tiết một ticket tenant (GET /issues/tickets/:id).
 * Poll khi `focused` để status / staff gán / slot cập nhật khớp BE.
 */
export function useTenantTicketByIdQuery(ticketId: string | undefined, options: TenantDetailPollOptions) {
  const id = String(ticketId ?? "").trim();
  const enabled = options.enabled !== false && Boolean(id);
  return useQuery({
    queryKey: TENANT_TICKET_DETAIL_KEYS.byId(id),
    queryFn: () => getTenantTicketById(id),
    enabled,
    ...tenantDetailQueryDefaults,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
  });
}

/**
 * Ảnh đính kèm ticket tenant — poll khi đang xem màn chi tiết (staff có thể bổ sung).
 */
export function useTenantTicketImagesQuery(ticketId: string | undefined, options: TenantDetailPollOptions) {
  const id = String(ticketId ?? "").trim();
  const enabled = options.enabled !== false && Boolean(id);
  return useQuery({
    queryKey: TENANT_TICKET_DETAIL_KEYS.images(id),
    queryFn: () => getTenantTicketImages(id),
    enabled,
    ...tenantDetailQueryDefaults,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
  });
}

/**
 * Danh sách phản hồi QUESTION (GET /issues/responses) — dùng khi màn chi tiết ticket type QUESTION đang mở.
 */
export function useTenantIssueResponsesQuery(options: TenantDetailPollOptions) {
  const enabled = options.enabled !== false;
  return useQuery({
    queryKey: TENANT_TICKET_DETAIL_KEYS.responses(),
    queryFn: () => getIssueResponses(),
    enabled,
    ...tenantDetailQueryDefaults,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
  });
}

/**
 * Báo giá theo ticket — chỉ bật `enabled` khi luồng sửa chữa cần (tránh GET thừa).
 */
export function useIssueQuotesByTicketQuery(ticketId: string | undefined, options: TenantDetailPollOptions) {
  const id = String(ticketId ?? "").trim();
  const enabled = options.enabled !== false && Boolean(id);
  return useQuery({
    queryKey: TENANT_TICKET_DETAIL_KEYS.quotesForTicket(id),
    queryFn: () => getIssueQuotesByTicket(id),
    enabled,
    ...tenantDetailQueryDefaults,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
  });
}

/**
 * Một work slot theo id (GET /schedules/work_slots/:id) — hiển thị khung giờ dự kiến trên chi tiết ticket.
 */
export function useTenantWorkSlotByIdQuery(slotId: string | null | undefined, options: TenantDetailPollOptions) {
  const id = String(slotId ?? "").trim();
  const enabled = options.enabled !== false && Boolean(id);
  return useQuery({
    queryKey: TENANT_WORK_SLOT_KEYS.byId(id),
    queryFn: () => getWorkSlotById(id),
    enabled,
    ...tenantDetailQueryDefaults,
    refetchInterval: options.focused && enabled ? ACTIVE_SCREEN_POLL_MS : false,
  });
}
