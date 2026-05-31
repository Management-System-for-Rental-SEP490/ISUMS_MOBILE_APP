import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuthStore";
import { getNotificationsUnreadCount } from "../services/notificationApi";

/** Cùng query key với useTenantBusinessNotifications → TanStack Query deduplicate request. */
const QK_UNREAD = ["notifications", "app", "unread-count"] as const;

/**
 * Badge count cho icon thông báo ở Header.
 * Chỉ query unread-count (nhẹ), tự động sync với NotificationScreen vì dùng chung cache key.
 */
export function useNotificationBadgeCount(): number {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data } = useQuery({
    queryKey: [...QK_UNREAD],
    queryFn: () => getNotificationsUnreadCount(),
    enabled: isLoggedIn,
    staleTime: 30_000,
  });

  return typeof data === "number" && data > 0 ? data : 0;
}
