import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Header from "../../../../shared/components/header";
import { useTenantContext } from "../../../../shared/hooks";
import { useTenantForecast } from "../../../../shared/hooks/useTenantForecast";
import { useAreasUsageDistribution } from "../../../../shared/hooks/useAreasUsageDistribution";
import {
  useTenantIoTConnection,
  useTenantTelemetry,
  useAreaTelemetry,
  useTenantUsage,
  useRealtimeAreas,
} from "../../hooks/useTenantIoT";
import { waterAccent } from "../../../../shared/theme/color";

const ACCENT = waterAccent;

interface AreaChip {
  id: string;
  label: string;
}

function fmt(val?: number | null, digits = 1) {
  if (val == null || Number.isNaN(val)) return "—";
  return val.toFixed(digits);
}

function UsageMiniCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value.toFixed(1)}
        <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

function RealtimeStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.realtimeStat}>
      <Text style={styles.realtimeStatLabel}>{label}</Text>
      <Text style={[styles.realtimeStatValue, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

function ForecastBars({
  data,
  color,
}: {
  data: { ds: string; yhat: number }[];
  color: string;
}) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.yhat), 0.001);

  return (
    <View style={styles.forecastBarsRow}>
      {data.map((item, idx) => {
        const h = Math.max(12, (item.yhat / max) * 42);
        const dayLabel = new Date(item.ds).toLocaleDateString("vi-VN", {
          weekday: "short",
        });

        return (
          <View key={`${item.ds}-${idx}`} style={styles.forecastBarItem}>
            <View style={styles.forecastBarTrack}>
              <View
                style={[
                  styles.forecastBarFill,
                  { height: h, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.forecastBarLabel}>{dayLabel.slice(0, 2)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ForecastCard({
  data,
  loading,
  unit,
  color,
}: {
  data: any | null;
  loading: boolean;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.bigCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Dự báo cuối tháng</Text>
        <View style={[styles.aiBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.aiBadgeText, { color }]}>
            {data?.status === "ESTIMATE" ? "Estimate AI" : "Prophet AI"}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={color} />
        </View>
      ) : data ? (
        <>
          <Text style={[styles.forecastBigValue, { color }]}>
            {fmt(data.totalEstimate, 1)}
            <Text style={styles.forecastBigUnit}> {unit}</Text>
          </Text>

          <Text style={styles.forecastSub}>
            Đã dùng {fmt(data.usedSoFar, 1)} {unit} | Còn {data.daysLeft} ngày |
            +{fmt(data.forecastRemaining, 1)} {unit}
          </Text>

          <View style={styles.forecastRangeTrack}>
            <View
              style={[
                styles.forecastRangeFill,
                {
                  width: `${
                    data.totalEstimate > 0
                      ? Math.min(100, (data.usedSoFar / data.totalEstimate) * 100)
                      : 0
                  }%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>

          <ForecastBars
            data={(data.dailyForecast ?? []).slice(0, 7)}
            color={color}
          />
        </>
      ) : (
        <Text style={styles.emptyText}>Chưa có dữ liệu dự báo</Text>
      )}
    </View>
  );
}

function DistributionCard({
  areas,
  metric,
  usageValues,
  distributionItems,
}: {
  areas: AreaChip[];
  metric: "electricity" | "water";
  usageValues: Record<string, number>;
  distributionItems: Array<{
    areaId: string;
    areaName: string;
    value: number;
  }>;
}) {
  const items = useMemo(() => {
    const fromAreas = areas
      .filter((a) => a.id !== "all")
      .map((a) => ({
        id: a.id,
        label: a.label,
        value: usageValues[a.id] ?? 0,
      }));

    const knownIds = new Set(fromAreas.map((x) => x.id));

    const extras = distributionItems
      .filter((x) => !knownIds.has(x.areaId))
      .map((x) => ({
        id: x.areaId,
        label: x.areaName || x.areaId,
        value: x.value,
      }));

    const merged = [...fromAreas, ...extras];
    return merged.filter((x) => x.value > 0);
  }, [areas, usageValues, distributionItems]);

  const maxVal = Math.max(...items.map((i) => i.value), 0.001);

  return (
    <View style={styles.bigCard}>
      <Text style={styles.cardTitle}>Phân bổ theo khu vực</Text>

      {items.length === 0 ? (
        <Text style={styles.emptyText}>
          Chưa có tiêu thụ theo khu vực trong tháng này
        </Text>
      ) : (
        items.map((item, idx) => {
          const width = `${Math.max(8, (item.value / maxVal) * 100)}%`;

          return (
            <View key={item.id} style={styles.distRow}>
              <View style={styles.distLeft}>
                <View
                  style={[
                    styles.distDot,
                    { backgroundColor: areaColors[idx % areaColors.length] },
                  ]}
                />
                <Text style={styles.distLabel}>{item.label}</Text>
              </View>

              <View style={styles.distRight}>
                <Text style={styles.distValue}>
                  {metric === "electricity"
                    ? `${item.value.toFixed(1)} kWh`
                    : `${item.value.toFixed(1)} L`}
                </Text>
                <View style={styles.distTrack}>
                  <View
                    style={[
                      styles.distFill,
                      {
                        width,
                        backgroundColor: areaColors[idx % areaColors.length],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const areaColors = ["#22C55E", "#0EA5E9", "#8B5CF6", "#F97316", "#EC4899"];

const WaterUsageScreen = () => {
  const { houseId, functionalAreas, thingId } = useTenantContext();
  const realtimeAreas = useRealtimeAreas(thingId);

  const effectiveAreas = useMemo(() => {
    const fromContext = Array.isArray(functionalAreas) ? functionalAreas : [];
    if (fromContext.length > 0) return fromContext;

    return realtimeAreas.map((a) => ({
      id: a.id,
      name: a.name,
    }));
  }, [functionalAreas, realtimeAreas]);

  const iotConnected = useTenantIoTConnection(thingId);

  const areaChips = useMemo<AreaChip[]>(() => {
    const all: AreaChip[] = [{ id: "all", label: "Tổng nhà" }];
    effectiveAreas.forEach((a) => {
      all.push({ id: a.id, label: a.name });
    });
    return all;
  }, [effectiveAreas]);

  const [selectedAreaId, setSelectedAreaId] = useState<string>("all");
  const isHouseLevel = selectedAreaId === "all";
  const activeAreaId = isHouseLevel ? null : selectedAreaId;

  const usage = useTenantUsage({
    houseId,
    metric: "water",
    areaId: activeAreaId,
  });

  const forecast = useTenantForecast({
    houseId,
    metric: "water",
    areaId: activeAreaId,
  });

  const areaDistributionAreas = useMemo(
    () =>
      effectiveAreas.map((a) => ({
        id: a.id,
        name: a.name,
      })),
    [effectiveAreas]
  );

  const areaDistribution = useAreasUsageDistribution({
    houseId,
    metric: "water",
    areas: areaDistributionAreas,
  });

  const houseTelemetry = useTenantTelemetry(thingId);
  const areaTelemetry = useAreaTelemetry(thingId, activeAreaId);
  const activeTelemetry = isHouseLevel ? houseTelemetry : areaTelemetry;
  const { water } = activeTelemetry;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        usage.refetch(),
        forecast.refetch(),
        areaDistribution.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [usage.refetch, forecast.refetch, areaDistribution.refetch]);

  const w = water?.features;

  const areaUsageValues = useMemo(() => {
    const result: Record<string, number> = {};
    areaDistribution.items.forEach((item) => {
      result[item.areaId] = item.value;
    });
    return result;
  }, [areaDistribution.items]);

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={ACCENT}
          colors={[ACCENT]}
        />
      }
    >
      <Header title="Tiêu thụ nước" />

      <View style={styles.liveRow}>
        <View
          style={[
            styles.liveBadge,
            { backgroundColor: iotConnected ? "#E8F8EE" : "#FFF1F2" },
          ]}
        >
          <View
            style={[
              styles.liveDot,
              { backgroundColor: iotConnected ? "#22C55E" : "#EF4444" },
            ]}
          />
          <Text
            style={[
              styles.liveText,
              { color: iotConnected ? "#16A34A" : "#DC2626" },
            ]}
          >
            {iotConnected ? "LIVE" : "OFFLINE"}
          </Text>
        </View>
      </View>

      <View style={styles.switchWrap}>
        <TouchableOpacity style={styles.switchBtn}>
          <Text style={styles.switchText}>Điện</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.switchBtn, styles.switchBtnActive]}>
          <Text style={[styles.switchText, styles.switchTextActive]}>Nước</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {areaChips.map((chip) => {
          const active = selectedAreaId === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.areaChip,
                active && {
                  borderBottomColor: ACCENT,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setSelectedAreaId(chip.id)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.areaChipText,
                  active && { color: ACCENT, fontWeight: "700" },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionText}>
          TIÊU THỤ —{" "}
          {isHouseLevel
            ? "TỔNG NHÀ"
            : (areaChips.find((c) => c.id === selectedAreaId)?.label ?? "").toUpperCase()}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <UsageMiniCard label="Hôm nay" value={usage.dayVal} unit="L" />
        <UsageMiniCard label="Tuần này" value={usage.weekVal} unit="L" />
        <UsageMiniCard label="Tháng này" value={usage.monthVal} unit="L" />
      </View>

      <View style={styles.bigCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Realtime</Text>
          <Text style={styles.cardSubtle}>vừa xong</Text>
        </View>

        {water ? (
          <View style={styles.realtimeGrid}>
            <RealtimeStat label="Lưu lượng" value={`${fmt(w?.w_lpm, 1)}L/m`} color="#0EA5E9" />
            <RealtimeStat label="Tổng dùng" value={`${fmt(w?.w_tot, 0)}L`} />
            <RealtimeStat label="Lần này" value={`${fmt(w?.d_w_tot, 1)}L`} color="#2563EB" />
            <RealtimeStat label="Trạng thái" value={"OK"} color="#22C55E" />
          </View>
        ) : (
          <Text style={styles.emptyText}>Không có kết nối IoT</Text>
        )}
      </View>

      <ForecastCard
        data={forecast.data}
        loading={forecast.loading}
        unit="L"
        color={ACCENT}
      />

      <DistributionCard
        areas={areaChips}
        metric="water"
        usageValues={areaUsageValues}
        distributionItems={areaDistribution.items}
      />

      <View style={{ height: 36 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },

  liveRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
  },

  switchWrap: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "#EEF2F7",
    borderRadius: 14,
    padding: 4,
    flexDirection: "row",
  },
  switchBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  switchBtnActive: {
    backgroundColor: "#FFFFFF",
  },
  switchText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  switchTextActive: {
    color: ACCENT,
  },

  chipScroll: {
    marginTop: 12,
  },
  chipContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  areaChip: {
    paddingBottom: 8,
  },
  areaChipText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  sectionWrap: {
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
  },

  metricRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  bigCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9EEF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSubtle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  realtimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    borderRadius: 14,
    overflow: "hidden",
  },
  realtimeStat: {
    width: "50%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    borderRightWidth: 1,
    borderRightColor: "#EDF2F7",
  },
  realtimeStatLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "600",
  },
  realtimeStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  aiBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  loadingArea: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  forecastBigValue: {
    marginTop: 14,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  forecastBigUnit: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748B",
  },
  forecastSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  forecastRangeTrack: {
    marginTop: 12,
    height: 6,
    backgroundColor: "#E5EAF2",
    borderRadius: 999,
    overflow: "hidden",
  },
  forecastRangeFill: {
    height: "100%",
    borderRadius: 999,
  },
  forecastBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  forecastBarItem: {
    alignItems: "center",
    flex: 1,
  },
  forecastBarTrack: {
    width: 10,
    height: 46,
    backgroundColor: "#EEF2F7",
    borderRadius: 99,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  forecastBarFill: {
    width: "100%",
    borderRadius: 99,
  },
  forecastBarLabel: {
    marginTop: 6,
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },

  distRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  distLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  distDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginRight: 8,
  },
  distLabel: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
  },
  distRight: {
    width: 110,
    alignItems: "flex-end",
  },
  distValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  distTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#EEF2F7",
    borderRadius: 999,
    overflow: "hidden",
  },
  distFill: {
    height: "100%",
    borderRadius: 999,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 13,
    color: "#94A3B8",
  },
});

export default WaterUsageScreen;