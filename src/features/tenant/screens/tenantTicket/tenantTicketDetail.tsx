import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../../shared/types";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import type { IssueQuoteFromApi } from "../../../../shared/types/api";
import { getAssetItemById } from "../../../../shared/services/assetItemApi";
import {
  confirmIssueQuoteStatus,
  getIssueQuotesByTicket,
  getTenantTicketById,
  getTenantTicketImages,
  type TenantTicketImageFromApi,
} from "../../../../shared/services/issuesApi";
import { getWorkSlotById } from "../../../../shared/services/scheduleApi";
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
  const initialTicket = params.ticket;
  const [ticket, setTicket] = useState(initialTicket);
  const [predictedHandlingTime, setPredictedHandlingTime] = useState<string | null>(null);
  const [workSlotLoading, setWorkSlotLoading] = useState(false);

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const [assetName, setAssetName] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(true);
  const [ticketImages, setTicketImages] = useState<TenantTicketImageFromApi[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotes, setQuotes] = useState<IssueQuoteFromApi[]>([]);
  const [confirmQuoteLoading, setConfirmQuoteLoading] = useState(false);
  const [confirmQuoteError, setConfirmQuoteError] = useState<string | null>(null);

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

  const loadImages = useCallback(async () => {
    if (!ticket?.id) {
      setTicketImages([]);
      return;
    }
    setImagesLoading(true);
    try {
      const imgs = await getTenantTicketImages(ticket.id);
      setTicketImages(imgs);
    } catch (e) {
      console.error("[TenantTicketDetailScreen] loadImages failed", e);
      setTicketImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, [ticket?.id]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const activeQuote = useMemo(() => {
    if (!quotes?.length) return null;
    const waiting = quotes.find((q) => String(q.status || "").toUpperCase() === "WAITING_TENANT_APPROVAL");
    return waiting ?? quotes[0] ?? null;
  }, [quotes]);

  const formatMoney = useCallback(
    (v: number) => {
      const num = Number(v);
      if (!Number.isFinite(num)) return "—";
      const s = num.toLocaleString(locale, { maximumFractionDigits: 0 });
      return `${s} đ`;
    },
    [locale]
  );

  const refreshTicket = useCallback(async () => {
    try {
      if (!ticket?.id) return;
      const updated = await getTenantTicketById(ticket.id);
      if (updated) setTicket(updated);
    } catch {
      // giữ ticket cũ nếu refresh lỗi
    }
  }, [ticket?.id]);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  // Format đúng yêu cầu: "9:45 - 10:45, 27/03/2026"
  const formatSlotRange = useCallback(
    (startIso: string, endIso: string) => {
      const sd = new Date(startIso);
      const ed = new Date(endIso);
      if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) return null;

      const startTime = `${sd.getHours()}:${pad2(sd.getMinutes())}`;
      const endTime = `${ed.getHours()}:${pad2(ed.getMinutes())}`;
      const dateStr = `${pad2(sd.getDate())}/${pad2(sd.getMonth() + 1)}/${sd.getFullYear()}`;

      return `${startTime} - ${endTime}, ${dateStr}`;
    },
    [locale]
  );

  useEffect(() => {
    refreshTicket();
  }, [refreshTicket]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setPredictedHandlingTime(null);
      setWorkSlotLoading(false);

      // Không có slot thì không thể suy ra startTime.
      if (nilUuid(ticket.slotId)) return;

      setWorkSlotLoading(true);
      try {
        const res = await getWorkSlotById(String(ticket.slotId));
        const slot = res?.data;
        if (!cancelled && slot?.startTime && slot?.endTime) {
          setPredictedHandlingTime(formatSlotRange(slot.startTime, slot.endTime));
        } else if (!cancelled) {
          setPredictedHandlingTime(null);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[TenantTicketDetail] load predicted handling time failed", e);
        }
      } finally {
        if (!cancelled) setWorkSlotLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.slotId, locale]);

  const loadQuotes = useCallback(async () => {
    if (!ticket?.id) {
      setQuotes([]);
      return;
    }

    // Chỉ fetch quote ở bước chờ tenant xác nhận.
    if (String(ticket.status || "").toUpperCase() !== "WAITING_TENANT_APPROVAL") {
      setQuotes([]);
      return;
    }

    setConfirmQuoteError(null);
    setQuotesLoading(true);
    try {
      const res = await getIssueQuotesByTicket(ticket.id);
      setQuotes(res);
    } catch (e) {
      console.error("[TenantTicketDetail] loadQuotes failed", e);
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  }, [ticket?.id, ticket.status]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleConfirmQuote = useCallback(async () => {
    if (!activeQuote?.id) return;
    if (confirmQuoteLoading) return;

    setConfirmQuoteError(null);
    setConfirmQuoteLoading(true);
    try {
      await confirmIssueQuoteStatus(activeQuote.id);
      // Sau khi xác nhận: ticket đổi sang WAITING_PAYMENT
      await refreshTicket();
      await loadQuotes();
      Alert.alert(
        t("tenant_ticket_detail.confirm_quote_success_title"),
        t("tenant_ticket_detail.confirm_quote_success_message"),
        undefined,
        { type: "success" },
      );
    } catch (e) {
      console.error("[TenantTicketDetail] confirmIssueQuoteStatus failed", e);
      setConfirmQuoteError(t("tenant_ticket_detail.confirm_quote_error"));
    } finally {
      setConfirmQuoteLoading(false);
    }
  }, [activeQuote?.id, confirmQuoteLoading, loadQuotes, refreshTicket, t]);

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
  const staffAssigned = !nilUuid(ticket.assignedStaffId);
  const staffName = staffAssigned ? ticket.staffName ?? ticket.assignedStaffId ?? "" : "";
  const staffPhone = staffAssigned ? ticket.staffPhone ?? "" : "";

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
              <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.asset_fallback")}</Text>
            )}
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_assigned_staff")}</Text>
            {staffAssigned ? (
              <Text style={styles.fieldValue} selectable numberOfLines={1}>
                {staffName || "—"}
              </Text>
            ) : (
              <Text style={styles.fieldValueMuted} selectable>
                {t("tenant_ticket_detail.not_assigned")}
              </Text>
            )}
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_staff_phone")}</Text>
            <Text style={staffAssigned ? styles.fieldValuePhone : styles.fieldValueMuted} selectable numberOfLines={1}>
              {staffAssigned ? staffPhone || "—" : "—"}
            </Text>
          </View>
          <View style={[styles.panelRow, styles.panelRowLast]}>
            <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_slot")}</Text>
            {/*
              Ưu tiên hiển thị predictedHandlingTime từ work slot by id.
              Nếu chưa lấy được, fallback bằng ticket.slotId để không bị trống.
            */}
            <Text
              style={
                nilUuid(ticket.slotId) || workSlotLoading || predictedHandlingTime == null
                  ? styles.fieldValueMuted
                  : styles.fieldValue
              }
              selectable
            >
              {nilUuid(ticket.slotId)
                ? t("tenant_ticket_detail.no_slot")
                : workSlotLoading
                  ? t("common.loading")
                  : predictedHandlingTime ?? ticket.slotId}
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

        <Text style={styles.sectionLabel}>{t("ticket.images_label")}</Text>
        <View style={styles.panel}>
          {imagesLoading ? (
            <View style={styles.assetLoadingRow}>
              <ActivityIndicator size="small" color={brandSecondary} />
              <Text style={styles.fieldValueMuted}>{t("ticket.images_label")}</Text>
            </View>
          ) : ticketImages.length > 0 ? (
            <View style={styles.ticketImagesGrid}>
              {ticketImages.map((img) => (
                <TouchableOpacity
                  key={img.id}
                  style={styles.ticketImageThumb}
                  activeOpacity={0.85}
                  onPress={() => setActiveImageUrl(img.url)}
                >
                  <Image source={{ uri: img.url }} style={styles.ticketImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.fieldValueMuted}>{t("ticket.images_empty")}</Text>
          )}
        </View>

        {String(ticket.status || "").toUpperCase() === "WAITING_TENANT_APPROVAL" && (
          <>
            <Text style={styles.sectionLabel}>{t("tenant_ticket_detail.section_quote")}</Text>
            <View style={styles.panel}>
              {quotesLoading ? (
                <View style={styles.assetLoadingRow}>
                  <ActivityIndicator size="small" color={brandSecondary} />
                  <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                </View>
              ) : activeQuote?.items?.length ? (
                <>
                  <View style={styles.quoteTotalRow}>
                    <Text style={styles.quoteTotalLabel}>{t("tenant_ticket_detail.quote_items_label")}</Text>
                    <Text style={styles.quoteTotalLabel}>{t("tenant_ticket_detail.quote_price_label")}</Text>
                  </View>

                  {activeQuote.items.map((it, idx) => (
                    <View
                      key={it.id}
                      style={[
                        styles.panelRow,
                        idx === activeQuote.items.length - 1 && styles.panelRowLast,
                        { flexDirection: "row", alignItems: "flex-start" },
                      ]}
                    >
                      <Text style={styles.quoteItemName} numberOfLines={2}>
                        {it.itemName}
                      </Text>
                      <Text style={styles.quoteItemPrice}>
                        {t("tenant_ticket_detail.quote_price_label")}: {formatMoney(it.price)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.quoteTotalRow}>
                    <Text style={styles.quoteTotalLabel}>{t("tenant_ticket_detail.quote_total_label")}</Text>
                    <Text style={styles.quoteTotalValue}>{formatMoney(activeQuote.totalPrice)}</Text>
                  </View>

                  {!!confirmQuoteError && (
                    <Text style={styles.fieldValueMuted}>{confirmQuoteError}</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.confirmQuoteBtn,
                      (confirmQuoteLoading || !activeQuote?.id) && { opacity: 0.72 },
                    ]}
                    onPress={handleConfirmQuote}
                    disabled={confirmQuoteLoading || !activeQuote?.id}
                    activeOpacity={0.8}
                  >
                    {confirmQuoteLoading ? (
                      <ActivityIndicator size="small" color={neutral.surface} />
                    ) : (
                      <Text style={styles.confirmQuoteBtnText}>
                        {t("tenant_ticket_detail.confirm_quote_btn")}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.fieldValueMuted}>{t("common.no_data")}</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={activeImageUrl != null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.imageModalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveImageUrl(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => {
              // tránh click lan sang backdrop
                e.stopPropagation();
            }}
            style={styles.imageModalContent}
          >
            <TouchableOpacity
              style={styles.imageModalClose}
              onPress={() => setActiveImageUrl(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.imageModalCloseText}>×</Text>
            </TouchableOpacity>
            {activeImageUrl && (
              <Image
                source={{ uri: activeImageUrl }}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default TenantTicketDetailScreen;
