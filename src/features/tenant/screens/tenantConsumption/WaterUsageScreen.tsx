import React, { useMemo, useState } from "react";
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
import { waterUsageStyles } from "./waterUsageStyles";
import { useTenantContext } from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";

/** ID khu vực: "all" = tổng cả nhà (dữ liệu thật từ AWS), còn lại = id từ functionalAreas (chưa có dữ liệu). */
export type AreaId = string;

const MAX_BAR_HEIGHT = 180;

const WaterUsageScreen = () => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { houseId, functionalAreas, thingId } = useTenantContext();
  const iotConnected = useTenantIoTConnection(thingId);
  const usage = useTenantUsage({ houseId, metric: "water" });

  const areaOptions = useMemo(
    () => [
      { id: "all", label: t("consumption.area_all") },
      ...functionalAreas.map((a) => ({ id: a.id, label: a.name })),
    ],
    [functionalAreas, t]
  );
  const [selectedArea, setSelectedArea] = useState<string>("all");

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

  return (
    <View style={waterUsageStyles.container}>
      <Header variant="water" />
      <ScrollView
        style={waterUsageStyles.content}
        contentContainerStyle={waterUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={waterUsageStyles.categoryScroll}
          contentContainerStyle={waterUsageStyles.categoryContent}
        >
          {areaOptions.map((area) => {
            const isActive = selectedArea === area.id;
            return (
              <TouchableOpacity
                key={area.id}
                activeOpacity={0.7}
                style={[
                  waterUsageStyles.categoryChip,
                  isActive && waterUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedArea(area.id)}
              >
                <Text
                  style={[
                    waterUsageStyles.categoryChipText,
                    isActive && waterUsageStyles.categoryChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {area.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
  );
};

export default WaterUsageScreen;
