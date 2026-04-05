import React, { useState } from "react";
import {
  View, Text, ScrollView, Switch, TextInput,
  TouchableOpacity, ActivityIndicator,
  StyleSheet, Alert,
} from "react-native";
import Header from "../../../../shared/components/header";
import { useTenantContext } from "../../../../shared/hooks";
import { useThresholds } from "../../hooks/useThresholds";
import { brandPrimary } from "../../../../shared/theme/color";

const ACCENT = brandPrimary;

// Meta cho từng metric
const METRIC_META: Record<string, {
  label: string; unit: string; icon: string;
  hasMax: boolean; hasMin: boolean; description: string;
}> = {
  gas_ppm: {
    label: "Khí gas / Khói",
    unit: "ppm",
    icon: "🔥",
    hasMax: true, hasMin: false,
    description: "Cảnh báo khi nồng độ khí gas vượt ngưỡng",
  },
  temperature: {
    label: "Nhiệt độ",
    unit: "°C",
    icon: "🌡️",
    hasMax: true, hasMin: false,
    description: "Cảnh báo khi nhiệt độ quá cao",
  },
  voltage: {
    label: "Điện áp",
    unit: "V",
    icon: "⚡",
    hasMax: true, hasMin: true,
    description: "Cảnh báo điện áp bất thường",
  },
  current: {
    label: "Dòng điện",
    unit: "A",
    icon: "⚡",
    hasMax: true, hasMin: false,
    description: "Cảnh báo dòng điện quá cao",
  },
  power: {
    label: "Công suất",
    unit: "W",
    icon: "⚡",
    hasMax: true, hasMin: false,
    description: "Cảnh báo quá tải điện",
  },
  w_lpm: {
    label: "Lưu lượng nước",
    unit: "L/phút",
    icon: "💧",
    hasMax: true, hasMin: false,
    description: "Cảnh báo rò rỉ hoặc vỡ ống",
  },
};

