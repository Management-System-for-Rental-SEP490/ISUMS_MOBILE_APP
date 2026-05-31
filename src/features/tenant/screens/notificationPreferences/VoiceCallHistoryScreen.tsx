import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { brandPrimary, neutral } from "@shared/theme/color";
import { appTypography } from "@shared/utils/typography";
import Icons from "@shared/theme/icon";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "@shared/components/StackScreenTitleBadge";
import { fetchCallHistory, type VoiceCallEntry } from "./api";

const STATUS_PALETTE: Record<string, { bg: string; fg: string }> = {
  PENDING:      { bg: neutral.background,  fg: neutral.textSecondary },
  DIALING:      { bg: "#DBEAFE",           fg: "#1E40AF" },
  ANSWERED:     { bg: "#D1FAE5",           fg: "#065F46" },
  ACKNOWLEDGED: { bg: "#D1FAE5",           fg: "#065F46" },
  NO_ANSWER:    { bg: "#FEF3C7",           fg: "#92400E" },
  BUSY:         { bg: "#FEF3C7",           fg: "#92400E" },
  FAILED:       { bg: "#FEE2E2",           fg: "#991B1B" },
  ESCALATED:    { bg: "#E0E7FF",           fg: "#3730A3" },
  SKIPPED:      { bg: neutral.background,  fg: neutral.textMuted },
};

export default function VoiceCallHistoryScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

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
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("settings.voice_history_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

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
          const palette = STATUS_PALETTE[item.status] ?? STATUS_PALETTE.PENDING;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.eventType}>{item.eventType}</Text>
                <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: palette.fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <MetaCol
                  label={t("notif.callHistory.attempts", "Attempt")}
                  value={`${item.attemptNumber}/${item.maxAttempts}`}
                />
                <MetaCol
                  label={t("notif.callHistory.dtmf", "DTMF")}
                  value={item.dtmfReceived ?? "—"}
                />
                <MetaCol
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

function MetaCol({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    marginBottom: 12,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eventType: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    ...appTypography.captionStrong,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...appTypography.caption,
    color: neutral.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "600",
  },
  timestamp: {
    ...appTypography.caption,
    color: neutral.textMuted,
    marginTop: 10,
  },
  empty: {
    ...appTypography.body,
    color: neutral.textMuted,
  },
});
