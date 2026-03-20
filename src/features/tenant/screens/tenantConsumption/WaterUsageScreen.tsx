import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../../../shared/components/header";
import Icons from "../../../../shared/theme/icon";
import { FloorPlanView } from "../../houseStructure";
import { getMockFunctionalAreas } from "../../houseStructure/floorPlanPositions";
import { waterUsageStyles } from "./waterUsageStyles";
import { useTenantContext } from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantTelemetry, useTenantUsage } from "../../hooks/useTenantIoT";

/** ID khu vực: "all" = tổng cả nhà (dữ liệu thật từ AWS), còn lại = id từ functionalAreas (chưa có dữ liệu). */
export type AreaId = string;

const MAX_BAR_HEIGHT = 180;
const WATER_ACCENT = "#20B8EB";

const WaterUsageScreen = () => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { houseId, functionalAreas, thingId } = useTenantContext();
  const safeFunctionalAreas = Array.isArray(functionalAreas) ? functionalAreas : [];
  /** Dùng mock khi BE trả rỗng (demo 3 tầng). */
  const effectiveAreas =
    safeFunctionalAreas.length > 0
      ? safeFunctionalAreas
      : getMockFunctionalAreas(houseId ?? "mock");
  const iotConnected = useTenantIoTConnection(thingId);
  const usage = useTenantUsage({ houseId, metric: "water" });
  const { water, waterHistory } = useTenantTelemetry(thingId);

  /** Tầng đang chọn: mặc định Tầng 1 (không còn "all"). */
  const [selectedFloor, setSelectedFloor] = useState<string>("1");
  /** Khu vực đang chọn: "all" hoặc areaId. */
  const [selectedArea, setSelectedArea] = useState<string>("all");
  /** Hiện/ẩn danh sách chip khu vực. */
  const [showAreaFilter, setShowAreaFilter] = useState(false);

  /** Danh sách tầng (Tầng 1, 2, 3). Dùng effectiveAreas; nếu rỗng fallback ["1","2","3"]. */
  const floorOptions = useMemo(() => {
    const floors = new Set(effectiveAreas.map((a) => a.floorNo).filter(Boolean));
    const list = Array.from(floors).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    return list.length > 0 ? list : ["1", "2", "3"];
  }, [effectiveAreas]);

  /** Khu vực theo tầng: "Tất cả" (dữ liệu cả nhà) + các khu vực của tầng. */
  const areaOptions = useMemo(() => {
    const areasOfFloor = effectiveAreas.filter((a) => a.floorNo === selectedFloor);
    return [
      { id: "all", label: t("consumption.area_all") },
      ...areasOfFloor.map((a) => ({ id: a.id, label: a.name })),
    ];
  }, [effectiveAreas, selectedFloor, t]);

  /** Nhãn hiển thị trên nút chọn khu vực. */
  const selectedAreaLabel = useMemo(() => {
    if (selectedArea === "all") {
      return areaOptions[0]?.label ?? t("consumption.area_all");
    }
    return (
      areaOptions.find((a) => a.id === selectedArea)?.label ??
      t("consumption.area_all")
    );
  }, [areaOptions, selectedArea, t]);

  /** Khi đổi tầng: reset về "all" nếu area hiện tại không thuộc tầng mới. */
  useEffect(() => {
    const areasOfFloor = effectiveAreas.filter((a) => a.floorNo === selectedFloor);
    const stillInFloor = areasOfFloor.some((a) => a.id === selectedArea);
    if (!stillInFloor) setSelectedArea("all");
  }, [selectedFloor, effectiveAreas, selectedArea]);

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

  const isAllArea = selectedArea === "all";

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
      <Header variant="water" />
      <View style={{ flex: 1 }}>
      <ScrollView
        style={waterUsageStyles.content}
        contentContainerStyle={waterUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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

        {/* Hàng chọn tầng: Tầng 1 | Tầng 2 | Tầng 3 (không còn Tất cả) */}
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 8 }}>
          {t("consumption.select_floor")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={waterUsageStyles.categoryScroll}
          contentContainerStyle={waterUsageStyles.categoryContent}
        >
          {floorOptions.map((floorNo) => {
            const isActive = selectedFloor === floorNo;
            return (
              <TouchableOpacity
                key={floorNo}
                activeOpacity={0.7}
                style={[
                  waterUsageStyles.categoryChip,
                  isActive && waterUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedFloor(floorNo)}
              >
                <Text
                  style={[
                    waterUsageStyles.categoryChipText,
                    isActive && waterUsageStyles.categoryChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t("consumption.floor_label", { floor: floorNo })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hàng chọn khu vực: nút sổ xuống nhỏ gọn, cách xa sơ đồ */}
        <View style={waterUsageStyles.areaSelectorWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowAreaFilter((v) => !v)}
            style={waterUsageStyles.areaDropdownBtn}
          >
            <View>
              <Text style={waterUsageStyles.areaDropdownLabel}>
                {t("consumption.select_area")}
              </Text>
              <Text style={waterUsageStyles.areaDropdownValue} numberOfLines={1}>
                {selectedAreaLabel}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: "#94a3b8" }}>
              {showAreaFilter ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {showAreaFilter && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={waterUsageStyles.areaChipScroll}
              contentContainerStyle={waterUsageStyles.areaChipContent}
            >
              {areaOptions.map((area) => {
                const isActive = selectedArea === area.id;
                return (
                  <TouchableOpacity
                    key={area.id}
                    activeOpacity={0.7}
                    style={[
                      waterUsageStyles.areaChip,
                      isActive && waterUsageStyles.areaChipActive,
                    ]}
                    onPress={() => setSelectedArea(area.id)}
                  >
                    <Text
                      style={[
                        waterUsageStyles.areaChipText,
                        isActive && waterUsageStyles.areaChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {area.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Sơ đồ nhà: house.png nền, khu vực theo position */}
        <FloorPlanView
          selectedFloor={selectedFloor}
          selectedAreaId={selectedArea}
          functionalAreas={effectiveAreas}
          onSelectArea={setSelectedArea}
          accentColor={WATER_ACCENT}
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
                  <Text style={[waterUsageStyles.statValue, { color: WATER_ACCENT }]}>
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
            <Text style={[waterUsageStyles.sparkCurrent, { color: WATER_ACCENT }]}>
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
                          backgroundColor: WATER_ACCENT,
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

        {isAllArea ? (
          <>
            <View style={waterUsageStyles.chartCard}>
              <Text style={waterUsageStyles.chartTitle}>
                {t("consumption.chart_title_water")}
              </Text>
              {usage.loading ? (
                <ActivityIndicator size="large" color="#20B8EB" style={{ marginVertical: 24 }} />
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
                              backgroundColor: "#20B8EB",
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
          </>
        ) : (
          <View style={waterUsageStyles.chartCard}>
            <Text style={waterUsageStyles.chartTitle}>
              {areaOptions.find((a) => a.id === selectedArea)?.label ?? selectedArea}
            </Text>
            <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", paddingVertical: 32 }}>
              {t("consumption.no_data_area")}
            </Text>
          </View>
        )}
      </ScrollView>
      </View>
    </View>
  );
};

export default WaterUsageScreen;
