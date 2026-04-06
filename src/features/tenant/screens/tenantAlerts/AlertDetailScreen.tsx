// src/features/tenant/screens/tenantAlerts/AlertDetailScreen.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/types";
import alertApi from "../../../shared/services/alertApi";
import { IAlert } from "../../../types/alert";
import {
  ALERT_META,
  getAlertColor,
  getLevelBgColor,
  getLevelLabel,
  formatAlertTimeFull,
  formatAlertValue,
} from "../../utils/alertHelpers";

type RouteParams = { houseId: string; alertId: string };

export default function AlertDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route      = useRoute();
  const { houseId, alertId } = route.params as RouteParams;

  const [alert, setAlert]     = useState<IAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Fetch detail
  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await alertApi.getAlertDetail(houseId, alertId);
      setAlert(data);
    } catch {
      setError("Không thể tải thông tin cảnh báo");
    } finally {
      setLoading(false);
    }
  }, [houseId, alertId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleResolve = useCallback(async () => {
    if (!alert || alert.resolved) return;

    Alert.alert(
      "Xác nhận",
      "Đánh dấu cảnh báo này là đã xử lý?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          onPress: async () => {
            setResolving(true);
            try {
              const updated = await alertApi.resolveAlert(houseId, alertId);
              setAlert(updated);
            } catch {
              Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  }, [alert, houseId, alertId]);

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !alert) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error ?? "Không tìm thấy"}</Text>
        <TouchableOpacity onPress={fetchDetail} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const meta      = ALERT_META[alert.metric];
  const color     = getAlertColor(alert);
  const bgColor   = getLevelBgColor(alert.level);
  const valueStr  = formatAlertValue(alert);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card */}
      <View style={[styles.heroCard, { backgroundColor: bgColor, borderTopColor: color }]}>
        <Text style={styles.heroIcon}>{meta?.icon ?? "⚠️"}</Text>
        <Text style={styles.heroTitle}>{alert.title}</Text>
        {valueStr ? (
          <Text style={[styles.heroValue, { color }]}>{valueStr}</Text>
        ) : null}
        <View style={[styles.levelBadge, { backgroundColor: color }]}>
          <Text style={styles.levelBadgeText}>{getLevelLabel(alert.level)}</Text>
        </View>
      </View>

      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={[
          styles.statusChip,
          alert.resolved ? styles.statusResolved : styles.statusActive,
        ]}>
          <Text style={[
            styles.statusText,
            alert.resolved ? styles.statusTextResolved : styles.statusTextActive,
          ]}>
            {alert.resolved ? "✓ Đã xử lý" : "● Chưa xử lý"}
          </Text>
        </View>
        {alert.resolved && alert.resolvedAt && (
          <Text style={styles.resolvedAt}>
            {formatAlertTimeFull(alert.resolvedAt)}
          </Text>
        )}
      </View>

      {/* Info table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chi tiết cảnh báo</Text>

        <InfoRow label="Loại cảm biến" value={meta?.label ?? alert.metric} />
        <InfoRow label="Khu vực"       value={alert.areaName ?? "Toàn nhà"} />
        <InfoRow label="Mức độ"        value={getLevelLabel(alert.level)} valueColor={color} />
        {valueStr && (
          <InfoRow label="Giá trị"     value={valueStr} valueColor={color} />
        )}
        <InfoRow label="Thời điểm"     value={formatAlertTimeFull(alert.ts)} />
        {alert.detail && (
          <InfoRow label="Mô tả"       value={alert.detail} multiline />
        )}
        <InfoRow
          label="Mã thiết bị"
          value={alert.thing}
          mono
        />
      </View>

      {/* Tips card — gợi ý xử lý */}
      <TipsCard alert={alert} />

      {/* Resolve button */}
      {!alert.resolved && (
        <TouchableOpacity
          style={[styles.resolveBtn, resolving && styles.resolveBtnDisabled]}
          onPress={handleResolve}
          disabled={resolving}
        >
          {resolving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.resolveBtnText}>✓ Đánh dấu đã xử lý</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── InfoRow
function InfoRow({
  label,
  value,
  valueColor,
  multiline,
  mono,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
  multiline?:  boolean;
  mono?:       boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text
        style={[
          infoStyles.value,
          valueColor ? { color: valueColor, fontWeight: "600" } : null,
          mono ? infoStyles.mono : null,
          multiline ? { flex: 1, flexWrap: "wrap" } : null,
        ]}
        numberOfLines={multiline ? undefined : 1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    gap: 12,
  },
  label: {
    fontSize:  14,
    color:     "#636366",
    flex:      1,
  },
  value: {
    fontSize:  14,
    color:     "#1C1C1E",
    flex:      2,
    textAlign: "right",
  },
  mono: {
    fontFamily: "Courier",
    fontSize:   12,
    color:      "#636366",
  },
});

// ── Tips per metric
function TipsCard({ alert }: { alert: IAlert }) {
  const tips: Record<string, string[]> = {
    gas_ppm: [
      "Mở cửa sổ và thông gió ngay lập tức",
      "Tắt tất cả thiết bị dùng gas",
      "Không bật công tắc điện",
      "Ra khỏi khu vực nếu nồng độ cao",
      "Gọi 114 nếu không kiểm soát được",
    ],
    temperature: [
      "Kiểm tra thiết bị điện có bị quá nhiệt không",
      "Kiểm tra lò nướng, bếp điện",
      "Thông gió khu vực ngay lập tức",
    ],
    humidity_high: [
      "Bật điều hòa hoặc quạt thông gió",
      "Kiểm tra rò rỉ nước gần đó",
      "TPHCM mùa mưa — kiểm tra cửa sổ",
    ],
    power_lost: [
      "Kiểm tra cầu dao tổng",
      "Liên hệ EVN TPHCM: 1800 6961",
      "Bảo vệ thiết bị điện nhạy cảm",
    ],
    voltage: [
      "Điện áp bất thường có thể hỏng thiết bị",
      "Tạm thời rút phích cắm thiết bị quan trọng",
      "Liên hệ EVN nếu kéo dài",
    ],
    power: [
      "Kiểm tra thiết bị đang dùng điện cao",
      "Tắt bớt thiết bị không cần thiết",
      "Kiểm tra cầu dao chưa trip",
    ],
    w_lpm: [
      "Kiểm tra vòi nước có mở không",
      "Kiểm tra đường ống trong nhà",
      "Tắt van tổng nếu không tìm được nguồn rò",
    ],
    water_leak: [
      "Nước chảy liên tục > 10 phút",
      "Kiểm tra toilet (hay bị rò ngầm)",
      "Kiểm tra máy giặt, máy rửa chén",
      "Tắt van tổng để kiểm tra",
    ],
    frequency: [
      "Tần số bất thường từ lưới điện EVN",
      "Thường tự phục hồi trong vài phút",
      "Nếu kéo dài liên hệ EVN: 1800 6961",
    ],
  };

  const metricTips = tips[alert.metric] ?? tips[alert.metric?.split("_")[0]];
  if (!metricTips?.length) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>💡 Gợi ý xử lý</Text>
      {metricTips.map((tip, idx) => (
        <View key={idx} style={tipStyles.row}>
          <Text style={tipStyles.bullet}>{idx + 1}.</Text>
          <Text style={tipStyles.text}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const tipStyles = StyleSheet.create({
  row:    { flexDirection: "row", gap: 8, paddingVertical: 4 },
  bullet: { fontSize: 14, color: "#8E8E93", width: 20 },
  text:   { fontSize: 14, color: "#3C3C43", flex: 1, lineHeight: 20 },
});

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#F2F2F7" },
  content: { padding: 16, gap: 12, paddingBottom: 40 },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorIcon:  { fontSize: 40 },
  errorText:  { fontSize: 15, color: "#3C3C43" },
  retryBtn:   { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: "#007AFF", borderRadius: 10 },
  retryText:  { color: "#FFF", fontWeight: "600" },

  heroCard: {
    borderRadius:  16,
    padding:       20,
    alignItems:    "center",
    gap:           8,
    borderTopWidth: 4,
  },
  heroIcon:  { fontSize: 48 },
  heroTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", textAlign: "center" },
  heroValue: { fontSize: 28, fontWeight: "800" },
  levelBadge: {
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:    6,
    marginTop:          4,
  },
  levelBadgeText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

  statusRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           10,
  },
  statusChip: {
    borderRadius:      20,
    paddingHorizontal: 12,
    paddingVertical:    6,
  },
  statusActive:        { backgroundColor: "#FFF0EF" },
  statusResolved:      { backgroundColor: "#EDFBF0" },
  statusText:          { fontSize: 13, fontWeight: "600" },
  statusTextActive:    { color: "#FF3B30" },
  statusTextResolved:  { color: "#34C759" },
  resolvedAt:          { fontSize: 12, color: "#8E8E93" },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius:    14,
    padding:         16,
    gap:             4,
  },
  cardTitle: {
    fontSize:     15,
    fontWeight:   "700",
    color:        "#1C1C1E",
    marginBottom: 6,
  },

  resolveBtn: {
    backgroundColor: "#34C759",
    borderRadius:    14,
    paddingVertical: 16,
    alignItems:      "center",
    marginTop:       4,
  },
  resolveBtnDisabled: { opacity: 0.6 },
  resolveBtnText: {
    color:      "#FFFFFF",
    fontSize:   16,
    fontWeight: "700",
  },
});