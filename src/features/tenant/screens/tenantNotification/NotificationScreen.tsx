import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import axiosClient from "../../../../shared/api/axiosClient";
import { BACKEND_API_BASE } from "../../../../shared/api/config";
import { useTenantContext } from "../../../../shared/hooks";
import { notificationStyles } from "./notificationStyles";

/**
 * Loại thông báo trong tab IoT (sau này có thể thêm mục khác).
 */
export type NotificationSection = "iot";

export type IotAlertLevel = "LOW" | "MEDIUM" | "HIGH" | "WARNING" | "CRITICAL" | "INFO";
export type IotAlertFilter = "all" | IotAlertLevel;

export type IotAlertItem = {
  alertId: string;
  houseId: string;
  areaId?: string | null;
  areaName?: string | null;
  thing: string;
  alertType: string;
  title: string;
  detail?: string | null;
  metric?: string | null;
  value?: number | null;
  level: IotAlertLevel | string;
  resolved?: boolean;
  ts: number;
  date?: string;
};

type AlertsApiResponse = {
  data: {
    items: IotAlertItem[];
    hasMore?: boolean;
    nextCursor?: string | null;
    cursor?: string | null;
  };
  message?: string;
  statusCode?: number;
  success?: boolean;
};

/**
 * Tính chuỗi "X phút/giờ/ngày trước" từ Date.
 * Dùng key i18n notification.time_minutes / time_hours / time_days với {{n}}.
 */
function formatTimeAgo(
  date: Date,
  t: (key: string, opts?: { n?: number }) => string
): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  // Ưu tiên hiển thị theo giây khi < 60 giây.
  if (diffSeconds < 60) return t("notification.time_seconds", { n: Math.max(diffSeconds, 1) });
  if (diffMins < 60) return t("notification.time_minutes", { n: diffMins || 1 });
  if (diffHours < 24) return t("notification.time_hours", { n: diffHours });
  return t("notification.time_days", { n: diffDays });
}

const pad2 = (n: number) => String(n).padStart(2, "0");
// Backend thường kỳ vọng YYYY-MM-DD theo "ngày local". Tránh lệch do toISOString() (UTC).
const toDateStr = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const todayStr = () => toDateStr(new Date());

const levelColor = (level: string) => {
  if (level === "CRITICAL") return "#EF4444";
  if (level === "WARNING") return "#F59E0B";
  if (level === "HIGH") return "#DC2626";
  if (level === "MEDIUM") return "#F97316";
  if (level === "LOW") return "#60A5FA";
  return "#2563EB";
};

const levelBg = (level: string) => {
  if (level === "CRITICAL") return "rgba(239,68,68,0.1)";
  if (level === "WARNING") return "rgba(245,158,11,0.1)";
  if (level === "HIGH") return "rgba(220,38,38,0.08)";
  if (level === "MEDIUM") return "rgba(249,115,22,0.08)";
  if (level === "LOW") return "rgba(96,165,250,0.08)";
  return "rgba(37,99,235,0.08)";
};

const alertTypeIcon = (alertType: string) => {
  if (alertType === "GAS") return "🔥";
  if (alertType === "WATER") return "💧";
  if (alertType === "ELECTRIC") return "⚡";
  return "⚠️";
};

