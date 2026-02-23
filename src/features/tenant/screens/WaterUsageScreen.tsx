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
import { waterUsageStyles } from "../styles/waterUsageStyles";

/** ID khu vực – khi có API sẽ map với zone/room từ backend */
export type AreaId = "all" | "kitchen" | "living_room" | "bedroom" | "bathroom";

/** Một điểm dữ liệu theo ngày (tuần: 7 ngày) */
export interface DailyDataPoint {
  dayIndex: number;
  value: number;
}

/**
 * Mock dữ liệu nước theo khu vực (tuần này – 7 ngày), đơn vị m³.
 * Sau khi có API: thay bằng dữ liệu từ BE, giữ cấu trúc areaId -> DailyDataPoint[].
 */
const MOCK_WATER_BY_AREA: Record<AreaId, DailyDataPoint[]> = {
  all: [
    { dayIndex: 1, value: 2.2 },
    { dayIndex: 2, value: 2.5 },
    { dayIndex: 3, value: 2.1 },
    { dayIndex: 4, value: 2.8 },
    { dayIndex: 5, value: 2.4 },
    { dayIndex: 6, value: 3.0 },
    { dayIndex: 7, value: 3.2 },
  ],
  kitchen: [
    { dayIndex: 1, value: 0.5 },
    { dayIndex: 2, value: 0.6 },
    { dayIndex: 3, value: 0.5 },
    { dayIndex: 4, value: 0.7 },
    { dayIndex: 5, value: 0.6 },
    { dayIndex: 6, value: 0.7 },
    { dayIndex: 7, value: 0.8 },
  ],
  living_room: [
    { dayIndex: 1, value: 0.3 },
    { dayIndex: 2, value: 0.3 },
    { dayIndex: 3, value: 0.4 },
    { dayIndex: 4, value: 0.4 },
    { dayIndex: 5, value: 0.3 },
    { dayIndex: 6, value: 0.4 },
    { dayIndex: 7, value: 0.5 },
  ],
  bedroom: [
    { dayIndex: 1, value: 0.2 },
    { dayIndex: 2, value: 0.3 },
    { dayIndex: 3, value: 0.2 },
    { dayIndex: 4, value: 0.3 },
    { dayIndex: 5, value: 0.3 },
    { dayIndex: 6, value: 0.4 },
    { dayIndex: 7, value: 0.4 },
  ],
  bathroom: [
    { dayIndex: 1, value: 1.2 },
    { dayIndex: 2, value: 1.3 },
    { dayIndex: 3, value: 1.0 },
    { dayIndex: 4, value: 1.4 },
    { dayIndex: 5, value: 1.2 },
    { dayIndex: 6, value: 1.5 },
    { dayIndex: 7, value: 1.5 },
  ],
};

const AREA_IDS: AreaId[] = [
  "all",
  "kitchen",
  "living_room",
  "bedroom",
  "bathroom",
];

const MAX_BAR_HEIGHT = 180;

/** Màu từng phần biểu đồ tròn (4 khu vực) – tông xanh nước */
const PIE_COLORS = ["#20B8EB", "#0e8fc4", "#5ec9f0", "#0a6b96"];

/** Tạo path SVG cho một lát bánh (góc 0 = phía trên, quay theo chiều kim đồng hồ). */
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

const WaterUsageScreen = () => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const [selectedArea, setSelectedArea] = useState<AreaId>("all");

  const chartData = useMemo(
    () => MOCK_WATER_BY_AREA[selectedArea] ?? [],
    [selectedArea]
  );

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map((d) => d.value), 0.1);
  }, [chartData]);

  /** Dữ liệu biểu đồ tròn: tổng nước từng khu vực trong tuần */
  const pieData = useMemo(() => {
    const areaIds: AreaId[] = ["kitchen", "living_room", "bedroom", "bathroom"];
    return areaIds.map((areaId, index) => {
      const points = MOCK_WATER_BY_AREA[areaId] ?? [];
      const total = points.reduce((sum, p) => sum + p.value, 0);
      return {
        areaId,
        label: t(`consumption.area_${areaId}` as "consumption.area_all"),
        value: total,
        color: PIE_COLORS[index % PIE_COLORS.length],
      };
    }).filter((d) => d.value > 0);
  }, [t]);

  const pieTotal = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0) || 0.01,
    [pieData]
  );

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

  const getAreaLabel = (areaId: AreaId) =>
    t(`consumption.area_${areaId}` as "consumption.area_all");

  return (
    <View style={waterUsageStyles.container}>
      <Header variant="water" />
      <ScrollView
        style={waterUsageStyles.content}
        contentContainerStyle={waterUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={waterUsageStyles.title}>
          {t("screens.water")}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={waterUsageStyles.categoryScroll}
          contentContainerStyle={waterUsageStyles.categoryContent}
        >
          {AREA_IDS.map((areaId) => {
            const isActive = selectedArea === areaId;
            return (
              <TouchableOpacity
                key={areaId}
                activeOpacity={0.7}
                style={[
                  waterUsageStyles.categoryChip,
                  isActive && waterUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedArea(areaId)}
              >
                <Text
                  style={[
                    waterUsageStyles.categoryChipText,
                    isActive && waterUsageStyles.categoryChipTextActive,
                  ]}
                >
                  {getAreaLabel(areaId)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={waterUsageStyles.chartCard}>
          <Text style={waterUsageStyles.chartTitle}>
            {t("consumption.chart_title_water")} ({t("consumption.period_week")})
          </Text>
          <View
            style={[
              waterUsageStyles.chartWrapper,
              { width: screenWidth - 80 },
            ]}
          >
            <View style={waterUsageStyles.chartBar}>
              {chartData.map((point) => {
                const heightRatio = maxValue > 0 ? point.value / maxValue : 0;
                const barHeight = Math.max(8, heightRatio * MAX_BAR_HEIGHT);
                return (
                  <View
                    key={point.dayIndex}
                    style={waterUsageStyles.barGroup}
                  >
                    <View
                      style={{
                        width: "80%",
                        maxWidth: 32,
                        height: barHeight,
                        backgroundColor: "#20B8EB",
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                      }}
                    />
                    <Text style={waterUsageStyles.barLabel}>
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
            ({t("consumption.unit_m3")})
          </Text>
        </View>

        {/* Card biểu đồ tròn: phân bố theo khu vực */}
        <View style={waterUsageStyles.chartCard}>
          <Text style={waterUsageStyles.chartTitle}>
            {t("consumption.chart_title_pie")}
          </Text>
          <View style={waterUsageStyles.pieChartWrapper}>
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
            <View style={waterUsageStyles.pieLegend}>
              {pieData.map((d) => (
                <View key={d.areaId} style={waterUsageStyles.pieLegendItem}>
                  <View
                    style={[
                      waterUsageStyles.pieLegendDot,
                      { backgroundColor: d.color },
                    ]}
                  />
                  <Text style={waterUsageStyles.pieLegendText}>
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

export default WaterUsageScreen;
