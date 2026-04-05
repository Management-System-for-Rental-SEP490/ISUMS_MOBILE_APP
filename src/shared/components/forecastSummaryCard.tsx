import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface ForecastSummaryData {
  usedSoFar: number;
  forecastRemaining: number;
  totalEstimate: number;
  confidenceLower: number;
  confidenceUpper: number;
  daysLeft: number;
  trainingRows: number;
  status?: "ESTIMATE" | "MODEL_FORECAST";
  reason?: string;
  method?: string;
}

interface ForecastSummaryCardProps {
  title?: string;
  unitLabel: string;
  accentColor: string;
  loading: boolean;
  data: ForecastSummaryData | null;
  emptyText?: string;
}

function ForecastStat({
  label,
  value,
  highlight,
  accentColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accentColor: string;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && { color: accentColor }]}>
        {value}
      </Text>
    </View>
  );
}

export default function ForecastSummaryCard({
  title = "Dự báo cuối tháng",
  unitLabel,
  accentColor,
  loading,
  data,
  emptyText = "Chưa có dữ liệu dự báo",
}: ForecastSummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={accentColor} />
        </View>
      ) : data ? (
        <>
          <View style={styles.statsGrid}>
            <ForecastStat
              label="Đã dùng"
              value={`${data.usedSoFar.toFixed(2)} ${unitLabel}`}
              accentColor={accentColor}
            />
            <ForecastStat
              label="Còn lại"
              value={`${data.forecastRemaining.toFixed(2)} ${unitLabel}`}
              accentColor={accentColor}
            />
            <ForecastStat
              label="Cuối tháng"
              value={`${data.totalEstimate.toFixed(2)} ${unitLabel}`}
              highlight
              accentColor={accentColor}
            />
            <ForecastStat
              label="Còn"
              value={`${data.daysLeft} ngày`}
              accentColor={accentColor}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.badge, { color: accentColor }]}>
              {data.status === "ESTIMATE" ? "Ước tính sớm" : "Dự báo mô hình"}
            </Text>
            <Text style={styles.rangeText}>
              {data.confidenceLower.toFixed(2)} - {data.confidenceUpper.toFixed(2)} {unitLabel}
            </Text>
          </View>

          <Text style={styles.metaText}>
            {data.reason === "INSUFFICIENT_HISTORY"
              ? `Dữ liệu còn ít (${data.trainingRows} điểm)`
              : `Dựa trên ${data.trainingRows} điểm dữ liệu`}
          </Text>
        </>
      ) : (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },
  loadingBox: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCell: {
    width: "50%",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
  },
  rangeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  metaText: {
    marginTop: 8,
    fontSize: 11,
    color: "#999",
  },
  emptyText: {
    fontSize: 13,
    color: "#AAA",
  },
});