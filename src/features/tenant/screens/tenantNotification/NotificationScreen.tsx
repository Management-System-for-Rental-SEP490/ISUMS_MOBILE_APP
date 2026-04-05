import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  Pressable,
  View,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
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
import { useTenantContext, useTenantHouseIotAlertsInfinite, useTenantHouses } from "../../../../shared/hooks";
import { notificationStyles } from "./notificationStyles";
import {
  BRAND_DANGER,
  neutral,
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
  getTenantAccessBlock,
  slicePage,
  toLocalYyyyMmDd,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import type { IotAlertItem } from "../../../../shared/types/api";

const todayStr = () => toLocalYyyyMmDd(new Date());

const normalizeAlertLevel = (level: string) => String(level ?? "").trim().toUpperCase();

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
  const { data: tenantHousesData } = useTenantHouses();
  const tenantHouses = tenantHousesData?.data ?? [];

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

  const accessBlock = useMemo(() => {
    if (!house) return null;
    return getTenantAccessBlock(house);
  }, [house]);

  const openPaymentScreen = useCallback(() => {
    const parentNav = navigation.getParent?.();
    const allPendingIds = tenantHouses
      .map((h) => String(h.pendingInvoiceId ?? "").trim())
      .filter((id) => id.length > 0);

    parentNav?.navigate?.("TenantRentPayment", {
      invoiceId: house?.pendingInvoiceId ?? undefined,
      invoiceIds: allPendingIds,
      afterSuccess: "home",
    });
  }, [navigation, tenantHouses, house?.pendingInvoiceId]);

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

  if (accessBlock) {
    const title =
      accessBlock === "handover"
        ? t("home.access.handover_title")
        : accessBlock === "deposit"
          ? t("home.access.deposit_title")
          : t("home.access.payment_title");

    const accessReasonText = translateTenantAccessReason(house?.accessReason, house?.accessStatus, t);
    const body =
      accessBlock === "handover"
        ? accessReasonText ||
          t("home.access.handover_body", {
            date: house?.handoverDate
              ? formatDayMonthNumeric(new Date(house.handoverDate), i18n.language)
              : "—",
          })
        : accessBlock === "deposit"
          ? accessReasonText || t("home.access.deposit_body")
          : accessReasonText || t("home.access.payment_body");

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
          {accessBlock === "payment" ? (
            <TouchableOpacity
              style={gateStyles.payBtn}
              onPress={openPaymentScreen}
              activeOpacity={0.85}
            >
              <Text style={gateStyles.payBtnText}>{t("home.access.pay_now")}</Text>
            </TouchableOpacity>
          ) : null}
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
          ) : filtered2.length === 0 ? (
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
  );
};

const gateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.background,
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
  payBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NotificationScreen;
