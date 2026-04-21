import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, Pressable, View, StyleSheet } from "react-native";
import type { ColorValue } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../shared/types";
import Icons from "../../../../shared/theme/icon";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import {
  useTenantContext,
  useTenantHouseIotAlertsInfinite,
  useRefreshControlGate,
  useTenantBusinessNotifications,
} from "../../../../shared/hooks";
import { useNotificationTransportStore } from "../../../../store/useNotificationTransportStore";
import {
  NOTIFICATION_READ_ALL_AVAILABLE,
  NOTIFICATION_REALTIME_ENABLED,
} from "../../../../shared/api/config";
import { formatAppNotificationTitle } from "../../../../shared/utils/notificationDisplay";
import { useAlertStore } from "../../../../store/useAlertStore";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import { notificationStyles } from "./notificationStyles";
import {
  brandFocusBorder,
  brandPrimary,
  brandSecondary,
  brandTintBg,
  getNotificationAlertLevelStyle,
  neutral,
} from "../../../../shared/theme/color";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatDayMonthNumeric,
  formatTimeAgoI18n,
  getTotalPages,
  getTenantAccessBlock,
  slicePage,
  toLocalYyyyMmDd,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import type { AppNotificationFromApi, IotAlertItem } from "../../../../shared/types/api";
import { dismissLatestIotHomeBannerForHouse } from "../../utils/dismissIotHomeBanner";
import { canonicalDedupeId } from "../../../../shared/utils/notificationDedupe";

const todayStr = () => toLocalYyyyMmDd(new Date());

function canonicalBusinessKey(n: AppNotificationFromApi): string {
  return canonicalDedupeId(n.dedupeKey, n.eventId) || n.id;
}

const normalizeAlertLevel = (level: string) => String(level ?? "").trim().toUpperCase();

type NotificationCardRowProps = {
  title: string;
  detail: string | null;
  areaLabel: string;
  timeStr: string;
  levelLabel: string;
  levelFg: ColorValue;
  levelBg: ColorValue;
};

