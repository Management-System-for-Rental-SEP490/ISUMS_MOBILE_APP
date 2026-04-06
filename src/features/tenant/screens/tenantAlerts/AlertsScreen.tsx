// src/features/tenant/screens/tenantAlerts/AlertsScreen.tsx

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SectionList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import { useAlertHistory } from "../hooks/useAlertHistory";
import AlertCard from "../../../components/AlertCard";
import { IAlert, AlertLevel, AlertMetric } from "../../../types/alert";
import {
  groupAlertsByDate,
  countByLevel,
  getLevelColor,
} from "../../../utils/alertHelpers";

// ── Filter tabs
const LEVEL_FILTERS: { label: string; value: AlertLevel | "ALL" }[] = [
  { label: "Tất cả",    value: "ALL" },
  { label: "🔴 Nguy hiểm", value: "CRITICAL" },
  { label: "🟡 Cảnh báo",  value: "WARNING" },
  { label: "🔵 Thông tin", value: "INFO" },
];

// ── Category filters
const CATEGORY_FILTERS: { label: string; metric?: AlertMetric }[] = [
  { label: "Tất cả" },
  { label: "🔥 Gas",     metric: "gas_ppm" },
  { label: "🌡️ Nhiệt độ",metric: "temperature" },
  { label: "⚡ Điện",    metric: "power" },
  { label: "💧 Nước",    metric: "w_lpm" },
  { label: "🔌 Mất điện",metric: "power_lost" },
];

interface Props {
  houseId: string;
}