function ThresholdCard({
  item,
  onSave,
  saving,
}: {
  item: any;
  onSave: (metric: string, payload: any) => void;
  saving: boolean;
}) {
  const meta = METRIC_META[item.metric] ?? {
    label: item.metric, unit: "", icon: "⚙️",
    hasMax: true, hasMin: false, description: "",
  };

  const [maxVal, setMaxVal] = useState(
    item.maxVal != null ? String(item.maxVal) : ""
  );
  const [minVal, setMinVal] = useState(
    item.minVal != null ? String(item.minVal) : ""
  );
  const [enabled, setEnabled] = useState(item.enabled);
  const [severity, setSeverity] = useState<"CRITICAL" | "WARNING">(
    item.severity === "CRITICAL" ? "CRITICAL" : "WARNING"
  );
  const [dirty, setDirty] = useState(false);

  const isCritical = severity === "CRITICAL";
  const severityColor = isCritical ? "#EF4444" : "#F97316";

  function handleSave() {
    const parsedMax = maxVal ? parseFloat(maxVal) : null;
    const parsedMin = minVal ? parseFloat(minVal) : null;

    if (meta.hasMax && parsedMax === null) {
      Alert.alert("Lỗi", `Vui lòng nhập ngưỡng tối đa cho ${meta.label}`);
      return;
    }

    // Cảnh báo nếu hạ ngưỡng xuống thấp
    if (item.metric === "gas_ppm" && parsedMax && parsedMax < 200) {
      Alert.alert(
        "Lưu ý",
        "Ngưỡng gas < 200 ppm có thể gây báo động giả thường xuyên.",
        [
          { text: "Huỷ", style: "cancel" },
          { text: "Vẫn lưu", onPress: () => doSave(parsedMax, parsedMin) },
        ]
      );
      return;
    }

    doSave(parsedMax, parsedMin);
  }

  function doSave(parsedMax: number | null, parsedMin: number | null) {
    onSave(item.metric, {
      maxVal:   parsedMax,
      minVal:   parsedMin,
      severity,
      enabled,
    });
    setDirty(false);
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{meta.icon}</Text>
          <View>
            <Text style={styles.cardLabel}>{meta.label}</Text>
            <Text style={styles.cardDesc}>{meta.description}</Text>
          </View>
        </View>
        <Switch
          value={enabled}
          onValueChange={(v) => { setEnabled(v); setDirty(true); }}
          trackColor={{ false: "#E2E8F0", true: `${ACCENT}40` }}
          thumbColor={enabled ? ACCENT : "#94A3B8"}
        />
      </View>

      {enabled && (
        <>
          {/* Severity toggle */}
          <View style={styles.severityRow}>
            <TouchableOpacity
              style={[
                styles.severityBtn,
                !isCritical && styles.severityBtnActive,
                !isCritical && { borderColor: "#F97316" },
              ]}
              onPress={() => { setSeverity("WARNING"); setDirty(true); }}
            >
              <Text style={[
                styles.severityText,
                !isCritical && { color: "#F97316", fontWeight: "800" },
              ]}>
                WARNING
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.severityBtn,
                isCritical && styles.severityBtnActive,
                isCritical && { borderColor: "#EF4444" },
              ]}
              onPress={() => { setSeverity("CRITICAL"); setDirty(true); }}
            >
              <Text style={[
                styles.severityText,
                isCritical && { color: "#EF4444", fontWeight: "800" },
              ]}>
                CRITICAL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Input fields */}
          <View style={styles.inputRow}>
            {meta.hasMax && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Tối đa ({meta.unit})
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: severityColor }]}
                  value={maxVal}
                  onChangeText={(v) => { setMaxVal(v); setDirty(true); }}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 300"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            )}
            {meta.hasMin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Tối thiểu ({meta.unit})
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: severityColor }]}
                  value={minVal}
                  onChangeText={(v) => { setMinVal(v); setDirty(true); }}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 190"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            )}
          </View>

          {/* Save button */}
          {dirty && (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: severityColor }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Lưu ngưỡng</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const ThresholdSettingsScreen = () => {
  const { houseId, functionalAreas } = useTenantContext();

  // Tab: "house" hoặc areaId cụ thể
  const [selectedScope, setSelectedScope] = useState<"house" | string>("house");
  const isHouse = selectedScope === "house";
  const activeAreaId = isHouse ? null : selectedScope;

  const { thresholds, loading, saving, error, update, refetch } =
    useThresholds(houseId, activeAreaId);

  const displayThresholds = thresholds.length > 0
    ? thresholds
    : Object.keys(METRIC_META).map(metric => ({
        metric,
        maxVal: null, minVal: null,
        severity: metric === "gas_ppm" || metric === "w_lpm" ? "CRITICAL" : "WARNING",
        enabled: true,
      }));

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Header title="Cài đặt ngưỡng cảnh báo" />

      {/* Scope selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContent}
      >
        {/* House tab */}
        <TouchableOpacity
          style={[styles.chip, isHouse && styles.chipActive]}
          onPress={() => setSelectedScope("house")}
        >
          <Text style={[styles.chipText, isHouse && styles.chipTextActive]}>
            🏠 Toàn nhà
          </Text>
        </TouchableOpacity>

        {/* Area tabs */}
        {functionalAreas.map(area => {
          const active = selectedScope === area.id;
          return (
            <TouchableOpacity
              key={area.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedScope(area.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                📍 {area.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Info box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {isHouse
            ? "⚡ Ngưỡng toàn nhà — áp dụng cho tất cả khu vực chưa có cài đặt riêng."
            : "📍 Ngưỡng khu vực — ghi đè lên ngưỡng toàn nhà cho khu vực này."}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={ACCENT} size="large" />
        </View>
      ) : (
        displayThresholds.map(item => (
          <ThresholdCard
            key={`${selectedScope}-${item.metric}`}
            item={item}
            onSave={(metric, payload) => update(metric, payload)}
            saving={saving}
          />
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },
  infoBox: {
    margin: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: brandPrimary,
  },
  infoText: {
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 20,
    fontWeight: "600",
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
  },
  loadingBox: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9EEF5",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  severityRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  severityBtnActive: {
    backgroundColor: "#FFF",
  },
  severityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  saveBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "800",
    },
    chipScroll: { marginTop: 12 },
    chipContent: { paddingHorizontal: 16, gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#F1F5F9",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    chipActive: {
      backgroundColor: `${ACCENT}15`,
      borderColor: ACCENT,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#64748B",
    },
    chipTextActive: {
      color: ACCENT,
      fontWeight: "800",
    },
  });

export default ThresholdSettingsScreen;