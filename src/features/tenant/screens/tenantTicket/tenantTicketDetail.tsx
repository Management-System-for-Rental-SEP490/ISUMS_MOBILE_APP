import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { IssueTicketResponseFromApi, RootStackParamList } from "../../../../shared/types";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import type { IssueQuoteFromApi } from "../../../../shared/types/api";
import { getAssetItemById } from "../../../../shared/services/assetItemApi";
import {
  confirmIssueQuoteStatus,
  normalizeIssueQuoteRow,
  type TenantTicketImageFromApi,
} from "../../../../shared/services/issuesApi";
import { useTenantInvoices } from "../../../../shared/hooks";
import {
  useIssueQuotesByTicketQuery,
  useTenantIssueResponsesQuery,
  useTenantTicketByIdQuery,
  useTenantTicketImagesQuery,
  useTenantWorkSlotByIdQuery,
} from "../../../../shared/hooks/useTenantIssueTickets";
import { isTenantInvoicePayable, isTenantTicketIssueInvoice } from "../../../../shared/utils/tenantInvoice";
import { InvoicePaymentFlowSection } from "../tenantInvoice/InvoicePaymentFlowSection";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import Icons from "../../../../shared/theme/icon";
import { brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantTicketDetailStyles as styles, tenantTicketListStyles as badge } from "./ticketStyles";
import {
  formatTenantIssueDateTime,
  formatVndDisplay,
} from "../../../../shared/utils";
import {
  getIssueResponseContentForUi,
  getTenantTicketDescriptionForUi,
  getTenantTicketTitleForUi,
} from "../../../../shared/utils/issueTicketLocalizedText";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
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
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";

type Props = NativeStackScreenProps<RootStackParamList, "TenantTicketDetail">;

/** Cùng logic `tenantTicketList`: chừa chỗ cho tab home + thanh điều hướng hệ thống (Android gesture). */
const TENANT_TICKET_TAB_BAR_CLEARANCE = 72;

