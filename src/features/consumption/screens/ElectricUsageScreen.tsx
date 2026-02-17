import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import Header from "../../../shared/components/header";
import { electricUsageStyles } from "./electricUsageStyles";

/** ID khu vực – khi có API sẽ map với zone/room từ backend */
export type AreaId = "all" | "kitchen" | "living_room" | "bedroom" | "bathroom";

/** Một điểm dữ liệu theo ngày (tuần: 7 ngày) */
export interface DailyDataPoint {
  dayIndex: number;
  value: number;
}

/**
 * Mock dữ liệu điện theo khu vực (tuần này – 7 ngày).
 * Sau khi có API: thay bằng dữ liệu từ BE, giữ cấu trúc areaId -> DailyDataPoint[].
 */
const MOCK_ELECTRIC_BY_AREA: Record<AreaId, DailyDataPoint[]> = {
  all: [
    { dayIndex: 1, value: 12 },
    { dayIndex: 2, value: 15 },
    { dayIndex: 3, value: 14 },
    { dayIndex: 4, value: 18 },
    { dayIndex: 5, value: 16 },
    { dayIndex: 6, value: 20 },
    { dayIndex: 7, value: 22 },
  ],
  kitchen: [
    { dayIndex: 1, value: 3 },
    { dayIndex: 2, value: 4 },
    { dayIndex: 3, value: 3 },
    { dayIndex: 4, value: 5 },
    { dayIndex: 5, value: 4 },
    { dayIndex: 6, value: 5 },
    { dayIndex: 7, value: 6 },
  ],
  living_room: [
    { dayIndex: 1, value: 4 },
    { dayIndex: 2, value: 5 },
    { dayIndex: 3, value: 5 },
    { dayIndex: 4, value: 6 },
    { dayIndex: 5, value: 5 },
    { dayIndex: 6, value: 7 },
    { dayIndex: 7, value: 8 },
  ],
  bedroom: [
    { dayIndex: 1, value: 2 },
    { dayIndex: 2, value: 3 },
    { dayIndex: 3, value: 3 },
    { dayIndex: 4, value: 4 },
    { dayIndex: 5, value: 4 },
    { dayIndex: 6, value: 5 },
    { dayIndex: 7, value: 5 },
  ],
  bathroom: [
    { dayIndex: 1, value: 3 },
    { dayIndex: 2, value: 3 },
    { dayIndex: 3, value: 3 },
    { dayIndex: 4, value: 3 },
    { dayIndex: 5, value: 3 },
    { dayIndex: 6, value: 3 },
    { dayIndex: 7, value: 3 },
  ],
};

const AREA_IDS: AreaId[] = [
  "all",
  "kitchen",
  "living_room",
  "bedroom",
  "bathroom",
];

const MAX_BAR_HEIGHT = 180; // Chiều cao tối đa của cột

/** Màu từng phần biểu đồ tròn (4 khu vực: bếp, phòng khách, phòng ngủ, phòng tắm) */
const PIE_COLORS = ["#82A762", "#5a8a42", "#a8d68a", "#3d6b2a"];

/**
 * Tạo path SVG cho một lát bánh (từ góc startDeg đến endDeg, đơn vị độ).
 * Góc 0 = phía trên (12h), quay theo chiều kim đồng hồ.
 */
function getPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const startRad = toRad(startDeg);
  const endRad = toRad(endDeg);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

