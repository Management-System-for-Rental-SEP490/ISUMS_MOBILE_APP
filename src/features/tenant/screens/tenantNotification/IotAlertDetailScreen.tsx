import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../../shared/types";
import Icons from "../../../../shared/theme/icon";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import { getNotificationAlertLevelStyle, neutral } from "../../../../shared/theme/color";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";
import { appTypography } from "../../../../shared/utils/typography";
import alertApi from "../../../../shared/services/alertApi";
import type { IAlert } from "../../../../shared/types/alert";
import { formatDayMonthNumeric, formatTimeAgoI18n } from "../../../../shared/utils";
import { dismissIotHomeBannerForAlert } from "../../utils/dismissIotHomeBanner";
import { RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";

type Route = RouteProp<RootStackParamList, "IotAlertDetail">;

const IotAlertDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const { houseId, alertId } = params;

  useEffect(() => {
    dismissIotHomeBannerForAlert(houseId, alertId);
  }, [houseId, alertId]);

  const [alert, setAlert] = useState<IAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    alertApi
      .getAlertDetail(houseId, alertId)
      .then((data) => {
        if (!cancelled) setAlert(data);
      })
      .catch(() => {
        if (!cancelled) setError(t("common.error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [houseId, alertId, t]);

  const level = String(alert?.level ?? "").trim().toUpperCase();
  const { fg, bg } = getNotificationAlertLevelStyle(level);

  return (
    <View style={styles.root}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <Pressable
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </Pressable>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("notification.section_iot")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      {loading ? (
        <View style={styles.center}>
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : error || !alert ? (
        <View style={styles.center}>
          <Text style={styles.err}>{error ?? t("common.error")}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.detailCard, { borderLeftWidth: 4, borderLeftColor: fg }]}>
            <View style={[styles.badge, { backgroundColor: bg }]}>
              <Text style={[styles.badgeTxt, { color: fg }]}>{level || "—"}</Text>
            </View>
            <Text style={styles.title}>{alert.title}</Text>
            {alert.detail ? <Text style={styles.detail}>{alert.detail}</Text> : null}
            <View style={styles.row}>
              <Icons.place size={16} color={neutral.slate500} />
              <Text style={styles.meta}>
                {alert.areaName ?? t("notification.area_all")}
              </Text>
            </View>
            <Text style={styles.meta}>
              {formatTimeAgoI18n(new Date(alert.ts), t, true)} ·{" "}
              {formatDayMonthNumeric(new Date(alert.ts), i18n.language)}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: neutral.canvasMuted },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    position: "relative",
  },
  err: { ...appTypography.secondary, color: neutral.slate600, textAlign: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  detailCard: {
    ...tenantSoftCard,
    padding: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  badgeTxt: { ...appTypography.captionStrong },
  title: {
    ...appTypography.cardTitle,
    color: neutral.slate900,
    marginBottom: 10,
  },
  detail: {
    ...appTypography.body,
    color: neutral.slate600,
    lineHeight: 22,
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  meta: { ...appTypography.secondary, color: neutral.slate500 },
});

export default IotAlertDetailScreen;