export default function AlertsScreen({ houseId }: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [levelFilter, setLevelFilter]     = useState<AlertLevel | "ALL">("ALL");
  const [metricFilter, setMetricFilter]   = useState<AlertMetric | undefined>();
  const [showUnresolved, setShowUnresolved] = useState(false);

  const {
    alerts,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    refresh,
    loadMore,
    resolve,
    resolveAll,
    setFilters,
  } = useAlertHistory(houseId);

  // Apply filters
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (levelFilter !== "ALL" && a.level !== levelFilter) return false;
      if (metricFilter && a.metric !== metricFilter)         return false;
      if (showUnresolved && a.resolved)                      return false;
      return true;
    });
  }, [alerts, levelFilter, metricFilter, showUnresolved]);

  const sections = useMemo(() => groupAlertsByDate(filtered), [filtered]);
  const counts   = useMemo(() => countByLevel(alerts.filter((a) => !a.resolved)), [alerts]);

  // ── Handlers
  const handlePressAlert = useCallback(
    (alert: IAlert) => {
      navigation.navigate("AlertDetail", { houseId, alertId: alert.alertId });
    },
    [navigation, houseId]
  );

  const handleResolve = useCallback(
    async (alert: IAlert) => {
      try {
        await resolve(alert.alertId);
      } catch {
        Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
      }
    },
    [resolve]
  );

  const handleResolveAll = useCallback(() => {
    if (!counts.CRITICAL && !counts.WARNING) {
      Alert.alert("Thông báo", "Không có cảnh báo nào đang mở");
      return;
    }
    Alert.alert(
      "Xác nhận",
      `Đánh dấu tất cả ${counts.CRITICAL + counts.WARNING} cảnh báo là đã xử lý?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          style: "destructive",
          onPress: async () => {
            try {
              await resolveAll();
            } catch {
              Alert.alert("Lỗi", "Không thể cập nhật");
            }
          },
        },
      ]
    );
  }, [counts, resolveAll]);

  // ── Summary bar
  const renderSummaryBar = () => (
    <View style={styles.summaryBar}>
      <SummaryChip label="Nguy hiểm" count={counts.CRITICAL} color="#FF3B30" />
      <SummaryChip label="Cảnh báo"  count={counts.WARNING}  color="#FF9500" />
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={handleResolveAll} style={styles.resolveAllBtn}>
        <Text style={styles.resolveAllText}>Xử lý tất cả</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Level filter tabs
  const renderLevelTabs = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={LEVEL_FILTERS}
      keyExtractor={(i) => i.value}
      contentContainerStyle={styles.tabList}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => setLevelFilter(item.value)}
          style={[
            styles.tab,
            levelFilter === item.value && styles.tabActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              levelFilter === item.value && styles.tabTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  // ── Category filter pills
  const renderCategoryFilters = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={CATEGORY_FILTERS}
      keyExtractor={(i) => i.label}
      contentContainerStyle={styles.pillList}
      renderItem={({ item }) => {
        const active = item.metric
          ? metricFilter === item.metric
          : !metricFilter;
        return (
          <TouchableOpacity
            onPress={() => setMetricFilter(item.metric)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  // ── Unresolved toggle
  const renderUnresolvedToggle = () => (
    <TouchableOpacity
      onPress={() => setShowUnresolved((v) => !v)}
      style={[styles.toggleRow, showUnresolved && styles.toggleRowActive]}
    >
      <Text style={[styles.toggleText, showUnresolved && styles.toggleTextActive]}>
        {showUnresolved ? "✓ " : ""}Chỉ hiện chưa xử lý
      </Text>
    </TouchableOpacity>
  );

  // ── Section header
  const renderSectionHeader = ({ section }: { section: { date: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.date}</Text>
    </View>
  );

  // ── Empty state
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>✅</Text>
        <Text style={styles.emptyTitle}>Không có cảnh báo</Text>
        <Text style={styles.emptySubtitle}>
          {showUnresolved
            ? "Tất cả cảnh báo đã được xử lý"
            : "Hệ thống đang hoạt động bình thường"}
        </Text>
      </View>
    );
  };

  // ── Error state
  if (error && !alerts.length) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {renderSummaryBar()}
      {renderLevelTabs()}
      {renderCategoryFilters()}
      {renderUnresolvedToggle()}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.alertId}
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item }) => (
          <AlertCard
            alert={item}
            onPress={handlePressAlert}
            onResolve={handleResolve}
          />
        )}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.loadingMore} color="#007AFF" />
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#007AFF" />
        }
        contentContainerStyle={
          sections.length === 0 ? { flex: 1 } : { paddingBottom: 32 }
        }
        stickySectionHeadersEnabled
      />
    </View>
  );
}

// ── Summary chip
function SummaryChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: count > 0 ? `${color}20` : "#F2F2F7" }]}>
      <View style={[styles.chipDot, { backgroundColor: count > 0 ? color : "#C7C7CC" }]} />
      <Text style={[styles.chipText, { color: count > 0 ? color : "#8E8E93" }]}>
        {count} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },

  summaryBar: {
    flexDirection:  "row",
    alignItems:     "center",
    paddingHorizontal: 16,
    paddingVertical:   10,
    backgroundColor:   "#FFFFFF",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  chip: {
    flexDirection:    "row",
    alignItems:       "center",
    borderRadius:     20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 13, fontWeight: "600" },

  resolveAllBtn: {
    paddingVertical:   6,
    paddingHorizontal: 12,
    backgroundColor:   "#F2F2F7",
    borderRadius:      8,
  },
  resolveAllText: { fontSize: 13, color: "#007AFF", fontWeight: "500" },

  tabList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical:    7,
    borderRadius:      20,
    backgroundColor:   "#F2F2F7",
  },
  tabActive:     { backgroundColor: "#007AFF" },
  tabText:       { fontSize: 13, color: "#3C3C43", fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF" },

  pillList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical:    5,
    borderRadius:      16,
    backgroundColor:   "#F2F2F7",
    borderWidth:       1,
    borderColor:       "#E5E5EA",
  },
  pillActive:     { backgroundColor: "#E8F0FE", borderColor: "#007AFF" },
  pillText:       { fontSize: 12, color: "#3C3C43" },
  pillTextActive: { color: "#007AFF", fontWeight: "600" },

  toggleRow: {
    marginHorizontal: 16,
    marginBottom:      8,
    paddingVertical:   6,
    paddingHorizontal: 12,
    borderRadius:      8,
    backgroundColor:   "#F2F2F7",
    alignSelf:        "flex-start",
  },
  toggleRowActive: { backgroundColor: "#E8F0FE" },
  toggleText:      { fontSize: 13, color: "#636366" },
  toggleTextActive: { color: "#007AFF", fontWeight: "600" },

  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical:    6,
    backgroundColor:   "#F2F2F7",
  },
  sectionHeaderText: {
    fontSize:   13,
    fontWeight: "600",
    color:      "#8E8E93",
    textTransform: "uppercase",
  },

  emptyWrap: {
    flex: 1,
    alignItems:     "center",
    justifyContent: "center",
    paddingTop:     60,
    gap:            8,
  },
  emptyIcon:     { fontSize: 48 },
  emptyTitle:    { fontSize: 18, fontWeight: "700", color: "#1C1C1E" },
  emptySubtitle: { fontSize: 14, color: "#8E8E93", textAlign: "center", paddingHorizontal: 40 },

  centerWrap:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorIcon:     { fontSize: 40 },
  errorText:     { fontSize: 15, color: "#3C3C43" },
  retryBtn:      { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 10 },
  retryText:     { color: "#FFFFFF", fontWeight: "600" },

  loadingMore:   { paddingVertical: 16 },
});