function TicketDetailSection({
  title,
  headerIcon,
  children,
}: {
  title: string;
  headerIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailCardHeaderRow}>
        {headerIcon}
        <Text style={styles.detailCardHeaderLabel}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function normalizeIssueStatus(status: string | undefined): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

/** Trạng thái ticket: tenant cần bấm xác nhận báo giá (đồng bộ BE mới). */
const TICKET_STATUSES_NEED_QUOTE_CONFIRM = new Set([
  "WAITING_TENANT_APPROVAL_QUOTE",
  "WAITING_TENANT_APPROVAL",
]);

function ticketNeedsTenantQuoteConfirm(status: string | undefined): boolean {
  return TICKET_STATUSES_NEED_QUOTE_CONFIRM.has(normalizeIssueStatus(status));
}

/** Quote đang chờ tenant duyệt (hỗ trợ cả tên trạng thái cũ/mới từ BE). */
function quoteAwaitingTenantConfirm(q: { status?: string | null }): boolean {
  const st = normalizeIssueStatus(q?.status ?? "");
  return st === "WAITING_TENANT_APPROVAL" || st === "WAITING_TENANT_APPROVAL_QUOTE";
}

function pickLatestResponseForTicket(
  responses: IssueTicketResponseFromApi[],
  ticketId: string
): IssueTicketResponseFromApi | null {
  const list = responses.filter((r) => r.ticketId === ticketId);
  if (!list.length) return null;
  return list.reduce((best, r) => {
    const tb = new Date(best.createdAt).getTime();
    const tr = new Date(r.createdAt).getTime();
    return tr > tb ? r : best;
  });
}

function isNilUuid(v: string | null | undefined): boolean {
  const s = String(v ?? "").trim();
  return !s || s === "00000000-0000-0000-0000-000000000000"; //
}

const TenantTicketDetailScreen = ({ navigation, route }: Props) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const initialTicket = route.params.ticket;
  const isFocused = useIsFocused();
  const stableTicketId = String(initialTicket.id ?? "").trim();

  const { data: invoiceQueryData } = useTenantInvoices(true, { focused: isFocused });

  const ticketDetailQuery = useTenantTicketByIdQuery(stableTicketId, { focused: isFocused });
  const ticket = ticketDetailQuery.data ?? initialTicket;
  /** Lần đầu GET chi tiết — tránh flash UUID staff trước khi BE trả tên/SĐT. */
  const ticketDetailLoading = ticketDetailQuery.isLoading;

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const [assetName, setAssetName] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(true);
  /** Index ảnh đang xem fullscreen; null = đóng modal. */
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const imageModalListRef = useRef<FlatList<TenantTicketImageFromApi>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const imageModalPageWidth = Math.max(0, windowWidth - 32);

  const [confirmQuoteLoading, setConfirmQuoteLoading] = useState(false);
  const [confirmQuoteError, setConfirmQuoteError] = useState<string | null>(null);
  const [payRepairLoading, setPayRepairLoading] = useState(false);

  const isQuestionTicket = useMemo(
    () => String(ticket?.type ?? "").toUpperCase() === "QUESTION",
    [ticket?.type]
  );

  const imagesQuery = useTenantTicketImagesQuery(stableTicketId, {
    focused: isFocused,
    enabled: Boolean(stableTicketId) && !isQuestionTicket,
  });
  const ticketImages = imagesQuery.data ?? [];
  const imagesLoading = imagesQuery.isFetching;

  const responsesQuery = useTenantIssueResponsesQuery({
    focused: isFocused,
    enabled: isQuestionTicket && Boolean(stableTicketId),
  });
  const questionResponseLoading = responsesQuery.isFetching;
  const questionResponse = useMemo(() => {
    if (!isQuestionTicket || !ticket?.id || !responsesQuery.data) return null;
    return pickLatestResponseForTicket(responsesQuery.data, String(ticket.id).trim());
  }, [isQuestionTicket, ticket?.id, responsesQuery.data]);

  const displayTicketTitle = useMemo(
    () => getTenantTicketTitleForUi(ticket),
    [ticket, i18n.language]
  );
  const displayTicketDescription = useMemo(
    () => getTenantTicketDescriptionForUi(ticket),
    [ticket, i18n.language]
  );
  const displayQuestionResponseContent = useMemo(
    () => (questionResponse ? getIssueResponseContentForUi(questionResponse) : ""),
    [questionResponse, i18n.language]
  );

  const linkedRepairInvoice = useMemo(() => {
    const rows = invoiceQueryData ?? [];
    const tid = String(ticket?.id ?? "").trim();
    if (!tid) return null;
    return rows.find((inv) => isTenantTicketIssueInvoice(inv) && String(inv.issueTicketId ?? "").trim() === tid) ?? null;
  }, [invoiceQueryData, ticket?.id]);

  /** Hóa đơn sửa chữa đã thanh toán → hiển thị nút mở màn TenantIssueInvoice. */
  const repairInvoicePaid = useMemo(
    () =>
      linkedRepairInvoice != null && !isTenantInvoicePayable(linkedRepairInvoice.status),
    [linkedRepairInvoice]
  );

  const shouldFetchQuotes = useMemo(() => {
    if (!ticket?.id) return false;
    const tid = String(ticket.id).trim();
    const st = normalizeIssueStatus(ticket.status);
    const hasLinkedRepairForTicket =
      linkedRepairInvoice != null &&
      String(linkedRepairInvoice.issueTicketId ?? "").trim() === tid;
    return (
      ticketNeedsTenantQuoteConfirm(ticket.status) ||
      st === "WAITING_PAYMENT" ||
      hasLinkedRepairForTicket
    );
  }, [ticket?.id, ticket?.status, linkedRepairInvoice]);

  const quotesQuery = useIssueQuotesByTicketQuery(stableTicketId, {
    focused: isFocused,
    enabled: shouldFetchQuotes,
  });
  const quotes = quotesQuery.data ?? [];
  const quotesLoading = quotesQuery.isFetching;

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

  const workSlotQuery = useTenantWorkSlotByIdQuery(ticket.slotId, {
    focused: isFocused,
    enabled: !isQuestionTicket && !isNilUuid(ticket.slotId),
  });
  const workSlotLoading = workSlotQuery.isFetching;
  const predictedHandlingTime = useMemo(() => {
    const slot = workSlotQuery.data?.data;
    if (!slot?.startTime || !slot?.endTime) return null;
    return formatSlotRange(slot.startTime, slot.endTime);
  }, [workSlotQuery.data, formatSlotRange]);

  const loadAsset = useCallback(async () => {
    if (String(ticket?.type ?? "").toUpperCase() === "QUESTION") {
      setAssetName(null);
      setAssetLoading(false);
      return;
    }
    if (!ticket.assetId) {
      setAssetName(null);
      setAssetLoading(false);
      return;
    }
    setAssetLoading(true);
    const item = await getAssetItemById(ticket.assetId);
    setAssetName(item?.displayName?.trim() ? item.displayName : null);
    setAssetLoading(false);
  }, [i18n.language, ticket.assetId, ticket?.type]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  useEffect(() => {
    if (activeImageIndex == null || ticketImages.length === 0) return;
    const index = Math.min(Math.max(0, activeImageIndex), ticketImages.length - 1);
    const timer = setTimeout(() => {
      imageModalListRef.current?.scrollToIndex({ index, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeImageIndex, ticketImages]);

  const activeQuote = useMemo(() => {
    if (!quotes?.length) return null;
    const waiting = quotes.find((q) => quoteAwaitingTenantConfirm(q));
    return waiting ?? quotes[0] ?? null;
  }, [quotes]);

  /**
   * Báo giá dùng cho VNPay luồng `quoteId` (WAITING_PAYMENT).
   * Ưu tiên GET `/quotes/ticket/...`; nếu thiếu `id` trên BE thì `normalizeIssueQuoteRow` đã xử lý trong service.
   * Fallback: `ticket.quote` từ GET chi tiết ticket (khi danh sách quotes rỗng hoặc chưa fetch).
   */
  const paymentQuote = useMemo(() => {
    const fromList = (): IssueQuoteFromApi | null => {
      if (!quotes?.length) return null;
      const approved = quotes.find((q) => normalizeIssueStatus(q.status) === "APPROVED");
      const picked = approved ?? quotes[0] ?? null;
      return picked ? normalizeIssueQuoteRow(picked) : null;
    };
    const listed = fromList();
    if (listed && String(listed.id ?? "").trim()) return listed;
    const embedded = ticket?.quote;
    if (embedded && typeof embedded === "object") {
      const n = normalizeIssueQuoteRow(embedded);
      if (String(n.id ?? "").trim()) return n;
    }
    return listed;
  }, [quotes, ticket?.quote]);

  const formatMoney = useCallback(
    (v: number) => formatVndDisplay(v, locale, t),
    [locale, t]
  );

  /**
   * Báo giá dùng cho khối «đã thanh toán» — ưu tiên APPROVED; không có thì quote mới nhất theo `createdAt`.
   */
  const quoteForPaidRepairDisplay = useMemo(() => {
    if (!quotes?.length) return null;
    const approved = quotes.find((q) => normalizeIssueStatus(q.status) === "APPROVED");
    if (approved) return approved;
    return (
      [...quotes].sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        if (tb !== ta) return tb - ta;
        return String(a.id).localeCompare(String(b.id));
      })[0] ?? null
    );
  }, [quotes]);

  /** Nội dung thanh toán: theo API báo giá ticket (không dùng tiêu đề hóa đơn — tránh nhầm tiền thuê). */
  const repairPaymentContentLabel = useMemo(() => {
    const q = quoteForPaidRepairDisplay;
    if (!q) return null;
    const names = (q.items ?? [])
      .map((it) => String(it.itemName ?? "").trim())
      .filter(Boolean);
    const itemsLine = names.length
      ? names.join(" · ")
      : t("tenant_ticket_detail.payment_content_repair_items_none");
    const heading = t("tenant_ticket_detail.payment_content_repair_quote_heading");
    const quoteTotal = Number(q.totalPrice);
    const totalSuffix =
      Number.isFinite(quoteTotal) && quoteTotal > 0
        ? `\n${t("tenant_ticket_detail.payment_content_quote_total_label")}: ${formatMoney(quoteTotal)}`
        : "";
    return `${heading}\n${itemsLine}${totalSuffix}`;
  }, [quoteForPaidRepairDisplay, t, formatMoney]);

  const handleConfirmQuote = useCallback(async () => {
    if (!activeQuote?.id) return;
    if (confirmQuoteLoading) return;

    setConfirmQuoteError(null);
    setConfirmQuoteLoading(true);
    try {
      await confirmIssueQuoteStatus(activeQuote.id);
      await ticketDetailQuery.refetch();
      await quotesQuery.refetch();
      navigation.navigate("TenantTicketList");
      Alert.alert(
        t("tenant_ticket_detail.confirm_quote_success_title"),
        t("tenant_ticket_detail.confirm_quote_success_message"),
        [{ text: t("common.close") }],
        { type: "success" },
      );
    } catch (e) {
      console.error("[TenantTicketDetail] confirmIssueQuoteStatus failed", e);
      setConfirmQuoteError(t("tenant_ticket_detail.confirm_quote_error"));
    } finally {
      setConfirmQuoteLoading(false);
    }
  }, [
    activeQuote?.id,
    confirmQuoteLoading,
    navigation,
    quotesQuery,
    t,
    ticketDetailQuery,
  ]);

  /**
   * Thanh toán sửa chữa ticket issue: nếu có báo giá → VNPay **`quoteId`** (không gửi `invoiceIds`).
   * Không có `quoteId` hợp lệ → điều hướng hóa đơn / danh sách (luồng `invoiceIds` khi user thanh toán từ đó).
   */
  const handlePayRepair = useCallback(async () => {
    if (payRepairLoading) return;
    const qid = String(paymentQuote?.id ?? "").trim();
    if (qid) {
      setPayRepairLoading(true);
      try {
        const checkoutUrl = await createVnpayPaymentLink(
          { quoteId: qid },
          { appLanguage: i18n.language }
        );
        navigation.navigate("VnpayCheckout", {
          checkoutUrl,
          afterSuccess: "ticketDetail",
          ticketForAfterSuccess: ticket,
          vnpayUiContext: "repair_quote",
        });
      } catch (e: unknown) {
        const msg = formatApiErrorForTenantAlert(e, t, "payment_link");
        Alert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], { type: "error" });
      } finally {
        setPayRepairLoading(false);
      }
      return;
    }
    if (linkedRepairInvoice) {
      navigation.navigate("TenantIssueInvoice", { invoice: linkedRepairInvoice });
      return;
    }
    navigation.navigate("TenantInvoiceList", { issueTicketId: ticket.id });
  }, [
    payRepairLoading,
    paymentQuote?.id,
    i18n.language,
    navigation,
    ticket,
    linkedRepairInvoice,
    t,
  ]);

  const statusLabel = (status: string) => {
    const normalized = normalizeIssueStatus(status);
    const key = `tenant_ticket_list.status_${normalized}`;
    const label = t(key);
    if (label !== key) return label;
    return normalized || status;
  };

  const statusVisual = (status: string) => {
    const s = normalizeIssueStatus(status);
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
      s === "WAITING_MANAGER_CONFIRM" ||
      s === "WAITING_MANAGER_APPROVAL" ||
      s === "WAITING_MANAGER_APPROVAL_QUOTE" ||
      s === "WAITING_TENANT_APPROVAL" ||
      s === "WAITING_TENANT_APPROVAL_QUOTE" ||
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
    if (u === "MAINTENANCE") return badge.typeMaintenance;
    if (u === "QUESTION") return badge.typeQuestion;
    return badge.typeDefault;
  };

  const typeTagFg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return badge.typeRepairText;
    if (u === "MAINTENANCE") return badge.typeMaintenanceText;
    if (u === "QUESTION") return badge.typeQuestionText;
    return badge.typeDefaultText;
  };

  const sv = statusVisual(ticket.status);

  /** Có staff gán khi id khác rỗng (UUID 0000... vẫn coi là «có id» — không dùng logic slot). */
  const staffAssigned = Boolean(String(ticket.assignedStaffId ?? "").trim());
  const staffNameTrim = String(ticket.staffName ?? "").trim();
  const staffPhoneTrim = String(ticket.staffPhone ?? "").trim();
  const staffNamePending = staffAssigned && ticketDetailLoading && !staffNameTrim;
  const staffPhonePending = staffAssigned && ticketDetailLoading && !staffPhoneTrim;

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
          {
            paddingBottom:
              TENANT_TICKET_TAB_BAR_CLEARANCE + Math.max(insets.bottom, 20) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isQuestionTicket ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>
                {displayTicketTitle.trim() ? displayTicketTitle : "—"}
              </Text>
              <View style={styles.heroDateRow}>
                <Icons.clock size={15} color={neutral.textMuted} />
                <Text style={styles.heroDateText}>
                  {t("tenant_ticket_detail.sent_at")}: {formatTenantIssueDateTime(ticket.createdAt, locale)}
                </Text>
              </View>
            </View>

            <TicketDetailSection
              title={t("tenant_ticket_detail.section_question_body")}
              headerIcon={<Icons.helpOutline size={22} color={brandPrimary} />}
            >
              <Text style={styles.descriptionBody} selectable>
                {displayTicketDescription.trim() ? displayTicketDescription : "—"}
              </Text>
            </TicketDetailSection>

            <TicketDetailSection
              title={t("tenant_ticket_detail.section_answer")}
              headerIcon={<Icons.subject size={22} color={brandPrimary} />}
            >
              {questionResponseLoading ? (
                <View style={styles.assetLoadingRow}>
                  <RefreshLogoInline logoPx={18} />
                  <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                </View>
              ) : questionResponse ? (
                <>
                  <Text style={styles.descriptionBody} selectable>
                    {displayQuestionResponseContent.trim() ? displayQuestionResponseContent : "—"}
                  </Text>
                  <View style={[styles.heroDateRow, { marginTop: 12 }]}>
                    <Icons.clock size={15} color={neutral.textMuted} />
                    <Text style={styles.heroDateText}>
                      {t("tenant_ticket_detail.answer_at")}:{" "}
                      {formatTenantIssueDateTime(questionResponse.createdAt, locale)}
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.no_answer_yet")}</Text>
              )}
            </TicketDetailSection>
          </>
        ) : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>{displayTicketTitle}</Text>
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
              {repairInvoicePaid && linkedRepairInvoice ? (
                <TouchableOpacity
                  style={[styles.payNowBtn, { marginTop: 14 }]}
                  onPress={() => navigation.navigate("TenantIssueInvoice", { invoice: linkedRepairInvoice })}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t("tenant_ticket_detail.view_invoice_btn")}
                >
                  <Icons.invoice size={22} color={neutral.surface} />
                  <Text style={styles.payNowBtnText}>{t("tenant_ticket_detail.view_invoice_btn")}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TicketDetailSection
              title={t("tenant_ticket_detail.section_info")}
              headerIcon={<Icons.infoOutline size={22} color={brandPrimary} />}
            >
              <View style={styles.detailFieldRow}>
                <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_device")}</Text>
                {assetLoading ? (
                  <View style={styles.assetLoadingRow}>
                    <RefreshLogoInline logoPx={18} />
                    <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.asset_loading")}</Text>
                  </View>
                ) : assetName ? (
                  <Text style={styles.fieldValue}>{assetName}</Text>
                ) : (
                  <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.asset_fallback")}</Text>
                )}
              </View>
              <View style={styles.detailFieldRow}>
                <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_assigned_staff")}</Text>
                {!staffAssigned ? (
                  <Text style={styles.fieldValueMuted} selectable>
                    {t("tenant_ticket_detail.not_assigned")}
                  </Text>
                ) : staffNamePending ? (
                  <View style={styles.assetLoadingRow}>
                    <RefreshLogoInline logoPx={18} />
                    <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                  </View>
                ) : (
                  <Text style={styles.fieldValue} selectable numberOfLines={1}>
                    {staffNameTrim || "—"}
                  </Text>
                )}
              </View>
              <View style={styles.detailFieldRow}>
                <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_staff_phone")}</Text>
                {!staffAssigned ? (
                  <Text style={styles.fieldValueMuted} selectable numberOfLines={1}>
                    —
                  </Text>
                ) : staffPhonePending ? (
                  <View style={styles.assetLoadingRow}>
                    <RefreshLogoInline logoPx={18} />
                    <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                  </View>
                ) : (
                  <Text style={styles.fieldValuePhone} selectable numberOfLines={1}>
                    {staffPhoneTrim || "—"}
                  </Text>
                )}
              </View>
              <View style={[styles.detailFieldRow, styles.detailFieldRowLast]}>
                <Text style={styles.fieldLabel}>{t("tenant_ticket_detail.field_slot")}</Text>
                {isNilUuid(ticket.slotId) ? (
                  <Text style={styles.fieldValueMuted} selectable>
                    {t("tenant_ticket_detail.no_slot")}
                  </Text>
                ) : workSlotLoading ? (
                  <View style={styles.assetLoadingRow}>
                    <RefreshLogoInline logoPx={18} />
                    <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                  </View>
                ) : (
                  <Text
                    style={predictedHandlingTime == null ? styles.fieldValueMuted : styles.fieldValue}
                    selectable
                  >
                    {predictedHandlingTime ?? t("tenant_ticket_detail.slot_time_tbd")}
                  </Text>
                )}
              </View>
            </TicketDetailSection>

            <TicketDetailSection
              title={t("tenant_ticket_detail.section_description")}
              headerIcon={<Icons.subject size={22} color={brandPrimary} />}
            >
              <Text style={styles.descriptionBody} selectable>
                {displayTicketDescription.trim() ? displayTicketDescription : "—"}
              </Text>
            </TicketDetailSection>

            <TicketDetailSection
              title={t("ticket.images_label")}
              headerIcon={<Icons.photoLibrary size={22} color={brandPrimary} />}
            >
              {imagesLoading ? (
                <View style={styles.assetLoadingRow}>
                  <RefreshLogoInline logoPx={18} />
                  <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                </View>
              ) : ticketImages.length > 0 ? (
                ticketImages.length === 1 ? (
                  <TouchableOpacity
                    style={styles.ticketImageThumbFull}
                    activeOpacity={0.85}
                    onPress={() => setActiveImageIndex(0)}
                  >
                    <Image
                      source={{ uri: ticketImages[0]!.url }}
                      style={styles.ticketImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.ticketImagesScroll}
                    contentContainerStyle={styles.ticketImagesStrip}
                  >
                    {ticketImages.map((img, index) => (
                      <TouchableOpacity
                        key={img.id}
                        style={[styles.ticketImageThumb, styles.ticketImageThumbHorizontal]}
                        activeOpacity={0.85}
                        onPress={() => setActiveImageIndex(index)}
                      >
                        <Image source={{ uri: img.url }} style={styles.ticketImage} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )
              ) : (
                <Text style={styles.fieldValueMuted}>{t("ticket.images_empty")}</Text>
              )}
            </TicketDetailSection>

            {ticketNeedsTenantQuoteConfirm(ticket.status) && (
          <TicketDetailSection
            title={t("tenant_ticket_detail.section_quote")}
            headerIcon={<Icons.invoice size={22} color={brandPrimary} />}
          >
            {normalizeIssueStatus(ticket.status) === "WAITING_TENANT_APPROVAL_QUOTE" ? (
              <Text style={styles.quoteAwaitingTenantIntro}>
                {t("tenant_ticket_detail.quote_awaiting_tenant_intro")}
              </Text>
            ) : null}
            {quotesLoading ? (
              <View style={styles.assetLoadingRow}>
                <RefreshLogoInline logoPx={18} />
                <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
              </View>
            ) : activeQuote?.id ? (
              <>
                {Array.isArray(activeQuote.items) && activeQuote.items.length > 0 ? (
                  <>
                    {activeQuote.items.map((it) => (
                      <View key={it.id} style={styles.paymentLineRow}>
                        <Text style={styles.paymentLineName} numberOfLines={2}>
                          {it.itemName}
                        </Text>
                        <Text style={styles.paymentLinePrice}>{formatMoney(it.price)}</Text>
                      </View>
                    ))}
                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentTotalRow}>
                      <Text style={styles.paymentTotalLabel}>
                        {t("tenant_ticket_detail.quote_total_label")}
                      </Text>
                      <Text style={styles.paymentTotalValue}>{formatMoney(activeQuote.totalPrice)}</Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.fieldValueMuted}>{t("common.no_data")}</Text>
                )}

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
                    <RefreshLogoInline logoPx={18} />
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
          </TicketDetailSection>
        )}

        {normalizeIssueStatus(ticket.status) === "WAITING_PAYMENT" && (
          <TicketDetailSection
            title={t("tenant_ticket_detail.section_payment")}
            headerIcon={<Icons.invoice size={22} color={brandPrimary} />}
          >
            {quotesLoading ? (
              <View style={styles.assetLoadingRow}>
                <RefreshLogoInline logoPx={18} />
                <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
              </View>
            ) : paymentQuote?.items?.length ? (
              <>
                {paymentQuote.items.map((it) => (
                  <View key={it.id} style={styles.paymentLineRow}>
                    <Text style={styles.paymentLineName} numberOfLines={2}>
                      {it.itemName}
                    </Text>
                    <Text style={styles.paymentLinePrice}>{formatMoney(it.price)}</Text>
                  </View>
                ))}
                <View style={styles.paymentDivider} />
                <View style={styles.paymentTotalRow}>
                  <Text style={styles.paymentTotalLabel}>
                    {t("tenant_ticket_detail.quote_total_label")}
                  </Text>
                  <Text style={styles.paymentTotalValue}>{formatMoney(paymentQuote.totalPrice)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.payNowBtn, payRepairLoading && { opacity: 0.72 }]}
                  onPress={() => void handlePayRepair()}
                  activeOpacity={0.8}
                  disabled={payRepairLoading}
                >
                  {payRepairLoading ? (
                    <RefreshLogoInline logoPx={18} />
                  ) : (
                    <Icons.wallet size={22} color={neutral.surface} />
                  )}
                  <Text style={styles.payNowBtnText}>{t("tenant_ticket_detail.pay_repair_btn")}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.fieldValueMuted}>{t("tenant_ticket_detail.payment_quote_hint")}</Text>
                <TouchableOpacity
                  style={[styles.payNowBtn, payRepairLoading && { opacity: 0.72 }]}
                  onPress={() => void handlePayRepair()}
                  activeOpacity={0.8}
                  disabled={payRepairLoading}
                >
                  {payRepairLoading ? (
                    <RefreshLogoInline logoPx={18} />
                  ) : (
                    <Icons.wallet size={22} color={neutral.surface} />
                  )}
                  <Text style={styles.payNowBtnText}>{t("tenant_ticket_detail.pay_repair_btn")}</Text>
                </TouchableOpacity>
              </>
            )}
          </TicketDetailSection>
        )}

        {linkedRepairInvoice ? (
          <TicketDetailSection
            title={t("tenant_ticket_detail.section_repair_invoice")}
            headerIcon={<Icons.invoice size={22} color={brandPrimary} />}
          >
            <InvoicePaymentFlowSection
              invoiceId={linkedRepairInvoice.id}
              hideTitle
              unstyled
              showPaidLineItems={repairInvoicePaid}
              invoiceDisplayTitle={
                repairInvoicePaid
                  ? (repairPaymentContentLabel ??
                    t("tenant_ticket_detail.payment_content_repair_fallback", {
                      title: displayTicketTitle.trim() ? displayTicketTitle : "—",
                    }))
                  : undefined
              }
              detailCtaLabel={
                repairInvoicePaid ? undefined : t("tenant_ticket_detail.open_repair_invoice_detail")
              }
              onPressOpenDetail={
                repairInvoicePaid
                  ? undefined
                  : () =>
                      navigation.navigate("TenantIssueInvoice", { invoice: linkedRepairInvoice })
              }
            />
          </TicketDetailSection>
        ) : null}
          </>
        )}
      </ScrollView>

      <Modal
        visible={activeImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveImageIndex(null)}
      >
        <View style={styles.imageModalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={styles.imageModalBackdropDismiss}
            onPress={() => setActiveImageIndex(null)}
          />
          <View style={styles.imageModalContent}>
            <TouchableOpacity
              style={styles.imageModalClose}
              onPress={() => setActiveImageIndex(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.imageModalCloseText}>×</Text>
            </TouchableOpacity>
            {activeImageIndex !== null && ticketImages.length > 0 ? (
              <FlatList
                ref={imageModalListRef}
                data={ticketImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={styles.imageModalPager}
                keyExtractor={(item) => item.id}
                getItemLayout={(_, index) => ({
                  length: imageModalPageWidth,
                  offset: imageModalPageWidth * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <View style={{ width: imageModalPageWidth }}>
                    <Image
                      source={{ uri: item.url }}
                      style={styles.imageModalImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    imageModalListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                    });
                  }, 100);
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TenantTicketDetailScreen;
