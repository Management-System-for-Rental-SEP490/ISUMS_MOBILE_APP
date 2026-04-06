import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Linking,
} from "react-native";
import { useAuthStore } from "../../../../store/useAuthStore";
import Header, { type HomeHeaderInvoiceStrip } from "../../../../shared/components/header";
import { HomeScreenProps, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import homeStyles from "./homeStyles";
import {
  TENANT_INVOICES_QUERY_KEY,
  useTenantHouses,
  useUserProfile,
  useUpdateMainHouseMutation,
  useTenantContext,
  useTenantInvoices,
} from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";

import {
  brandPrimary,
  brandSecondary,
  neutral,
  waterAccent,
} from "../../../../shared/theme/color";
import type { HouseFromApi, TenantInvoiceFromApi } from "../../../../shared/types/api";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import { getHomeGreetingI18nKey } from "../../../../shared/utils/homeTimeGreeting";
import { isTenantInvoicePayable, isTenantInvoiceDueUrgent } from "../../../../shared/utils/tenantInvoice";
import { CustomAlert } from "../../../../shared/components/alert";
import Icons from "../../../../shared/theme/icon";
import { tenantFooterLinks } from "../../../../shared/constants/tenantFooterLinks";

const EMPTY_TENANT_HOUSES: HouseFromApi[] = [];
const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];

/** Dưới ngưỡng này dùng 3 cột quick actions cho dễ đọc. */
const UTILITY_GRID_BREAKPOINT = 390;
/** marginHorizontal 16×2 + paddingHorizontal 16×2 của `utilitySection` */
const UTILITY_SECTION_H_INSET = 64;

/**
 * Số khoản từ ticket/sửa chữa cần thanh toán hiển thị trên dải header Home.
 * Luồng thanh toán ticket sẽ bổ sung sau — khi đó cộng vào tổng dải cùng hóa đơn toàn căn.
 */