/** Một mục trong danh sách — dạng card (icon + nội dung + thời gian), chỉ xem. */
const NotificationCardRow = memo(function NotificationCardRow({
  title,
  detail,
  areaLabel,
  timeStr,
  levelLabel,
  levelFg,
  levelBg,
}: NotificationCardRowProps) {
  const metaLine = `${areaLabel} · ${levelLabel}`;
  return (
    <View
      style={[notificationStyles.itemCard, { borderLeftWidth: 4, borderLeftColor: levelFg }]}
    >
      <View style={[notificationStyles.iconWrapper, { backgroundColor: levelBg }]}>
        <Icons.notification size={22} color={levelFg} />
      </View>
      <View style={notificationStyles.itemBody}>
        <Text style={notificationStyles.itemTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={notificationStyles.itemMessage} numberOfLines={2}>
          {metaLine}
        </Text>
        {detail ? (
          <Text style={notificationStyles.itemMessage} numberOfLines={3}>
            {detail}
          </Text>
        ) : null}
        <Text style={notificationStyles.itemTime}>{timeStr}</Text>
      </View>
    </View>
  );
});

const NotificationScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goHome = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof parent.navigate === "function") {
      parent.navigate("Main" as never);
      return;
    }
    try {
      navigation.navigate("Main" as never);
    } catch {
      /* ignore */
    }
  };
  const { houseId, house } = useTenantContext();

  /** Đã vào danh sách thông báo → gỡ banner IoT cho cảnh báo mới nhất (khớp overlay). */
  useFocusEffect(
    useCallback(() => {
      if (!houseId) return;
      void dismissLatestIotHomeBannerForHouse(houseId);
    }, [houseId])
  );

  const PAGE_SIZE = CLIENT_LIST_PAGE_SIZE;

  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handoverMinYmd = useMemo(() => {
    if (!house?.handoverDate?.trim()) return null;
    const d = new Date(house.handoverDate);
    if (Number.isNaN(d.getTime())) return null;
    return toLocalYyyyMmDd(d);
  }, [house?.handoverDate]);

  const scrollRef = useRef<ScrollView | null>(null);

  const {
    data,
    isPending,
    isFetchingNextPage,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useTenantHouseIotAlertsInfinite(houseId, selectedDate, PAGE_SIZE);

  const historyAlerts = useMemo(() => {
    const pages = data?.pages ?? [];
    const merged: IotAlertItem[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      for (const item of page.data?.items ?? []) {
        if (seen.has(item.alertId)) continue;
        seen.add(item.alertId);
        merged.push(item);
      }
    }
    merged.sort((a, b) => b.ts - a.ts);
    return merged.slice(0, 200);
  }, [data?.pages]);

  const getLevelLabel = (level: string) => {
    const L = normalizeAlertLevel(level);
    if (L === "CRITICAL") return t("notification.level_critical");
    if (L === "WARNING") return t("notification.level_warning");
    if (L === "HIGH") return t("notification.level_high");
    if (L === "MEDIUM") return t("notification.level_medium");
    if (L === "LOW") return t("notification.level_low");
    if (L === "INFO") return t("notification.level_info");
    return t("notification.level_info");
  };

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  useEffect(() => {
    // Đảm bảo danh sách/tabs chỉ bắt đầu từ `handoverDate`.
    if (!handoverMinYmd) return;
    if (selectedDate < handoverMinYmd) setSelectedDate(handoverMinYmd);
  }, [handoverMinYmd, selectedDate]);

  const allAlerts = historyAlerts;
  const filtered = allAlerts;
  const minTsMs = useMemo(() => {
    if (!house?.handoverDate?.trim()) return null;
    const d = new Date(house.handoverDate);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [house?.handoverDate]);

  const filtered2 = useMemo(() => {
    if (minTsMs == null) return filtered;
    return filtered.filter((a) => a.ts >= minTsMs);
  }, [filtered, minTsMs]);

  const pageCount = getTotalPages(filtered2.length, PAGE_SIZE);
  const displayedAlerts = useMemo(
    () => slicePage(filtered2, currentPage, PAGE_SIZE),
    [filtered2, currentPage, PAGE_SIZE]
  );

  const accessBlock = useMemo(() => (house ? getTenantAccessBlock(house) : null), [house]);

  const businessNotificationsEnabled = Boolean(houseId) && !accessBlock;
  const biz = useTenantBusinessNotifications(businessNotificationsEnabled);
  const realtimeUnavailable = useNotificationTransportStore((s) => s.realtimeUnavailable);

  const dateOptions = useMemo(() => {
    const base = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = toLocalYyyyMmDd(d);
      const label =
        i === 0
          ? t("notification.today")
          : i === 1
            ? t("notification.yesterday")
            : formatDayMonthNumeric(d, locale);
      return { str, label };
    });
    return handoverMinYmd ? base.filter((x) => x.str >= handoverMinYmd) : base;
  }, [locale, t, handoverMinYmd]);

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, x: 0, animated: true });
    });
  };

  const bizListLoading =
    businessNotificationsEnabled && biz.listQuery.isPending && biz.items.length === 0;

  const iotInitialLoading = isPending && historyAlerts.length === 0;
  const listLoading = iotInitialLoading || bizListLoading;
  const refreshing = isRefetching && !isFetchingNextPage;

  const onPressMarkAllRead = useCallback(async () => {
    const ok = await biz.markAllRead();
    if (!ok) {
      useAlertStore.getState().show(t("common.error"), t("notification.mark_read_failed"), [{ text: "OK" }], "error");
    }
  }, [biz, t]);

  const showGlobalEmpty =
    !listLoading && filtered2.length === 0 && biz.items.length === 0;
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();

  if (accessBlock) {
    const title =
      accessBlock === "handover"
        ? t("home.access.handover_title")
        : t("home.access.deposit_title");

    const accessReasonText = translateTenantAccessReason(house?.accessReason, house?.accessStatus, t);
    const body =
      accessBlock === "handover"
        ? accessReasonText ||
          t("home.access.handover_body", {
            date: house?.handoverDate
              ? formatDayMonthNumeric(new Date(house.handoverDate), i18n.language)
              : "—",
          })
        : accessReasonText || t("home.access.deposit_body");

    return (
      <View style={gateStyles.container}>
        <StackScreenTitleHeaderStrip>
          <View style={stackScreenTitleRowStyle}>
            <View style={stackScreenTitleSideSlotStyle}>
              <Pressable
                style={stackScreenTitleBackBtnOnBrand}
                onPress={() => navigation.goBack()}
              >
                <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
              </Pressable>
            </View>
            <View style={stackScreenTitleCenterSlotStyle}>
              <Pressable onPress={goHome}>
                <StackScreenTitleBadge numberOfLines={1}>
                  {t("screens.notification")}
                </StackScreenTitleBadge>
              </Pressable>
            </View>
            <StackScreenTitleBarBalance />
          </View>
        </StackScreenTitleHeaderStrip>
        <View style={gateStyles.gateBox}>
          <Text style={gateStyles.gateTitle}>{title}</Text>
          <Text style={gateStyles.gateBody}>{body}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={notificationStyles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <Pressable
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </Pressable>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <Pressable onPress={goHome}>
              <StackScreenTitleBadge numberOfLines={1}>
                {t("screens.notification")}
              </StackScreenTitleBadge>
            </Pressable>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>
      <View style={{ flex: 1, position: "relative" }}>
        <RefreshLogoOverlay visible={refreshing} />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <PullToRefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refetch();
                void biz.refetchAll();
              }}
              scrollAtTop={scrollAtTop}
            />
          }
          contentContainerStyle={notificationStyles.listContent}
        onScroll={(e) => {
          onScrollForRefreshGate(e);
          const { nativeEvent } = e;
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 60;
          if (
            isBottom &&
            contentOffset.y > 10 &&
            currentPage === pageCount &&
            displayedAlerts.length >= PAGE_SIZE &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            fetchNextPage();
          }
        }}
        scrollEventThrottle={16}
      >
        <>
          {NOTIFICATION_REALTIME_ENABLED && realtimeUnavailable ? (
            <View style={localStyles.systemHintBanner}>
              <Text style={localStyles.systemHintText}>{t("notification.realtime_unavailable_hint")}</Text>
            </View>
          ) : null}

          {biz.items.length > 0 ? (
            <View style={localStyles.systemSection}>
              <Text style={localStyles.systemSectionTitle}>{t("notification.section_system")}</Text>
              {NOTIFICATION_READ_ALL_AVAILABLE && biz.resolvedUnreadCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void onPressMarkAllRead()}
                  style={({ pressed }) => [localStyles.readAllBtn, pressed && { opacity: 0.88 }]}
                >
                  <Text style={localStyles.readAllBtnText}>{t("notification.read_all")}</Text>
                </Pressable>
              ) : null}
              {biz.items.map((n) => {
                const title = formatAppNotificationTitle(n, i18n.language);
                const ts = Date.parse(String(n.createdAt ?? n.timestamp ?? ""));
                const timeStr = Number.isFinite(ts)
                  ? formatTimeAgoI18n(new Date(ts), t, true)
                  : "—";
                return (
                  <View
                    key={canonicalBusinessKey(n)}
                    style={[
                      notificationStyles.itemCard,
                      { borderLeftWidth: 4, borderLeftColor: brandPrimary },
                    ]}
                  >
                    <View style={[notificationStyles.iconWrapper, { backgroundColor: brandTintBg }]}>
                      <Icons.notification size={22} color={brandPrimary} />
                    </View>
                    <View style={notificationStyles.itemBody}>
                      <Text style={notificationStyles.itemTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={notificationStyles.itemMessage} numberOfLines={1}>
                        {n.category} · {n.type}
                      </Text>
                      <Text style={notificationStyles.itemTime}>{timeStr}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View style={notificationStyles.dateFilterCard}>
            <Text style={notificationStyles.dateFilterLabel}>{t("notification.filter_by_date")}</Text>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={notificationStyles.dateRow}
            >
              {dateOptions.map((d) => {
                const active = selectedDate === d.str;
                return (
                  <Pressable
                    key={d.str}
                    onPress={() => setSelectedDate(d.str)}
                    style={({ pressed }) => [
                      notificationStyles.dateChip,
                      active && {
                        backgroundColor: brandTintBg,
                        borderColor: brandFocusBorder,
                      },
                      pressed && !active && { opacity: 0.88 },
                    ]}
                  >
                    <Text
                      style={[
                        notificationStyles.dateChipText,
                        active && { color: brandSecondary },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {listLoading ? (
            <View style={[notificationStyles.loadingBlock, { position: "relative", minHeight: 120 }]}>
              <RefreshLogoOverlay visible mode="page" />
            </View>
          ) : showGlobalEmpty ? (
            <View style={notificationStyles.emptyStateWrap}>
              <View style={notificationStyles.emptyIconBubble}>
                <Icons.notification size={32} color={neutral.slate400} />
              </View>
              <Text style={notificationStyles.emptyText}>{t("notification.empty")}</Text>
              <Text style={notificationStyles.emptyHint}>{t("notification.empty_hint")}</Text>
            </View>
          ) : filtered2.length === 0 ? (
            biz.items.length > 0 ? (
              <Text style={localStyles.iotEmptyDay}>{t("notification.iot_empty_day")}</Text>
            ) : null
          ) : (
            displayedAlerts.map((alert) => {
              const level = normalizeAlertLevel(String(alert.level));
              const { fg, bg } = getNotificationAlertLevelStyle(level);
              const detail = alert.detail?.trim() ? alert.detail.trim() : null;
              return (
                <NotificationCardRow
                  key={alert.alertId}
                  title={alert.title}
                  detail={detail}
                  areaLabel={alert.areaName?.trim() ? alert.areaName.trim() : t("notification.area_all")}
                  timeStr={formatTimeAgoI18n(new Date(alert.ts), t, true)}
                  levelLabel={getLevelLabel(level)}
                  levelFg={fg}
                  levelBg={bg}
                />
              );
            })
          )}

          {isFetchingNextPage && (
            <View style={notificationStyles.loadingMoreBlock}>
              <RefreshLogoInline logoPx={20} />
            </View>
          )}
          {!hasNextPage && filtered2.length > 0 && !isFetchingNextPage && (
            <Text style={notificationStyles.footerHint}>{t("notification.pagination_end")}</Text>
          )}

          <PaginationBar
            currentPage={currentPage}
            totalPages={pageCount}
            onPageChange={handlePageChange}
          />
        </>
        </ScrollView>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  systemHintBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: neutral.surface,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: neutral.border,
  },
  systemHintText: {
    fontSize: 13,
    color: neutral.textSecondary,
    textAlign: "center",
  },
  systemSection: {
    marginBottom: 8,
  },
  systemSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: neutral.heading,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  readAllBtn: {
    alignSelf: "flex-end",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  readAllBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: brandPrimary,
  },
  iotEmptyDay: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    color: neutral.textSecondary,
  },
});

const gateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  gateBox: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: neutral.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: neutral.border,
    alignItems: "center",
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.heading,
    textAlign: "center",
    marginBottom: 10,
  },
  gateBody: {
    fontSize: 15,
    lineHeight: 22,
    color: neutral.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  payBtn: {
    backgroundColor: brandPrimary,
    paddingVertical: 14,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  payBtnPressed: {
    opacity: 0.9,
  },
  payBtnText: {
    color: neutral.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NotificationScreen;
