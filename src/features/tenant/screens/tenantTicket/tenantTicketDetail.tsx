import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../../shared/types";
import { getAssetItemById } from "../../../../shared/services/assetItemApi";
import Icons from "../../../../shared/theme/icon";
import { brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantTicketDetailStyles as styles, tenantTicketListStyles as badge } from "./ticketStyles";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
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

type Route = RouteProp<RootStackParamList, "TenantTicketDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "TenantTicketDetail">;

const TenantTicketDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const ticket = params.ticket;

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const [assetName, setAssetName] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(true);

  const loadAsset = useCallback(async () => {
    if (!ticket.assetId) {
      setAssetName(null);
      setAssetLoading(false);
      return;
    }
    setAssetLoading(true);
    const item = await getAssetItemById(ticket.assetId);
    setAssetName(item?.displayName?.trim() ? item.displayName : null);
    setAssetLoading(false);
  }, [ticket.assetId]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const statusLabel = (status: string) => {
    const key = `tenant_ticket_list.status_${String(status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return status;
  };

  const statusVisual = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "CREATED") {
      return { pill: badge.statusCreated, dot: badge.statusCreatedDot, text: badge.statusCreatedText };
    }
    if (s === "SCHEDULED") {
      return { pill: badge.statusScheduled, dot: badge.statusScheduledDot, text: badge.statusScheduledText };
    }
    if (s === "NEED_RESCHEDULE") {
      return { pill: badge.statusScheduled, dot: badge.statusScheduledDot, text: badge.statusScheduledText };
    }
    if (s === "IN_PROGRESS") {
      return { pill: badge.statusInProgress, dot: badge.statusInProgressDot, text: badge.statusInProgressText };
    }
    if (
      s === "WAITING_MANAGER_APPROVAL" ||
      s === "WAITING_TENANT_APPROVAL" ||
      s === "WAITING_PAYMENT"
    ) {
      return { pill: badge.statusCreated, dot: badge.statusCreatedDot, text: badge.statusCreatedText };
    }
    if (s === "DONE") {
      return { pill: badge.statusDone, dot: badge.statusDoneDot, text: badge.statusDoneText };
    }
    if (s === "CLOSED") {
      return { pill: badge.statusDone, dot: badge.statusDoneDot, text: badge.statusDoneText };
    }
    if (s === "CANCELLED") {
      return { pill: badge.statusCancelled, dot: badge.statusCancelledDot, text: badge.statusCancelledText };
    }
    return { pill: badge.statusDefault, dot: badge.statusDefaultDot, text: badge.statusDefaultText };
  };

  const typeLabel = (type: string) => {
    const u = String(type || "").toUpperCase();
    const key = `tenant_ticket_list.type_${u}`;
    const label = t(key);
    if (label !== key) return label;
    return type;
  };

  const typeTagBg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return badge.typeRepair;
    if (u === "QUESTION") return badge.typeQuestion;
    return badge.typeDefault;
  };

  const typeTagFg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return badge.typeRepairText;
    if (u === "QUESTION") return badge.typeQuestionText;
    return badge.typeDefaultText;
  };

  const nilUuid = (v: string | null | undefined) =>
    v == null || String(v).trim() === "";

  const sv = statusVisual(ticket.status);

  return (
    <View style={styles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("tenant_ticket_detail.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{ticket.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[badge.typeTag, typeTagBg(ticket.type), { marginBottom: 0 }]}>
              <Text style={[badge.typeTagText, typeTagFg(ticket.type)]}>{typeLabel(ticket.type)}</Text>
            </View>
            <View style={[badge.statusPill, sv.pill, { flexShrink: 0 }]}>
              <View style={[badge.statusDot, sv.dot]} />
              <Text style={[badge.statusPillText, sv.text]}>{statusLabel(ticket.status)}</Text>
            </View>
          </View>
          <View style={styles.heroDateRow}>
            <Icons.clock size={15} color={neutral.textMuted} />
            <Text style={styles.heroDateText}>
              {t("tenant_ticket_detail.sent_at")}: {formatTenantIssueDateTime(ticket.createdAt, locale)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("tenant_ticket_detail.section_info")}</Text>
        <View style={styles.panel}>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_device")}</Text>
            {assetLoading ? (
              <View style={styles.assetLoadingRow}>
                <ActivityIndicator size="small" color={brandSecondary} />
                <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.asset_loading")}</Text>
              </View>
            ) : assetName ? (
              <Text style={styles.fieldValue}>{assetName}</Text>
            ) : (
              <>
                <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.asset_fallback")}</Text>
                <Text style={styles.fieldValueMono} selectable>
                  {ticket.assetId}
                </Text>
              </>
            )}
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_assigned_staff")}</Text>
            <Text style={nilUuid(ticket.assignedStaffId) ? styles.fieldValueMuted : styles.fieldValue} selectable>
              {nilUuid(ticket.assignedStaffId)
                ? t("tenant_ticket_detail.not_assigned")
                : ticket.assignedStaffId}
            </Text>
          </View>
          <View style={[styles.panelRow, styles.panelRowLast]}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_slot")}</Text>
            <Text style={nilUuid(ticket.slotId) ? styles.fieldValueMuted : styles.fieldValue} selectable>
              {nilUuid(ticket.slotId) ? t("tenant_ticket_detail.no_slot") : ticket.slotId}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("tenant_ticket_detail.section_description")}</Text>
        <View style={styles.panel}>
          <View style={[styles.panelRow, styles.panelRowLast]}>
            <Text style={styles.descriptionBody} selectable>
              {ticket.description ?? ""}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TenantTicketDetailScreen;
