import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { brandPrimary, brandTintBg, neutral } from "@shared/theme/color";
import { appTypography } from "@shared/utils/typography";
import { fetchCallHistory, type VoiceCallEntry } from "./api";

const STATUS_PALETTE: Record<string, { bg: string; fg: string }> = {
  PENDING:      { bg: "#F3F4F6", fg: "#374151" },
  DIALING:      { bg: "#DBEAFE", fg: "#1E40AF" },
  ANSWERED:     { bg: "#D1FAE5", fg: "#065F46" },
  ACKNOWLEDGED: { bg: "#D1FAE5", fg: "#065F46" },
  NO_ANSWER:    { bg: "#FEF3C7", fg: "#92400E" },
  BUSY:         { bg: "#FEF3C7", fg: "#92400E" },
  FAILED:       { bg: "#FEE2E2", fg: "#991B1B" },
  ESCALATED:    { bg: "#E0E7FF", fg: "#3730A3" },
  SKIPPED:      { bg: "#F3F4F6", fg: "#6B7280" },
};

export default function VoiceCallHistoryScreen() {
  const { t, i18n } = useTranslation();

  const q = useQuery({
    queryKey: ["notif", "calls", "page", 0],
    queryFn: () => fetchCallHistory(0, 30),
  });

  if (q.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandPrimary} />
      </View>
    );
  }

  const items = q.data?.content ?? [];

  return (
    <View style={styles.container}>
      <FlatList<VoiceCallEntry>
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={q.isFetching}
            onRefresh={() => q.refetch()}
            tintColor={brandPrimary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>
              {t("notif.callHistory.empty", "No calls yet")}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const palette =
            STATUS_PALETTE[item.status] ?? STATUS_PALETTE.PENDING;
          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.event}>{item.eventType}</Text>
                <View style={[styles.badge, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.badgeText, { color: palette.fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Meta
                  label={t("notif.callHistory.attempts", "Attempt")}
                  value={`${item.attemptNumber}/${item.maxAttempts}`}
                />
                <Meta
                  label={t("notif.callHistory.dtmf", "DTMF")}
                  value={item.dtmfReceived ?? "—"}
                />
                <Meta
                  label={t("notif.callHistory.duration", "Duration")}
                  value={item.durationSec != null ? `${item.durationSec}s` : "—"}
                />
              </View>
              <Text style={styles.timestamp}>
                {new Date(item.createdAt).toLocaleString(i18n.language)}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  listContent: { padding: 14, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: brandTintBg,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Theme map: titleSmall → sectionHeading, bodyMedium → body, ink → text, muted → textMuted.
  event: { ...appTypography.sectionHeading, color: neutral.text },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 18,
  },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 11, color: neutral.textMuted, marginBottom: 2 },
  metaValue: { ...appTypography.body, color: neutral.text, fontWeight: "600" },
  timestamp: { fontSize: 11, color: neutral.textMuted, marginTop: 8 },
  empty: { color: neutral.textMuted },
});
