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
import SuggestionDropdown, { Suggestion } from "../../../../shared/components/SuggestionDropdown";
import Icons from "../../../../shared/theme/icon";
import { electricUsageStyles } from "./electricUsageStyles";
import { useTenantContext } from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";

/** ID khu vực: "all" = tổng cả nhà (dữ liệu thật từ AWS), còn lại = id từ functionalAreas (chưa có dữ liệu). */
export type AreaId = string;

const MAX_BAR_HEIGHT = 180;

const ElectricUsageScreen = () => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { houseId, functionalAreas, thingId } = useTenantContext();
  const iotConnected = useTenantIoTConnection(thingId);
  const usage = useTenantUsage({ houseId, metric: "electricity" });

  /** Chuỗi tìm kiếm ngày từ Header. */
  const [searchQuery, setSearchQuery] = useState("");
  /** Ngày đang được chọn để xem (dạng "DD/MM/YYYY"), null = không lọc theo ngày. */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  /**
   * Gợi ý ngày: lấy 30 ngày gần nhất và lọc theo chuỗi người dùng nhập.
   * Ví dụ: gõ "01" → gợi ý "01/03/2026", "01/02/2026",...
   */
  const dateSuggestions = useMemo<Suggestion[]>(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const today = new Date();
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      dates.push(`${dd}/${mm}/${yyyy}`);
    }
    return dates
      .filter((date) => date.includes(q))
      .slice(0, 6)
      .map((date) => ({ id: date, label: date, typeLabel: t("search.type_date") }));
  }, [searchQuery, t]);

  /** Tab "Tất cả" + các khu vực từ API (chỉ UI sẵn, chưa có dữ liệu). */
  const areaOptions = useMemo(
    () => [
      { id: "all", label: t("consumption.area_all") },
      ...functionalAreas.map((a) => ({ id: a.id, label: a.name })),
    ],
    [functionalAreas, t]
  );
  const [selectedArea, setSelectedArea] = useState<string>("all");

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

  const isAllArea = selectedArea === "all";

  return (
    <View style={electricUsageStyles.container}>
      <Header
        variant="electric"
        searchQuery={searchQuery}
        onSearchChange={(text) => {
          setSearchQuery(text);
          if (!text.trim()) setSelectedDate(null);
        }}
        searchPlaceholder={t("search.placeholder_date")}
      />
      <View style={{ flex: 1 }}>
      <ScrollView
        style={electricUsageStyles.content}
        contentContainerStyle={electricUsageStyles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Badge ngày đang xem */}
        {selectedDate && (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            backgroundColor: "#EFF6FF",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 12,
            gap: 6,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#2563EB" }}>
              {t("search.viewing_date", { date: selectedDate })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icons.close size={12} color="#2563EB" />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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

        {/* Thanh chọn khu vực: Tất cả + functionalAreas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={electricUsageStyles.categoryScroll}
          contentContainerStyle={electricUsageStyles.categoryContent}
        >
          {areaOptions.map((area) => {
            const isActive = selectedArea === area.id;
            return (
              <TouchableOpacity
                key={area.id}
                activeOpacity={0.7}
                style={[
                  electricUsageStyles.categoryChip,
                  isActive && electricUsageStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedArea(area.id)}
              >
                <Text
                  style={[
                    electricUsageStyles.categoryChipText,
                    isActive && electricUsageStyles.categoryChipTextActive,
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
                              backgroundColor: "#82A762",
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
          </>
        ) : (
          /* Khu vực cụ thể: chưa có dữ liệu */
          <View style={electricUsageStyles.chartCard}>
            <Text style={electricUsageStyles.chartTitle}>
              {areaOptions.find((a) => a.id === selectedArea)?.label ?? selectedArea}
            </Text>
            <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", paddingVertical: 32 }}>
              {t("consumption.no_data_area")}
            </Text>
          </View>
        )}
      </ScrollView>
      <SuggestionDropdown
        visible={searchQuery.trim().length > 0}
        suggestions={dateSuggestions}
        query={searchQuery}
        onSelect={(sug) => {
          setSelectedDate(sug.id);
          setSearchQuery("");
        }}
        emptyText={t("search.no_result", { query: searchQuery })}
      />
      </View>
    </View>
  );
};

export default ElectricUsageScreen;
