import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, useWindowDimensions, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import Icons from "../../../../shared/theme/icon";
import { FloorPlanView } from "../../houseStructure";
import { waterUsageStyles } from "./waterUsageStyles";
import { useTenantContext, useRefreshControlGate } from "../../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import { useTenantIoTConnection, useTenantTelemetry, useTenantUsage } from "../../hooks/useTenantIoT";
import { waterAccent, brandPrimary, neutral } from "../../../../shared/theme/color";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";

/** ID khu vực: "all" = tổng cả nhà (dữ liệu thật từ AWS), còn lại = id từ functionalAreas (chưa có dữ liệu). */
export type AreaId = string;

export type WaterUsageScreenProps = { showHeader?: boolean };

const MAX_BAR_HEIGHT = 180;

const WaterUsageScreen = ({ showHeader = true }: WaterUsageScreenProps) => {
  const { t, i18n } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { houseId, functionalAreas, thingId, house } = useTenantContext();
  const accessBlock = useMemo(() => (house ? getTenantAccessBlock(house) : null), [house]);

  const effectiveAreas = Array.isArray(functionalAreas) ? functionalAreas : [];
  const iotConnected = useTenantIoTConnection(thingId);
  const usage = useTenantUsage({ houseId, metric: "water" });
  const { water, waterHistory } = useTenantTelemetry(thingId);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();
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
      <View style={waterUsageStyles.container}>
        {showHeader ? <Header variant="water" /> : null}
        <View style={gateStyles.gateWrap}>
          <View style={gateStyles.gateBox}>
            <Text style={gateStyles.gateTitle}>{title}</Text>
            <Text style={gateStyles.gateBody}>{body}</Text>
          </View>
        </View>
      </View>
    );
  }

  const w = water?.features;

  const formatFixedOrDash = (val: number | undefined | null, digits: number) =>
    val == null || Number.isNaN(val) ? "—" : val.toFixed(digits);

  const dwTotDisplay =
    w?.d_w_tot != null && w.d_w_tot >= 0 ? w.d_w_tot.toFixed(3) : "—";

  const sparkData = useMemo(
    () => waterHistory.map((m) => m.features.w_lpm ?? 0),
    [waterHistory]
  );

  const sparkCurrent =
    w?.w_lpm != null && !Number.isNaN(w.w_lpm) ? w.w_lpm.toFixed(2) : "—";

  const statItems = [
    {
      key: "w_lpm",
      label: "LƯU LƯỢNG",
      valueText: formatFixedOrDash(w?.w_lpm, 2),
      unit: "L/min",
    },
    {
      key: "w_tot",
      label: "TỔNG TIÊU THỤ",
      valueText: formatFixedOrDash(w?.w_tot, 3),
      unit: "L",
    },
    {
      key: "d_w_tot",
      label: "d_w_tot",
      valueText: dwTotDisplay,
      unit: "L",
    },
    {
      key: "dt",
      label: "dt",
      valueText: formatFixedOrDash(w?.dt, 0),
      unit: "s",
    },
  ];

  return (
    <View style={waterUsageStyles.container}>
      {showHeader ? <Header variant="water" /> : null}
      <View style={{ flex: 1, position: "relative" }}>
        <RefreshLogoOverlay visible={pullRefreshing} />
        <ScrollView
          style={waterUsageStyles.content}
          contentContainerStyle={waterUsageStyles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={onScrollForRefreshGate}
          scrollEventThrottle={16}
          refreshControl={
            <PullToRefreshControl
              refreshing={pullRefreshing}
              onRefresh={onPullRefresh}
              scrollAtTop={scrollAtTop}
            />
          }
        >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Text style={waterUsageStyles.title}>
            {t("screens.water")}
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
          style={waterUsageStyles.categoryScroll}
          contentContainerStyle={waterUsageStyles.categoryContent}
        >
          {floorOptions.map((floor) => {
            const active = selectedFloor === floor;
            return (
              <TouchableOpacity
                key={floor}
                style={[
                  waterUsageStyles.categoryChip,
                  active && waterUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedFloor(floor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    waterUsageStyles.categoryChipText,
                    active && waterUsageStyles.categoryChipTextActive,
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
          accentColor={waterAccent}
        />

        {/* Realtime stat + sparkline (giống TestApp) */}
        <View style={waterUsageStyles.realtimeCard}>
          <View style={waterUsageStyles.realtimeTitleRow}>
            <Text style={waterUsageStyles.realtimeTitle}>DỮ LIỆU NƯỚC REALTIME</Text>
            <Text style={waterUsageStyles.realtimeTimestamp}>
              {water?.ts ? new Date(water.ts).toLocaleTimeString("vi-VN") : ""}
            </Text>
          </View>

          <View style={waterUsageStyles.statGrid}>
            {statItems.map((item) => (
              <View key={item.key} style={waterUsageStyles.statCard}>
                <Text style={waterUsageStyles.statLabel}>{item.label}</Text>
                <View style={waterUsageStyles.statValueRow}>
                  <Text style={[waterUsageStyles.statValue, { color: waterAccent }]}>
                    {item.valueText}
                  </Text>
                  <Text style={waterUsageStyles.statUnit}>{item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={waterUsageStyles.sparkCard}>
          <View style={waterUsageStyles.sparkHeader}>
            <Text style={waterUsageStyles.sparkTitle}>LƯU LƯỢNG THỰC</Text>
            <Text style={[waterUsageStyles.sparkCurrent, { color: waterAccent }]}>
              {sparkCurrent} L/min
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
                          backgroundColor: waterAccent,
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

        <View style={waterUsageStyles.chartCard}>
            <Text style={waterUsageStyles.chartTitle}>
              {t("consumption.chart_title_water")}
            </Text>
            {usage.loading ? (
              <View style={{ marginVertical: 24, alignItems: "center" }}>
                <RefreshLogoInline logoPx={22} showLabel />
              </View>
            ) : (
              <View
                style={[
                  waterUsageStyles.chartWrapper,
                  { width: screenWidth - 80 },
                ]}
              >
                <View style={waterUsageStyles.chartBar}>
                  {summaryBars.map((bar) => {
                    const heightRatio = maxSummary > 0 ? bar.value / maxSummary : 0;
                    const barHeight = Math.max(8, heightRatio * MAX_BAR_HEIGHT);
                    return (
                      <View key={bar.key} style={waterUsageStyles.barGroup}>
                        <View
                          style={{
                            width: "80%",
                            maxWidth: 48,
                            height: barHeight,
                            backgroundColor: waterAccent,
                            borderTopLeftRadius: 6,
                            borderTopRightRadius: 6,
                          }}
                        />
                        <Text style={waterUsageStyles.barLabel} numberOfLines={1}>
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
              ({t("consumption.unit_L")})
            </Text>
        </View>

        <View style={waterUsageStyles.chartCard}>
          <Text style={waterUsageStyles.chartTitle}>
            {t("consumption.chart_title_pie")}
          </Text>
          <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", paddingVertical: 16 }}>
            {t("consumption.no_data_area")}
          </Text>
        </View>
      </ScrollView>
      </View>
    </View>
  );
};

export default WaterUsageScreen;

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
