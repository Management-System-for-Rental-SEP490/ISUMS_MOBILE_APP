import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import { useTenantContext, useTenantHouseIotAlertsInfinite } from "../../../../shared/hooks";
import { notificationStyles } from "./notificationStyles";
import {
  BRAND_DANGER,
  brandDangerMutedBg,
  brandPrimary,
  getNotificationAlertLevelStyle,
} from "../../../../shared/theme/color";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatDayMonthNumeric,
  formatTimeAgoI18n,
  getTotalPages,
  slicePage,
  toLocalYyyyMmDd,
} from "../../../../shared/utils";
import type { IotAlertItem } from "../../../../shared/types/api";

const todayStr = () => toLocalYyyyMmDd(new Date());

const normalizeAlertLevel = (level: string) => String(level ?? "").trim().toUpperCase();

const NotificationScreen = () => {
  const { t, i18n } = useTranslation();
  const { houseId } = useTenantContext();

  const PAGE_SIZE = CLIENT_LIST_PAGE_SIZE;

  const [selectedDate, setSelectedDate] = useState<string>(() => todayStr());
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const allAlerts = historyAlerts;
  const filtered = allAlerts;

  const pageCount = getTotalPages(filtered.length, PAGE_SIZE);
  const displayedAlerts = useMemo(
    () => slicePage(filtered, currentPage, PAGE_SIZE),
    [filtered, currentPage, PAGE_SIZE]
  );

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
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
  }, [locale, t]);

  const AlertCard = ({ alert }: { alert: IotAlertItem }) => {
    const level = normalizeAlertLevel(String(alert.level));
    const { fg: color, bg } = getNotificationAlertLevelStyle(level);
    const timeStr = formatTimeAgoI18n(new Date(alert.ts), t, true);
    return (
      <View style={[notificationStyles.alertCard, { borderLeftColor: color }]}>
        <View style={[notificationStyles.alertBadge, { backgroundColor: bg }]}>
          <Text style={[notificationStyles.alertBadgeText, { color }]}>{getLevelLabel(level)}</Text>
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
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, x: 0, animated: true });
    });
  };

  const initialLoading = isPending && historyAlerts.length === 0;
  const refreshing = isRefetching && !isFetchingNextPage;

  return (
    <View style={notificationStyles.container}>
      <Header variant="default" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => refetch()} />
        }
        contentContainerStyle={notificationStyles.listContent}
        onScroll={({ nativeEvent }) => {
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
        scrollEventThrottle={400}
      >
        <>
          <Text style={notificationStyles.title}>{t("screens.notification")}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={notificationStyles.dateRow}
          >
            {dateOptions.map((d) => {
              const active = selectedDate === d.str;
              return (
                <TouchableOpacity
                  key={d.str}
                  onPress={() => setSelectedDate(d.str)}
                  style={[
                    notificationStyles.dateChip,
                    active && {
                      backgroundColor: brandDangerMutedBg,
                      borderColor: BRAND_DANGER,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      notificationStyles.dateChipText,
                      active && { color: BRAND_DANGER },
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {initialLoading ? (
            <View style={notificationStyles.loadingBlock}>
              <ActivityIndicator size="large" color={brandPrimary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={notificationStyles.emptyStateWrap}>
              <Text style={notificationStyles.emptyText}>{t("notification.empty")}</Text>
            </View>
          ) : (
            displayedAlerts.map((alert) => <AlertCard key={alert.alertId} alert={alert} />)
          )}

          {isFetchingNextPage && (
            <View style={notificationStyles.loadingMoreBlock}>
              <ActivityIndicator size="small" color={brandPrimary} />
            </View>
          )}
          {!hasNextPage && filtered.length > 0 && !isFetchingNextPage && (
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
  );
};

export default NotificationScreen;
