import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Header from "../../../../shared/components/header";
import { RootStackParamList } from "../../../../shared/types";
import Icons from "../../../../shared/theme/icon";
import { FloorPlanView } from "../../houseStructure";
import { electricUsageStyles } from "./electricUsageStyles";
import { useTenantContext, useTenantHouses } from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantTelemetry, useTenantUsage } from "../../hooks/useTenantIoT";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";

/** ID khu vực: "all" = tổng cả nhà (dữ liệu thật từ AWS), còn lại = id từ functionalAreas (chưa có dữ liệu). */
export type AreaId = string;

const MAX_BAR_HEIGHT = 180;

const ElectricUsageScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t, i18n } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { houseId, functionalAreas, thingId, house } = useTenantContext();
  const { data: tenantHousesData } = useTenantHouses();
  const tenantHouses = tenantHousesData?.data ?? [];

  const accessBlock = useMemo(() => {
    if (!house) return null;
    return getTenantAccessBlock(house);
  }, [house]);

  const openPaymentScreen = useCallback(() => {
    const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
    const allPendingIds = tenantHouses
      .map((h) => String(h.pendingInvoiceId ?? "").trim())
      .filter((id) => id.length > 0);

    parentNav?.navigate?.("TenantRentPayment", {
      invoiceId: house?.pendingInvoiceId ?? undefined,
      invoiceIds: allPendingIds,
      afterSuccess: "home",
    });
  }, [navigation, tenantHouses, house?.pendingInvoiceId]);
  const effectiveAreas = Array.isArray(functionalAreas) ? functionalAreas : [];
  const iotConnected = useTenantIoTConnection(thingId);
  const usage = useTenantUsage({ houseId, metric: "electricity" });
  const { power, powerHistory } = useTenantTelemetry(thingId);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await usage.refetch();
    } finally {
      setPullRefreshing(false);
    }
  }, [usage.refetch]);

  /** Tầng đang chọn: mặc định Tầng 1 (không còn "all"). */
  const [selectedFloor, setSelectedFloor] = useState<string>("1");
  /** Danh sách tầng suy ra từ khu vực chức năng (BE / house). */
  const floorOptions = useMemo(() => {
    const floors = new Set(effectiveAreas.map((a) => a.floorNo).filter(Boolean));
    return Array.from(floors).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [effectiveAreas]);

  /** Dữ liệu cho biểu đồ "Tất cả": 3 cột Day / Week / Month từ AWS. */
  const summaryBars = useMemo(
    () => [
      { key: "day", label: t("consumption.period_day"), value: usage.dayVal },
      { key: "week", label: t("consumption.period_week"), value: usage.weekVal },
      { key: "month", label: t("consumption.period_month"), value: usage.monthVal },
    ],
    [usage.dayVal, usage.weekVal, usage.monthVal, t]
  );
  const maxSummary = useMemo(
    () => Math.max(...summaryBars.map((b) => b.value), 0.001),
    [summaryBars]
  );

  const f = power?.features;
  const formatFixedOrDash = (val: number | undefined | null, digits: number) =>
    val == null || Number.isNaN(val) ? "—" : val.toFixed(digits);

  const kwhDisplay =
    f?.kwh != null && f.kwh >= 0 ? f.kwh.toFixed(4) : "—";
  const dkwhDisplay =
    f?.d_kwh != null && f.d_kwh >= 0 ? f.d_kwh.toFixed(4) : "—";

  const sparkData = useMemo(
    () => powerHistory.map((m) => m.features.p ?? 0),
    [powerHistory]
  );

  const sparkCurrent =
    f?.p != null && !Number.isNaN(f.p) ? f.p.toFixed(1) : "—";

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
      <View style={electricUsageStyles.container}>
        <Header variant="electric" />
        <View style={gateStyles.gateWrap}>
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
      </View>
    );
  }

  const statItems = [
    {
      key: "v",
      label: "ĐIỆN ÁP",
      valueText: formatFixedOrDash(f?.v, 1),
      unit: "V",
    },
    {
      key: "i",
      label: "DÒNG ĐIỆN",
      valueText: formatFixedOrDash(f?.i, 3),
      unit: "A",
    },
    {
      key: "p",
      label: "CÔNG SUẤT",
      valueText: formatFixedOrDash(f?.p, 1),
      unit: "W",
    },
    {
      key: "hz",
      label: "TẦN SỐ",
      valueText: formatFixedOrDash(f?.hz, 1),
      unit: "Hz",
    },
    {
      key: "pf",
      label: "HỆ SỐ CS",
      valueText: formatFixedOrDash(f?.pf, 3),
      unit: "PF",
    },
    {
      key: "kwh",
      label: "TỔNG kWh",
      valueText: kwhDisplay,
      unit: "kWh",
    },
    {
      key: "d_kwh",
      label: "d_kwh",
      valueText: dkwhDisplay,
      unit: "kWh",
    },
  ];

  return (
    <View style={electricUsageStyles.container}>
      <Header variant="electric" />
      <ScrollView
        style={electricUsageStyles.content}
        contentContainerStyle={electricUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onPullRefresh}
            tintColor={brandPrimary}
            colors={[brandPrimary]}
          />
        }
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Text style={electricUsageStyles.title}>
            {t("screens.electric")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: iotConnected ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
              borderWidth: 1,
              borderColor: iotConnected ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: iotConnected ? "#4ADE80" : "#F87171",
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: iotConnected ? "#16a34a" : "#dc2626",
              }}
            >
              {iotConnected ? t("consumption.iot_live") : t("consumption.iot_offline")}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={electricUsageStyles.categoryScroll}
          contentContainerStyle={electricUsageStyles.categoryContent}
        >
          {floorOptions.map((floor) => {
            const active = selectedFloor === floor;
            return (
              <TouchableOpacity
                key={floor}
                style={[
                  electricUsageStyles.categoryChip,
                  active && electricUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedFloor(floor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    electricUsageStyles.categoryChipText,
                    active && electricUsageStyles.categoryChipTextActive,
                  ]}
                >
                  {t("consumption.floor_label", { floor })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sơ đồ nhà: Cover_Floor_Plan nền, khu vực theo position */}
        <FloorPlanView
          selectedFloor={selectedFloor}
          selectedAreaId="all"
          functionalAreas={effectiveAreas}
          onSelectArea={() => {}}
          accentColor={brandPrimary}
        />

        {/* Realtime stat + sparkline (giống TestApp) */}
        <View style={electricUsageStyles.realtimeCard}>
          <View style={electricUsageStyles.realtimeTitleRow}>
            <Text style={electricUsageStyles.realtimeTitle}>DỮ LIỆU ĐIỆN REALTIME</Text>
            <Text style={electricUsageStyles.realtimeTimestamp}>
              {power?.ts ? new Date(power.ts).toLocaleTimeString("vi-VN") : ""}
            </Text>
          </View>

          <View style={electricUsageStyles.statGrid}>
            {statItems.map((item) => (
              <View key={item.key} style={electricUsageStyles.statCard}>
                <Text style={electricUsageStyles.statLabel}>{item.label}</Text>
                <View style={electricUsageStyles.statValueRow}>
                  <Text style={[electricUsageStyles.statValue, { color: brandPrimary }]}>
                    {item.valueText}
                  </Text>
                  <Text style={electricUsageStyles.statUnit}>{item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={electricUsageStyles.sparkCard}>
          <View style={electricUsageStyles.sparkHeader}>
            <Text style={electricUsageStyles.sparkTitle}>CÔNG SUẤT THỰC</Text>
            <Text style={[electricUsageStyles.sparkCurrent, { color: brandPrimary }]}>
              {sparkCurrent} W
            </Text>
          </View>

          {sparkData.length < 3 ? (
            <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingVertical: 18 }}>
              Đang chờ dữ liệu realtime...
            </Text>
          ) : (
            (() => {
              const max = Math.max(...sparkData, 1);
              const H = 52;
              const bars = sparkData.slice(-30);
              const sparkWidth = screenWidth - 80;
              const barW = Math.max(2, sparkWidth / bars.length - 1);
              return (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    height: H,
                    alignSelf: "center",
                    width: sparkWidth,
                  }}
                >
                  {bars.map((v, i) => {
                    const h = Math.max((v / max) * H, 2);
                    const opacity = 0.3 + (i / bars.length) * 0.7;
                    return (
                      <View
                        key={i}
                        style={{
                          height: h,
                          width: barW,
                          backgroundColor: brandPrimary,
                          opacity,
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        }}
                      />
                    );
                  })}
                </View>
              );
            })()
          )}
        </View>

        {/* Tab "Tất cả": biểu đồ 3 cột Day / Week / Month từ AWS */}
        <View style={electricUsageStyles.chartCard}>
            <Text style={electricUsageStyles.chartTitle}>
              {t("consumption.chart_title_electric")}
            </Text>
            {usage.loading ? (
              <ActivityIndicator size="large" color="#82A762" style={{ marginVertical: 24 }} />
            ) : (
              <View
                style={[
                  electricUsageStyles.chartWrapper,
                  { width: screenWidth - 80 },
                ]}
              >
                <View style={electricUsageStyles.chartBar}>
                  {summaryBars.map((bar) => {
                    const heightRatio = maxSummary > 0 ? bar.value / maxSummary : 0;
                    const barHeight = Math.max(8, heightRatio * MAX_BAR_HEIGHT);
                    return (
                      <View key={bar.key} style={electricUsageStyles.barGroup}>
                        <View
                          style={{
                            width: "80%",
                            maxWidth: 48,
                            height: barHeight,
                            backgroundColor: brandPrimary,
                            borderTopLeftRadius: 6,
                            borderTopRightRadius: 6,
                          }}
                        />
                        <Text style={electricUsageStyles.barLabel} numberOfLines={1}>
                          {bar.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                          {bar.value.toFixed(2)} {usage.unit}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            <Text style={{ fontSize: 12, color: "#64748b", marginTop: 8, textAlign: "center" }}>
              ({t("consumption.unit_kwh")})
            </Text>
        </View>

        {/* Pie: hiện chưa có dữ liệu theo khu vực từ AWS, chỉ để sẵn UI */}
        <View style={electricUsageStyles.chartCard}>
          <Text style={electricUsageStyles.chartTitle}>
            {t("consumption.chart_title_pie")}
          </Text>
          <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingVertical: 16 }}>
            {t("consumption.no_data_area")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default ElectricUsageScreen;

const gateStyles = StyleSheet.create({
  gateWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gateBox: {
    backgroundColor: neutral.surface,
    borderRadius: 14,
    padding: 16,
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