const ElectricUsageScreen = () => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedArea, setSelectedArea] = useState<AreaId>("all");

  /** Dữ liệu hiển thị theo khu vực đang chọn */
  const chartData = useMemo(
    () => MOCK_ELECTRIC_BY_AREA[selectedArea] ?? [],
    [selectedArea]
  );

  /** Giá trị lớn nhất trong dữ liệu – dùng để scale chiều cao cột */
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map((d) => d.value), 1);
  }, [chartData]);

  /**
   * Dữ liệu biểu đồ tròn: tổng tiêu thụ từng khu vực (trừ "all") trong tuần.
   * Dùng để vẽ phân bố theo khu vực.
   */
  const pieData = useMemo(() => {
    const areaIds: AreaId[] = ["kitchen", "living_room", "bedroom", "bathroom"];
    return areaIds.map((areaId, index) => {
      const points = MOCK_ELECTRIC_BY_AREA[areaId] ?? [];
      const total = points.reduce((sum, p) => sum + p.value, 0);
      return {
        areaId,
        label: t(`consumption.area_${areaId}` as "consumption.area_all"),
        value: total,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    }).filter((d) => d.value > 0);
  }, [t]);

  /** Tổng để tính phần trăm từng lát */
  const pieTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0) || 1,
    [pieData]
  );

  /** Các lát bánh (góc bắt đầu, kết thúc, màu) để vẽ SVG */
  const pieSlices = useMemo(() => {
    let start = 0;
    return pieData.map((d) => {
      const pct = (d.value / pieTotal) * 360;
      const end = start + pct;
      const slice = { start, end, color: d.color };
      start = end;
      return slice;
    });
  }, [pieData, pieTotal]);

  /** Lấy label i18n cho khu vực (consumption.area_xxx) */
  const getAreaLabel = (areaId: AreaId) =>
    t(`consumption.area_${areaId}` as "consumption.area_all");

  return (
    <View style={electricUsageStyles.container}>
      <Header variant="electric" />
      <ScrollView
        style={electricUsageStyles.content}
        contentContainerStyle={electricUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={electricUsageStyles.title}>
          {t("screens.electric")}
        </Text>

        {/* Thanh category: chọn khu vực */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={electricUsageStyles.categoryScroll}
          contentContainerStyle={electricUsageStyles.categoryContent}
        >
          {AREA_IDS.map((areaId) => {
            const isActive = selectedArea === areaId;
            return (
              <TouchableOpacity
                key={areaId}
                activeOpacity={0.7}
                style={[
                  electricUsageStyles.categoryChip,
                  isActive && electricUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedArea(areaId)}
              >
                <Text
                  style={[
                    electricUsageStyles.categoryChipText,
                    isActive && electricUsageStyles.categoryChipTextActive,
                  ]}
                >
                  {getAreaLabel(areaId)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Card biểu đồ cột */}
        <View style={electricUsageStyles.chartCard}>
          <Text style={electricUsageStyles.chartTitle}>
            {t("consumption.chart_title_electric")} ({t("consumption.period_week")})
          </Text>
          <View
            style={[
              electricUsageStyles.chartWrapper,
              { width: screenWidth - 80 },
            ]}
          >
            <View style={electricUsageStyles.chartBar}>
              {chartData.map((point) => {
                const heightRatio = maxValue > 0 ? point.value / maxValue : 0;
                const barHeight = Math.max(8, heightRatio * MAX_BAR_HEIGHT);
                return (
                  <View
                    key={point.dayIndex}
                    style={electricUsageStyles.barGroup}
                  >
                    <View
                      style={{
                        width: "80%",
                        maxWidth: 32,
                        height: barHeight,
                        backgroundColor: "#82A762",
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                      }}
                    />
                    <Text style={electricUsageStyles.barLabel}>
                      {t("consumption.day_label", { n: point.dayIndex })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            ({t("consumption.unit_kwh")})
          </Text>
        </View>

        {/* Card biểu đồ tròn: phân bố theo khu vực */}
        <View style={electricUsageStyles.chartCard}>
          <Text style={electricUsageStyles.chartTitle}>
            {t("consumption.chart_title_pie")}
          </Text>
          <View style={electricUsageStyles.pieChartWrapper}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              {pieSlices.map((slice, i) => (
                <Path
                  key={i}
                  d={getPieSlicePath(90, 90, 78, slice.start, slice.end)}
                  fill={slice.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Svg>
            <View style={electricUsageStyles.pieLegend}>
              {pieData.map((d, i) => (
                <View key={d.areaId} style={electricUsageStyles.pieLegendItem}>
                  <View
                    style={[
                      electricUsageStyles.pieLegendDot,
                      { backgroundColor: d.color },
                    ]}
                  />
                  <Text style={electricUsageStyles.pieLegendText}>
                    {d.label} ({((d.value / pieTotal) * 100).toFixed(0)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ElectricUsageScreen;