const NotificationScreen = () => {
  const { t, i18n } = useTranslation();
  const { houseId } = useTenantContext();

  const PAGE_SIZE = 10;

  const [section, setSection] = useState<NotificationSection>("iot");
  const [filter, setFilter] = useState<IotAlertFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [historyAlerts, setHistoryAlerts] = useState<IotAlertItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const scrollRef = useRef<ScrollView | null>(null);

  cursorRef.current = cursor;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  const getLevelLabel = (level: string) => {
    if (level === "CRITICAL") return t("notification.level_critical");
    if (level === "WARNING") return t("notification.level_warning");
    if (level === "HIGH") return t("notification.level_high");
    if (level === "MEDIUM") return t("notification.level_medium");
    if (level === "LOW") return t("notification.level_low");
    return t("notification.level_info");
  };

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const fetchInitial = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setCursor(null);
    setHasMore(true);
    setCurrentPage(1);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), date: selectedDate });
      if (filter !== "all") params.append("level", filter);
      const url = `${BACKEND_API_BASE}/assets/houses/${encodeURIComponent(
        houseId
      )}/iot/alerts?${params.toString()}`;

      const res = await axiosClient.get<AlertsApiResponse>(url);
      const payload = res.data?.data;
      const items = payload?.items ?? [];
      // Giữ thứ tự mới nhất trước + giới hạn để tránh nặng UI.
      const sorted = items.slice().sort((a, b) => b.ts - a.ts);
      setHistoryAlerts(sorted.slice(0, 200));
      const next = payload?.nextCursor ?? payload?.cursor ?? null;
      setCursor(next);
      setHasMore(payload?.hasMore ?? false);
    } catch {
      setHistoryAlerts([]);
      setCursor(null);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [houseId, filter, selectedDate]);

  const fetchMore = useCallback(async () => {
    if (!houseId) return;
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    const currentCursor = cursorRef.current;
    if (!currentCursor) return;

    setLoadingMore(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        date: selectedDate,
        cursor: currentCursor,
      });
      if (filter !== "all") params.append("level", filter);
      const url = `${BACKEND_API_BASE}/assets/houses/${encodeURIComponent(
        houseId
      )}/iot/alerts?${params.toString()}`;

      const res = await axiosClient.get<AlertsApiResponse>(url);
      const payload = res.data?.data;
      const nextItems = payload?.items ?? [];
      setHistoryAlerts((prev) => {
        const merged = [...prev, ...nextItems];
        const seen = new Set<string>();
        const dedup = merged.filter((a) => {
          if (seen.has(a.alertId)) return false;
          seen.add(a.alertId);
          return true;
        });
        dedup.sort((a, b) => b.ts - a.ts);
        return dedup.slice(0, 200);
      });
      const next = payload?.nextCursor ?? payload?.cursor ?? null;
      setCursor(next);
      setHasMore(payload?.hasMore ?? false);
    } catch {
      // giữ lịch sử cũ
    } finally {
      setLoadingMore(false);
    }
  }, [houseId, filter, selectedDate]);

  useEffect(() => {
    if (section !== "iot") return;
    fetchInitial();
  }, [section, fetchInitial]);

  const allAlerts = useMemo(() => {
    // Hiện tại app chưa có realtime alerts qua websocket.
    // Framework vẫn giữ kiểu “merge realtime + history” để sau dễ mở rộng.
    return historyAlerts;
  }, [historyAlerts]);

  const filtered = useMemo(() => {
    if (filter === "all") return allAlerts;
    return allAlerts.filter((a) => a.level === filter);
  }, [allAlerts, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayedAlerts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const counts = useMemo(() => {
    const byLevel: Record<string, number> = {};
    for (const a of allAlerts) {
      const key = String(a.level);
      byLevel[key] = (byLevel[key] ?? 0) + 1;
    }
    return byLevel;
  }, [allAlerts]);

  const filterOptions = useMemo(() => {
    const opts: Array<{ key: IotAlertFilter; label: string; color: string; count: number }> = [
      { key: "all", label: t("notification.filter_all"), color: "#111827", count: allAlerts.length },
      { key: "CRITICAL", label: t("notification.level_critical"), color: levelColor("CRITICAL"), count: counts["CRITICAL"] ?? 0 },
      { key: "WARNING", label: t("notification.level_warning"), color: levelColor("WARNING"), count: counts["WARNING"] ?? 0 },
      { key: "HIGH", label: t("notification.level_high"), color: levelColor("HIGH"), count: counts["HIGH"] ?? 0 },
      { key: "MEDIUM", label: t("notification.level_medium"), color: levelColor("MEDIUM"), count: counts["MEDIUM"] ?? 0 },
      { key: "LOW", label: t("notification.level_low"), color: levelColor("LOW"), count: counts["LOW"] ?? 0 },
    ];
    return opts;
  }, [allAlerts.length, counts, t]);

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = toDateStr(d);
      const label =
        i === 0
          ? t("notification.today")
          : i === 1
            ? t("notification.yesterday")
            : d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
      return { str, label };
    });
  }, [locale, t]);

  const AlertCard = ({ alert }: { alert: IotAlertItem }) => {
    const level = String(alert.level);
    const color = levelColor(level);
    const bg = levelBg(level);
    const timeStr = formatTimeAgo(new Date(alert.ts), t);
    return (
      <View style={[notificationStyles.alertCard, { borderLeftColor: color }]}>
        <View style={[notificationStyles.alertBadge, { backgroundColor: bg }]}>
          <Text style={[notificationStyles.alertBadgeText, { color }]}>{getLevelLabel(level)}</Text>
          <Text style={[notificationStyles.alertBadgeStream, { color: "#334155" }]}>
            {alertTypeIcon(alert.alertType)} {alert.alertType}
          </Text>
        </View>
        <Text style={[notificationStyles.alertTitle, { color }]} numberOfLines={2}>
          {alert.title}
        </Text>
        {!!alert.detail && <Text style={notificationStyles.alertDetail}>{alert.detail}</Text>}
        <View style={notificationStyles.alertFooter}>
          <View style={notificationStyles.areaBadge}>
            <Text style={[notificationStyles.areaText]} numberOfLines={1}>
              📍 {alert.areaName || t("notification.area_all")}
            </Text>
          </View>
          <Text style={notificationStyles.alertTime}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    // Chờ render xong rồi mới scroll lên đầu để nhìn đúng trang vừa chọn.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, x: 0, animated: true });
    });
  };

  return (
    <View style={notificationStyles.container}>
      <Header variant="default" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchInitial()}
          />
        }
        contentContainerStyle={notificationStyles.listContent}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
          // Chỉ load thêm khi user đã kéo xuống đủ và đang ở trang "cuối cùng" đã load.
          // Tránh trường hợp content quá ngắn khiến isBottom = true ngay lập tức.
          if (
            isBottom &&
            contentOffset.y > 10 &&
            currentPage === pageCount &&
            displayedAlerts.length >= PAGE_SIZE
          ) {
            fetchMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Danh mục thông báo */}
        <View style={notificationStyles.sectionTabsRow}>
          <TouchableOpacity
            style={[
              notificationStyles.sectionTab,
              section === "iot" && notificationStyles.sectionTabActive,
            ]}
            onPress={() => setSection("iot")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                notificationStyles.sectionTabText,
                section === "iot" && notificationStyles.sectionTabTextActive,
              ]}
            >
                  {t("notification.section_iot")}
            </Text>
          </TouchableOpacity>
        </View>

        {section === "iot" && (
          <>
            <Text style={notificationStyles.title}>{t("screens.notification")}</Text>

            {/* Date selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={notificationStyles.dateRow}
            >
              {dateOptions.map((d) => {
                const active = selectedDate === d.str;
                const color = levelColor("CRITICAL");
                return (
                  <TouchableOpacity
                    key={d.str}
                    onPress={() => setSelectedDate(d.str)}
                    style={[
                      notificationStyles.dateChip,
                      active && {
                        backgroundColor: "rgba(239,68,68,0.12)",
                        borderColor: color,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        notificationStyles.dateChipText,
                        active && { color },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={notificationStyles.filterRow}
            >
              {filterOptions.map((opt) => {
                const active = filter === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      notificationStyles.filterChip,
                      active && {
                        borderColor: opt.color,
                        backgroundColor: `${opt.color}20`,
                      },
                    ]}
                    onPress={() => setFilter(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        notificationStyles.filterCount,
                        { color: opt.color },
                      ]}
                    >
                      {opt.count}
                    </Text>
                    <Text
                      style={[
                        notificationStyles.filterLabel,
                        active && { color: opt.color },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* List */}
            {loading && historyAlerts.length === 0 ? (
              <View style={{ paddingVertical: 30 }}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : filtered.length === 0 ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <Text style={{ fontSize: 15, color: "#94a3b8" }}>
                  {t("notification.empty")}
                </Text>
              </View>
            ) : (
              displayedAlerts.map((alert) => (
                <AlertCard key={alert.alertId} alert={alert} />
              ))
            )}

            {loadingMore && (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            )}
            {!hasMore && filtered.length > 0 && !loadingMore && (
              <Text
                style={{ textAlign: "center", color: "#94a3b8", paddingVertical: 10 }}
              >
                {t("notification.pagination_end")}
              </Text>
            )}

            {/* Pagination ở dưới cuối trang */}
            {pageCount > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={notificationStyles.paginationRow}
              >
                {Array.from({ length: pageCount }, (_, i) => {
                  const pageNum = i + 1;
                  const active = currentPage === pageNum;
                  return (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => handlePageChange(pageNum)}
                      activeOpacity={0.8}
                      style={[
                        notificationStyles.pageBtn,
                        active && notificationStyles.pageBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          notificationStyles.pageBtnText,
                          active && notificationStyles.pageBtnTextActive,
                        ]}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationScreen;