const TENANT_HOME_HEADER_PAYABLE_TICKET_PLACEHOLDER = 0;

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const queryClient = useQueryClient();
  const { houseId, setHouseId } = useAuthStore();
  const { t, i18n } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Home là màn `Main` trên root stack — dùng stack này; trước đây qua tab nên cần getParent. */
  const rootNavigation = useMemo(
    () => navigation.getParent<NavigationProp<RootStackParamList>>() ?? navigation,
    [navigation]
  );
  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const autoSetMainHouseRef = useRef<string>("");
  const [isSubmittingMainHouse, setIsSubmittingMainHouse] = useState(false);
  const [pendingMainHouseId, setPendingMainHouseId] = useState<string | null>(null);
  const updateMainHouseMutation = useUpdateMainHouseMutation();
  const mutateMainHouse = updateMainHouseMutation.mutate;
  const mutateMainHouseAsync = updateMainHouseMutation.mutateAsync;

  const {
    data: housesData,
    isLoading: loadingHouses,
    refetch: refetchHouses,
  } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = useMemo(
    () => housesData?.data ?? EMPTY_TENANT_HOUSES,
    [housesData?.data]
  );
  const { data: userProfile, isPending: profilePending } = useUserProfile();
  const profileMainHouseId = String(userProfile?.mainHouseId ?? "").trim();
  const hasPersistedMainHouse = useMemo(
    () =>
      profileMainHouseId.length > 0 &&
      tenantHouses.some((h) => h.id === profileMainHouseId),
    [profileMainHouseId, tenantHouses]
  );

  useEffect(() => {
    if (loadingHouses || tenantHouses.length === 0) return;
    if (houseId && !tenantHouses.some((h) => h.id === houseId)) {
      setHouseId(null);
    }
  }, [loadingHouses, tenantHouses, houseId, setHouseId]);

  useEffect(() => {
    if (loadingHouses) return;
    if (tenantHouses.length !== 1) return;
    const only = tenantHouses[0]!;
    if (houseId !== only.id) setHouseId(only.id);
    if (autoSetMainHouseRef.current === only.id) return;
    autoSetMainHouseRef.current = only.id;
    mutateMainHouse({ houseId: only.id });
  }, [loadingHouses, tenantHouses, houseId, setHouseId, mutateMainHouse]);

  useEffect(() => {
    if (loadingHouses || tenantHouses.length <= 1) return;
    const hasValidSelectedHouse =
      Boolean(houseId) && tenantHouses.some((h) => h.id === houseId);
    const mainFromProfile = String(userProfile?.mainHouseId ?? "").trim();
    if (mainFromProfile && tenantHouses.some((h) => h.id === mainFromProfile)) {
      if (!hasValidSelectedHouse) setHouseId(mainFromProfile);
      setHouseModalVisible(false);
      return;
    }
    if (hasValidSelectedHouse) {
      setHouseModalVisible(false);
      return;
    }
    setHouseModalVisible(true);
  }, [
    loadingHouses,
    tenantHouses,
    houseId,
    setHouseId,
    profilePending,
    userProfile?.mainHouseId,
  ]);

  const { house: myHouse, houseId: contextHouseId, thingId } = useTenantContext();
  const hasTenantHouse = Boolean(myHouse);

  const iotConnected = useTenantIoTConnection(thingId);
  const electricUsage = useTenantUsage({
    houseId: contextHouseId,
    metric: "electricity",
  });
  const waterUsage = useTenantUsage({
    houseId: contextHouseId,
    metric: "water",
  });

  const accessBlock = useMemo(() => {
    if (loadingHouses || !myHouse) return null;
    return getTenantAccessBlock(myHouse);
  }, [loadingHouses, myHouse]);

  const accessReasonText = useMemo(
    () => translateTenantAccessReason(myHouse?.accessReason, myHouse?.accessStatus, t),
    [myHouse?.accessReason, myHouse?.accessStatus, t]
  );

  /** Một dòng nhắc trên Home (không che nội dung). */
  const accessReminderLine = useMemo(() => {
    if (!accessBlock || !myHouse) return "";
    if (accessBlock === "handover") {
      return (
        accessReasonText ||
        t("home.access.handover_body", {
          date: myHouse.handoverDate
            ? formatDayMonthNumeric(new Date(myHouse.handoverDate), i18n.language)
            : "—",
        })
      );
    }
    if (accessBlock === "deposit") {
      return accessReasonText || t("home.access.deposit_body");
    }
    if (accessBlock === "payment") {
      return t("home.access.payment_banner");
    }
    return "";
  }, [accessBlock, myHouse, accessReasonText, t, i18n.language]);

  const showFullHomeFeatures = !accessBlock;

  const openPaymentScreen = useCallback(() => {
    rootNavigation.navigate("TenantInvoiceList");
  }, [rootNavigation]);

  const effectiveHouseId = useMemo(
    () => String(houseId ?? myHouse?.id ?? "").trim(),
    [houseId, myHouse?.id]
  );
  const hasAnyTenantHouse = tenantHouses.length > 0;
  /** Hóa đơn API trả về theo tenant — bật khi đã có danh sách căn (kể cả chưa chọn căn hiển thị). */
  const invoiceQueryEnabled = hasAnyTenantHouse && !loadingHouses;
  const {
    data: invoiceListRaw,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
  } = useTenantInvoices(invoiceQueryEnabled);
  const invoiceList = invoiceListRaw ?? EMPTY_TENANT_INVOICES;

  /** Hóa đơn cần thanh toán trên toàn bộ căn tenant đang có (dải header + tổng mở). */
  const headerPayableInvoices = useMemo(() => {
    const ids = new Set(
      tenantHouses.map((h) => String(h.id ?? "").trim()).filter((id) => id.length > 0)
    );
    return invoiceList.filter((inv) => {
      if (!isTenantInvoicePayable(inv.status)) return false;
      const hid = String(inv.houseId ?? "").trim();
      if (hid.length === 0) return true;
      return ids.size === 0 || ids.has(hid);
    });
  }, [invoiceList, tenantHouses]);

  const headerPayableCount = useMemo(
    () => headerPayableInvoices.length + TENANT_HOME_HEADER_PAYABLE_TICKET_PLACEHOLDER,
    [headerPayableInvoices.length]
  );

  const loading = loadingHouses;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchHouses(),
        ...(invoiceQueryEnabled ? [refetchInvoices()] : []),
        ...(contextHouseId ? [electricUsage.refetch(), waterUsage.refetch()] : []),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchHouses,
    refetchInvoices,
    invoiceQueryEnabled,
    contextHouseId,
    electricUsage.refetch,
    waterUsage.refetch,
  ]);

  const handleSelectMainHouse = useCallback(
    async (selectedHouseId: string) => {
      if (!selectedHouseId || isSubmittingMainHouse) return;
      if (hasPersistedMainHouse) {
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        return;
      }
      try {
        setIsSubmittingMainHouse(true);
        setPendingMainHouseId(selectedHouseId);
        await mutateMainHouseAsync({ houseId: selectedHouseId });
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        await refetchHouses();
      } catch {
        CustomAlert.alert(
          t("home.main_house_update_failed_title"),
          t("home.main_house_update_failed_message"),
          [{ text: t("common.close"), style: "default" }],
          { type: "error" }
        );
      } finally {
        setIsSubmittingMainHouse(false);
        setPendingMainHouseId(null);
      }
    },
    [
      isSubmittingMainHouse,
      hasPersistedMainHouse,
      queryClient,
      refetchHouses,
      setHouseId,
      tenantHouses,
      t,
      mutateMainHouseAsync,
    ]
  );

  const displayWelcomeName = useMemo(() => {
    const raw = String(userProfile?.name ?? "").trim();
    return raw.length > 0 ? raw : t("home.hero_fallback_name");
  }, [userProfile?.name, t]);

  const homeHeaderWelcome = useMemo(() => {
    const greetingKey = getHomeGreetingI18nKey();
    return {
      helloLine: t(greetingKey, { name: displayWelcomeName }),
    };
  }, [t, displayWelcomeName]);

  const navigateToProfileFromHeader = useCallback(() => {
    rootNavigation.navigate("ProfileScreen");
  }, [rootNavigation]);

  const navigateToInvoicesFromHeader = useCallback(() => {
    rootNavigation.navigate("TenantInvoiceList");
  }, [rootNavigation]);

  const navigateToCurrentHouseDetail = useCallback(() => {
    if (!myHouse) return;
    rootNavigation.navigate("BuildingDetail", {
      buildingId: myHouse.id,
      buildingName: myHouse.name,
      buildingAddress: myHouse.address,
      description: myHouse.description,
      ward: myHouse.ward,
      commune: myHouse.commune,
      city: myHouse.city,
      status: myHouse.status,
      functionalAreas: myHouse.functionalAreas ?? [],
      contractDocuments: myHouse.contractDocuments,
      hasUnpaidInvoice: myHouse.hasUnpaidInvoice,
      pendingInvoiceId: myHouse.pendingInvoiceId ?? null,
      accessStatus: myHouse.accessStatus,
      accessReason: myHouse.accessReason ?? null,
      memberRole: myHouse.memberRole,
    });
  }, [myHouse, rootNavigation]);

  const homeInvoiceStrip = useMemo((): HomeHeaderInvoiceStrip => {
    if (!hasAnyTenantHouse) return { kind: "hidden" };
    if (invoiceQueryEnabled && invoicesLoading && invoiceList.length === 0) {
      return { kind: "loading" };
    }
    const n = headerPayableCount;
    if (n === 0) {
      return { kind: "all_paid", caption: t("home.header_invoice_all_paid") };
    }
    const urgent = headerPayableInvoices.some((inv) => isTenantInvoiceDueUrgent(inv));
    const caption = urgent
      ? t("home.header_invoice_payable_urgent", { count: n })
      : t("home.header_invoice_payable_count", { count: n });
    return { kind: "payable", caption, urgent };
  }, [
    hasAnyTenantHouse,
    headerPayableCount,
    headerPayableInvoices,
    invoiceQueryEnabled,
    invoicesLoading,
    invoiceList.length,
    t,
  ]);

  const { utilityGridGap, utilityItemWidth } = useMemo(() => {
    const cols = accessBlock ? 3 : windowWidth < UTILITY_GRID_BREAKPOINT ? 3 : 4;
    const gap = cols === 3 ? 12 : 10;
    const inner = Math.max(0, windowWidth - UTILITY_SECTION_H_INSET);
    const raw = Math.floor((inner - gap * (cols - 1)) / cols);
    return {
      utilityGridGap: gap,
      utilityItemWidth: Math.max(cols === 3 ? 72 : 64, raw),
    };
  }, [windowWidth, accessBlock]);

  const UTILITY_ICON = 18;

  const formatUsageVal = useCallback((val: number, unit: string) => {
    const digits = unit === "kWh" ? 2 : 1;
    return `${val.toFixed(digits)} ${unit}`;
  }, []);

  const openTenantFooterUrl = useCallback((url: string) => {
    const u = url.trim();
    if (!u) return;
    Linking.openURL(u).catch(() => {});
  }, []);

  const renderHomeScrollContent = () => {
    if (!hasTenantHouse && !loadingHouses) {
      return null;
    }

    return (
      <View>
        {accessBlock && accessReminderLine ? (
          <View
            style={homeStyles.accessReminderBanner}
            accessibilityRole="text"
            accessibilityLabel={accessReminderLine}
          >
            <Text
              style={homeStyles.accessReminderBannerText}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {accessReminderLine}
            </Text>
            {accessBlock === "payment" ? (
              <TouchableOpacity
                style={homeStyles.accessReminderPayNowBtn}
                onPress={openPaymentScreen}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t("home.banner_pay_now")}
              >
                <Text style={homeStyles.accessReminderPayNowBtnText}>
                  {t("home.banner_pay_now")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {myHouse ? (
          <Pressable
            style={({ pressed }) => [
              homeStyles.currentHouseSection,
              pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
            ]}
            onPress={navigateToCurrentHouseDetail}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            accessibilityRole="button"
            accessibilityLabel={`${t("home.staying_at_house_label")}, ${myHouse.name}`}
          >
            <View style={homeStyles.currentHouseRow}>
              <View style={homeStyles.currentHouseTextBlock}>
                <Text style={homeStyles.currentHouseEyebrow}>
                  {t("home.staying_at_house_label")}
                </Text>
                <Text style={homeStyles.currentHouseName} numberOfLines={2}>
                  {myHouse.name}
                </Text>
              </View>
              {tenantHouses.length > 1 ? (
                <Pressable
                  style={homeStyles.switchHousePill}
                  onPress={() => setHouseModalVisible(true)}
                  android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                >
                  <Text style={homeStyles.switchHousePillText}>{t("home.switch_house")}</Text>
                  <Icons.chevronForward size={16} color={brandSecondary} />
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <View style={homeStyles.utilitySection}>
          <Text style={homeStyles.utilitySectionTitle}>{t("home.utilities_title")}</Text>
          <View style={[homeStyles.utilityGrid, { gap: utilityGridGap }]}>
            <Pressable
              style={({ pressed }) => [
                homeStyles.utilityItem,
                { width: utilityItemWidth, backgroundColor: "#DBEAFE" },
                pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              onPress={navigateToCurrentHouseDetail}
            >
              <View style={homeStyles.utilityIconSlot}>
                <Icons.home color={brandPrimary} size={UTILITY_ICON} />
              </View>
              <Text style={homeStyles.utilityLabel}>{t("home.utility_house")}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                homeStyles.utilityItem,
                { width: utilityItemWidth, backgroundColor: "#F5F0EB" },
                pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              onPress={() => {
                rootNavigation.navigate("ProfileScreen");
              }}
            >
              <View style={homeStyles.utilityIconSlot}>
                <Icons.user color="#6D28D9" size={UTILITY_ICON} />
              </View>
              <Text style={homeStyles.utilityLabel}>{t("home.utility_profile")}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                homeStyles.utilityItem,
                { width: utilityItemWidth, backgroundColor: "#FEF3C7" },
                pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
              ]}
              android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              onPress={() => {
                rootNavigation.navigate("TenantInvoiceList");
              }}
            >
              <View style={homeStyles.utilityIconSlot}>
                <Icons.invoice color="#B45309" size={UTILITY_ICON} />
              </View>
              <Text style={homeStyles.utilityLabel}>{t("home.utility_invoice")}</Text>
            </Pressable>

            {showFullHomeFeatures ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    homeStyles.utilityItem,
                    { width: utilityItemWidth, backgroundColor: "#D1FAE5" },
                    pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  onPress={() => {
                    rootNavigation.navigate("TenantTicketList");
                  }}
                >
                  <View style={homeStyles.utilityIconSlot}>
                    <Icons.ticket color="#047857" size={UTILITY_ICON} />
                  </View>
                  <Text style={homeStyles.utilityLabel}>{t("home.utility_ticket")}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    homeStyles.utilityItem,
                    { width: utilityItemWidth, backgroundColor: "#F3F4F6" },
                    pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  onPress={() => {
                    rootNavigation.navigate("ConsumptionScreen", { initialTab: "electric" });
                  }}
                >
                  <View style={homeStyles.utilityIconSlot}>
                    <Icons.electric color="#059669" size={UTILITY_ICON} />
                  </View>
                  <Text style={homeStyles.utilityLabel}>{t("home.utility_electric")}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    homeStyles.utilityItem,
                    { width: utilityItemWidth, backgroundColor: "#E0E7FF" },
                    pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  onPress={() => {
                    rootNavigation.navigate("ConsumptionScreen", { initialTab: "water" });
                  }}
                >
                  <View style={homeStyles.utilityIconSlot}>
                    <Icons.water color="#2563EB" size={UTILITY_ICON} />
                  </View>
                  <Text style={homeStyles.utilityLabel}>{t("home.utility_water")}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    homeStyles.utilityItem,
                    { width: utilityItemWidth, backgroundColor: "#EDE9FE" },
                    pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  onPress={() => {
                    rootNavigation.navigate("TenantQuestionList");
                  }}
                >
                  <View style={homeStyles.utilityIconSlot}>
                    <Icons.brain color="#4F46E5" size={UTILITY_ICON} />
                  </View>
                  <Text style={homeStyles.utilityLabel}>{t("home.utility_qa")}</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    homeStyles.utilityItem,
                    { width: utilityItemWidth, backgroundColor: "#D6D3D1" },
                    pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                  ]}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  onPress={() => {
                    rootNavigation.navigate("Camera");
                  }}
                >
                  <View style={homeStyles.utilityIconSlot}>
                    <Icons.scanLookup color={brandPrimary} size={UTILITY_ICON} />
                  </View>
                  <Text style={homeStyles.utilityLabel}>{t("home.utility_scan")}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>

        {showFullHomeFeatures && myHouse ? (
              <View style={homeStyles.usageSummarySection}>
                <View style={homeStyles.usageSummaryHeader}>
                  <Text style={homeStyles.usageSummaryTitle}>
                    {t("consumption.summary_title")}
                  </Text>
                  <View style={homeStyles.usageSummaryLiveRow}>
                    <View
                      style={[
                        homeStyles.usageSummaryLiveDot,
                        {
                          backgroundColor: iotConnected
                            ? brandPrimary
                            : neutral.textMuted,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        homeStyles.usageSummaryLiveText,
                        {
                          color: iotConnected ? brandSecondary : neutral.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {iotConnected ? t("consumption.iot_live") : t("consumption.iot_offline")}
                    </Text>
                  </View>
                </View>

                <View style={homeStyles.usageSummaryCards}>
                  <View
                    style={[
                      homeStyles.usageSummaryCardWrap,
                      homeStyles.usageSummaryCardWrapFirst,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        homeStyles.usageSummaryCard,
                        { borderLeftColor: brandPrimary },
                        pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                      ]}
                      onPress={() =>
                        rootNavigation.navigate("ConsumptionScreen", { initialTab: "electric" })
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text style={homeStyles.usageSummaryCardTitle}>
                        {t("consumption.electric_summary")}
                      </Text>
                      {electricUsage.loading ? (
                        <ActivityIndicator color={brandPrimary} style={{ marginVertical: 8 }} />
                      ) : (
                        <>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_day")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.dayVal, electricUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_week")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.weekVal, electricUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_month")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.monthVal, electricUsage.unit)}
                            </Text>
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  <View
                    style={[
                      homeStyles.usageSummaryCardWrap,
                      homeStyles.usageSummaryCardWrapSecond,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        homeStyles.usageSummaryCard,
                        { borderLeftColor: waterAccent },
                        pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                      ]}
                      onPress={() =>
                        rootNavigation.navigate("ConsumptionScreen", { initialTab: "water" })
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text style={homeStyles.usageSummaryCardTitle}>
                        {t("consumption.water_summary")}
                      </Text>
                      {waterUsage.loading ? (
                        <ActivityIndicator color={waterAccent} style={{ marginVertical: 8 }} />
                      ) : (
                        <>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_day")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.dayVal, waterUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_week")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.weekVal, waterUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_month")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.monthVal, waterUsage.unit)}
                            </Text>
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

        <View
          style={homeStyles.homeSiteFooter}
          accessibilityLabel={t("home.footer.aria_label")}
        >
          <View style={homeStyles.homeSiteFooterVersionRow}>
            <View style={homeStyles.homeSiteFooterPill}>
              <Text style={homeStyles.homeSiteFooterPillText}>{t("home.footer.badge")}</Text>
            </View>
            <View style={homeStyles.homeSiteFooterDot} />
            <Text style={homeStyles.homeSiteFooterBuild}>{t("home.footer.build")}</Text>
          </View>
          <Text style={homeStyles.homeSiteFooterSupport}>{t("home.footer.support_line")}</Text>
          <View style={homeStyles.homeSiteFooterLinksRow}>
            {tenantFooterLinks.privacyPolicy.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.privacyPolicy)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_privacy")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_privacy")}</Text>
            )}
            <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_sep")}</Text>
            {tenantFooterLinks.termsOfUse.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.termsOfUse)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_terms")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_terms")}</Text>
            )}
            <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_sep")}</Text>
            {tenantFooterLinks.support.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.support)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_support")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_support")}</Text>
            )}
          </View>
          <Text style={homeStyles.homeSiteFooterCopy}>{t("home.footer.copyright")}</Text>
        </View>
      </View>
    );
  };

  if (!loadingHouses && tenantHouses.length === 0) {
    return (
      <View style={homeStyles.container}>
        <Header variant="default" onBrandPress={navigateToProfileFromHeader} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            homeStyles.accessGateEmptyWrap,
            { paddingBottom: 24 + insets.bottom },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || loading}
              onRefresh={onRefresh}
              colors={[brandPrimary]}
              tintColor={brandPrimary}
            />
          }
        >
          <Text style={homeStyles.accessGateEmptyText}>{t("home.access.no_house")}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <Header
        variant="default"
        showNotification={showFullHomeFeatures}
        homeWelcome={homeHeaderWelcome}
        onHomeWelcomeNamePress={navigateToProfileFromHeader}
        homeInvoiceStrip={homeInvoiceStrip}
        onHomeInvoicePress={navigateToInvoicesFromHeader}
      />

      {loading && !housesData ? (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color={brandPrimary} />
          <Text style={{ marginTop: 10, color: neutral.textSecondary }}>
            {t("home.loading_data")}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            homeStyles.deviceListContent,
            {
              paddingBottom: 24 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || loading}
              onRefresh={onRefresh}
              colors={[brandPrimary]}
              tintColor={brandPrimary}
            />
          }
        >
          {renderHomeScrollContent()}
        </ScrollView>
      )}

      <Modal
        visible={houseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          const picked = houseId && tenantHouses.some((h) => h.id === houseId);
          if (tenantHouses.length > 1 && !picked) return;
          setHouseModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            const picked = houseId && tenantHouses.some((h) => h.id === houseId);
            if (tenantHouses.length > 1 && !picked) return;
            setHouseModalVisible(false);
          }}
        >
          <View style={homeStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={homeStyles.modalContent}>
                <Text style={homeStyles.modalTitle}>
                  {t("home.select_main_house")}
                </Text>
                <FlatList
                  data={tenantHouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        homeStyles.houseItem,
                        item.id === myHouse?.id && homeStyles.houseItemActive,
                      ]}
                      onPress={() => handleSelectMainHouse(item.id)}
                      disabled={isSubmittingMainHouse}
                    >
                      <Text
                        style={[
                          homeStyles.houseItemText,
                          item.id === myHouse?.id && homeStyles.houseItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSubmittingMainHouse && item.id === pendingMainHouseId ? (
                        <ActivityIndicator size="small" color={brandPrimary} />
                      ) : item.id === myHouse?.id ? (
                        <Text style={{ color: brandPrimary, fontWeight: "bold" }}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={homeStyles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default HomeScreen;
