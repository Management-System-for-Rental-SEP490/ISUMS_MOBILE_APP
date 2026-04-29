import { useQuery } from "@tanstack/react-query";
import { getIssueResponses, getTenantTickets } from "../services/issuesApi";
import type { IssueTicketResponseFromApi, TenantTicketFromApi } from "../types/api";

/**
 * Cache React Query — danh sách ticket + responses (QUESTION).
 * `staleTime: Infinity`: không auto-refetch chỉ vì vào lại màn hoặc remount — danh sách giữ trong bộ nhớ phiên query.
 */
export const TENANT_ISSUE_TICKET_KEYS = {
  all: ["issues", "tenantTickets"] as const,
  list: () => [...TENANT_ISSUE_TICKET_KEYS.all, "list"] as const,
};

/** Khi đang xem danh sách — gọi lại nhẹ nhàng để ticket/status mới từ BE (không cần reload màn tay). */
export const TENANT_TICKET_LIST_POLL_MS = 30_000;

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
    refetchInterval: focused ? TENANT_TICKET_LIST_POLL_MS : false,
    refetchIntervalInBackground: false,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
