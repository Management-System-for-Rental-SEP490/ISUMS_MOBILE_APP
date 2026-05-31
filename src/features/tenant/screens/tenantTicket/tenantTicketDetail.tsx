import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../../shared/types";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import type { IssueQuoteFromApi } from "../../../../shared/types/api";
import {
  confirmIssueQuoteStatus,
  getIssueQuotesByTicket,
  getTenantTicketAssetDisplayName,
  getTenantTicketById,
  type TenantTicketImageFromApi,
} from "../../../../shared/services/issuesApi";
import { useTenantInvoices } from "../../../../shared/hooks";
import { isTenantInvoicePayable, isTenantTicketIssueInvoice } from "../../../../shared/utils/tenantInvoice";
import { InvoicePaymentFlowSection } from "../tenantInvoice/InvoicePaymentFlowSection";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import Icons from "../../../../shared/theme/icon";
import { brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantTicketDetailStyles as styles, tenantTicketListStyles as badge } from "./ticketStyles";
import { formatTenantIssueDateTime, formatVndDisplay } from "../../../../shared/utils";
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

/** Metro / Xcode: lọc theo `[TenantTicketDetail:API]`. */
const perfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

type Props = NativeStackScreenProps<RootStackParamList, "TenantTicketDetail">;

/** Cùng logic `tenantTicketList`: chừa chỗ cho tab home + thanh điều hướng hệ thống (Android gesture). */
const TENANT_TICKET_TAB_BAR_CLEARANCE = 72;

function TicketDetailSection({
  title,
  headerIcon,
  children,
  onHeaderPress,
  headerRight,
}: {
  title: string;
  headerIcon: React.ReactNode;
  children: React.ReactNode;
  /** Khi cung cấp, toàn bộ hàng header trở thành vùng nhấn (dùng cho mục báo giá có thể thu/mở). */
  onHeaderPress?: () => void;
  /** Slot bên phải tiêu đề, ví dụ mũi tên chevron cho mục có thể thu/mở. */
  headerRight?: React.ReactNode;
}) {
  const headerContent = (
    <View style={styles.detailCardHeaderRow}>
      {headerIcon}
      <Text style={styles.detailCardHeaderLabel}>{title}</Text>
      {headerRight}
    </View>
  );
  return (
    <View style={styles.detailCard}>
      {onHeaderPress ? (
        <TouchableOpacity onPress={onHeaderPress} activeOpacity={0.7}>
          {headerContent}
        </TouchableOpacity>
      ) : (
        headerContent
      )}
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

const TenantTicketDetailScreen = ({ navigation, route }: Props) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [ticket, setTicket] = useState(route.params.ticket);
  /**
   * Luồng chi tiết chỉ dùng GET /issues/tickets/:id (embed ảnh, asset, slot start/end, staff, quote, latestTicketResponse).
   * `true` đến khi lần đầu (hoặc kéo refresh) hoàn tất — không gọi thêm asset/images/work_slot/quotes/responses.
   */
  const [ticketDetailLoading, setTicketDetailLoading] = useState(true);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  /** Index ảnh đang xem fullscreen; null = đóng modal. */
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const imageModalListRef = useRef<FlatList<TenantTicketImageFromApi>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const imageModalPageWidth = Math.max(0, windowWidth - 32);

  const [confirmQuoteLoading, setConfirmQuoteLoading] = useState(false);
  const [confirmQuoteError, setConfirmQuoteError] = useState<string | null>(null);
  const [payRepairLoading, setPayRepairLoading] = useState(false);

  /**
   * Trạng thái mục báo giá có thể thu/mở.
   * Báo giá được fetch theo yêu cầu khi người dùng bấm mở lần đầu — BE không embed trong GET ticket by id.
   * fetchedQuotes: null = chưa fetch; [] = fetch xong nhưng không có báo giá; [...] = có dữ liệu.
   */
  const [quoteExpanded, setQuoteExpanded] = useState(false);
  const [quoteFetchLoading, setQuoteFetchLoading] = useState(false);
  const [quoteFetchError, setQuoteFetchError] = useState<string | null>(null);
  const [fetchedQuotes, setFetchedQuotes] = useState<IssueQuoteFromApi[] | null>(null);

  const isQuestionTicket = useMemo(
    () => String(ticket?.type ?? "").toUpperCase() === "QUESTION",
    [ticket?.type]
  );

  const ticketImagesList = useMemo(() => ticket.images ?? [], [ticket.images]);

  const assetName = useMemo(
    () => getTenantTicketAssetDisplayName(ticket),
    [ticket]
  );

  const questionResponse = ticket.latestTicketResponse ?? null;

  const { data: invoiceQueryData, refetch: refetchTenantInvoices } = useTenantInvoices();
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

  useFocusEffect(
    useCallback(() => {
      if (__DEV__) {
        console.log(
          "[TenantTicketDetail:API] focus — refetch useTenantInvoices (GET hóa đơn tenant, React Query) — song song với refreshTicket nếu cùng lúc mount"
        );
      }
      const t0 = __DEV__ ? perfNow() : 0;
      void refetchTenantInvoices().finally(() => {
        if (__DEV__) {
          console.log(`[TenantTicketDetail:API] refetchTenantInvoices xong ${(perfNow() - t0).toFixed(0)}ms`);
        }
      });
    }, [refetchTenantInvoices])
  );

  const pad2 = (n: number) => String(n).padStart(2, "0");

  /** Format khung giờ từ `startTime` / `endTime` embed GET ticket (không gọi work_slots). */
  const formatSlotRange = useCallback((startIso: string, endIso: string) => {
    const sd = new Date(startIso);
    const ed = new Date(endIso);
    if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) return null;
    const startTime = `${sd.getHours()}:${pad2(sd.getMinutes())}`;
    const endTime = `${ed.getHours()}:${pad2(ed.getMinutes())}`;
    const dateStr = `${pad2(sd.getDate())}/${pad2(sd.getMonth() + 1)}/${sd.getFullYear()}`;
    return `${startTime} - ${endTime}, ${dateStr}`;
  }, []);

  const predictedHandlingTime = useMemo(() => {
    if (String(ticket?.type ?? "").toUpperCase() === "QUESTION") return null;
    const startIso = String(ticket.startTime ?? "").trim();
    const endIso = String(ticket.endTime ?? "").trim();
    if (!startIso || !endIso) return null;
    return formatSlotRange(startIso, endIso);
  }, [ticket?.type, ticket.startTime, ticket.endTime, formatSlotRange]);

  /**
   * Một request GET ticket by id cập nhật toàn bộ embed (ảnh, asset, slot, staff, quote, latestTicketResponse).
   * Lần đầu dùng `ticketDetailLoading`; kéo refresh dùng `detailRefreshing`.
   */
  const refreshTicket = useCallback(async () => {
    const id = String(ticket?.id ?? "").trim();
    if (!id) {
      setTicketDetailLoading(false);
      setDetailRefreshing(false);
      return;
    }
    const phase = hasLoadedOnceRef.current ? "refresh" : "first_open";
    if (hasLoadedOnceRef.current) {
      setDetailRefreshing(true);
      // Khi kéo refresh: đóng mục báo giá + xóa cache để lần mở tiếp sẽ fetch lại
      setQuoteExpanded(false);
      setFetchedQuotes(null);
    } else {
      setTicketDetailLoading(true);
    }
    const t0 = __DEV__ ? perfNow() : 0;
    if (__DEV__) {
      console.log(
        `[TenantTicketDetail:API] refreshTicket phase=${phase} ticketId=${id} — GET /issues/tickets/:id (embed ảnh/slot/quote/…) — không gọi images/asset/work_slots/quotes/responses riêng`
      );
    }
    try {
      const updated = await getTenantTicketById(id);
      if (updated) setTicket(updated);
      if (__DEV__) {
        const ms = perfNow() - t0;
        const hasQuote = Boolean(updated?.quote?.id);
        const hasImages = Array.isArray(updated?.images) ? updated!.images!.length : 0;
        const hasSlotTimes = Boolean(
          String(updated?.startTime ?? "").trim() && String(updated?.endTime ?? "").trim()
        );
        console.log(
          `[TenantTicketDetail:API] getTenantTicketById xong ${ms.toFixed(0)}ms — images=${hasImages} startEnd=${hasSlotTimes} quote=${hasQuote} latestResponse=${Boolean(updated?.latestTicketResponse?.id)}`
        );
      }
    } catch {
      if (__DEV__) {
        console.warn(`[TenantTicketDetail:API] getTenantTicketById lỗi sau ${(perfNow() - t0).toFixed(0)}ms`);
      }
      /* giữ ticket cũ nếu refresh lỗi */
    } finally {
      setTicketDetailLoading(false);
      setDetailRefreshing(false);
      hasLoadedOnceRef.current = true;
    }
  }, [ticket?.id, i18n.language]);

  useEffect(() => {
    void refreshTicket();
  }, [refreshTicket]);

  useEffect(() => {
    if (activeImageIndex == null || ticketImagesList.length === 0) return;
    const index = Math.min(Math.max(0, activeImageIndex), ticketImagesList.length - 1);
    const timer = setTimeout(() => {
      imageModalListRef.current?.scrollToIndex({ index, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeImageIndex, ticketImagesList]);

  /**
   * Báo giá cần tenant duyệt (từ fetchedQuotes).
   * Ưu tiên quote đang ở trạng thái WAITING_TENANT_APPROVAL*; nếu không có thì lấy quote đầu tiên.
   */
  const activeQuoteFromFetch = useMemo(() => {
    if (!fetchedQuotes?.length) return null;
    const waiting = fetchedQuotes.find((q) => quoteAwaitingTenantConfirm(q));
    return waiting ?? fetchedQuotes[0] ?? null;
  }, [fetchedQuotes]);

  /**
   * Báo giá đã duyệt (APPROVED) dùng cho luồng thanh toán — từ fetchedQuotes.
   */
  const paymentQuoteFromFetch = useMemo(() => {
    if (!fetchedQuotes?.length) return null;
    const approved = fetchedQuotes.find((q) => normalizeIssueStatus(q.status) === "APPROVED");
    return approved ?? fetchedQuotes[0] ?? null;
  }, [fetchedQuotes]);

  /**
   * Quote hiển thị trong mục thu/mở — chọn theo trạng thái ticket:
   * - Đang chờ duyệt → activeQuoteFromFetch
   * - Đang chờ thanh toán → paymentQuoteFromFetch
   * - Trạng thái khác (DONE, CLOSED…) → quote đầu tiên để xem thông tin
   */
  const quoteToDisplay = useMemo(() => {
    if (!fetchedQuotes?.length) return null;
    if (ticketNeedsTenantQuoteConfirm(ticket.status)) return activeQuoteFromFetch ?? fetchedQuotes[0] ?? null;
    if (normalizeIssueStatus(ticket.status) === "WAITING_PAYMENT") return paymentQuoteFromFetch ?? fetchedQuotes[0] ?? null;
    return fetchedQuotes[0] ?? null;
  }, [fetchedQuotes, ticket.status, activeQuoteFromFetch, paymentQuoteFromFetch]);

  const formatMoney = useCallback(
    (v: number) => formatVndDisplay(v, locale, t),
    [locale, t]
  );

  /**
   * Báo giá dùng cho khối «đã thanh toán» — từ fetchedQuotes.
   * Ưu tiên APPROVED; không có thì quote mới nhất theo createdAt.
   * Trả null nếu chưa fetch (phần invoice sẽ dùng fallback title từ ticket).
   */
  const quoteForPaidRepairDisplay = useMemo(() => {
    if (!fetchedQuotes?.length) return null;
    const approved = fetchedQuotes.find((q) => normalizeIssueStatus(q.status) === "APPROVED");
    if (approved) return approved;
    return (
      [...fetchedQuotes].sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        if (tb !== ta) return tb - ta;
        return String(a.id).localeCompare(String(b.id));
      })[0] ?? null
    );
  }, [fetchedQuotes]);

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

  /**
   * Xác nhận báo giá — dùng quoteId lấy từ fetchedQuotes (activeQuoteFromFetch).
   * Sau khi xác nhận thành công: refresh ticket, điều hướng về danh sách, hiện alert.
   */
  const handleConfirmQuote = useCallback(async () => {
    if (!activeQuoteFromFetch?.id) return;
    if (confirmQuoteLoading) return;

    setConfirmQuoteError(null);
    setConfirmQuoteLoading(true);
    try {
      await confirmIssueQuoteStatus(activeQuoteFromFetch.id);
      await refreshTicket();
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
  }, [activeQuoteFromFetch?.id, confirmQuoteLoading, navigation, refreshTicket, t]);

  /**
   * Thanh toán báo giá sửa chữa.
   * Ưu tiên quoteId từ fetchedQuotes (paymentQuoteFromFetch) để tạo link VNPay.
   * Không có quoteId → fallback hóa đơn sửa chữa hoặc danh sách hóa đơn.
   */
  const handlePayRepair = useCallback(async () => {
    if (payRepairLoading) return;
    const qid = String(paymentQuoteFromFetch?.id ?? "").trim();
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
    paymentQuoteFromFetch?.id,
    i18n.language,
    navigation,
    ticket,
    linkedRepairInvoice,
    t,
  ]);

  /**
   * Fetch danh sách báo giá theo ticketId từ API (GET /issues/quotes/ticket/:id).
   * Được gọi khi người dùng mở mục báo giá lần đầu, hoặc nhấn "Thử lại" sau lỗi.
   */
  const fetchQuotes = useCallback(async () => {
    const id = String(ticket?.id ?? "").trim();
    if (!id || quoteFetchLoading) return;
    setQuoteFetchLoading(true);
    setQuoteFetchError(null);
    try {
      const rows = await getIssueQuotesByTicket(id);
      setFetchedQuotes(rows);
    } catch {
      setQuoteFetchError(t("tenant_ticket_detail.quote_fetch_error"));
    } finally {
      setQuoteFetchLoading(false);
    }
  }, [ticket?.id, quoteFetchLoading, t]);

  /**
   * Toggle mục báo giá có thể thu/mở.
   * Lần đầu mở: gọi fetchQuotes() để lấy dữ liệu từ API.
   * Mở lại sau khi đã fetch: dùng cache (fetchedQuotes không reset).
   */
  const handleToggleQuoteSection = useCallback(() => {
    const willOpen = !quoteExpanded;
    setQuoteExpanded(willOpen);
    if (!willOpen) return;
    if (fetchedQuotes !== null) return;
    void fetchQuotes();
  }, [quoteExpanded, fetchedQuotes, fetchQuotes]);

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

  const detailBusy = ticketDetailLoading || detailRefreshing;

  const nilUuid = (v: string | null | undefined) =>
    v == null || String(v).trim() === "";

  const sv = statusVisual(ticket.status);
  const staffParty = ticket.assignedStaff as
    | { id?: string; name?: string; phoneNumber?: string; phone?: string }
    | null
    | undefined;
  const staffAssigned =
    !nilUuid(ticket.assignedStaffId) || Boolean(String(staffParty?.id ?? "").trim());
  const staffNameTrim = String(ticket.staffName ?? staffParty?.name ?? "").trim();
  const staffPhoneTrim = String(
    ticket.staffPhone ?? staffParty?.phoneNumber ?? staffParty?.phone ?? ""
  ).trim();
  const staffNamePending = staffAssigned && detailBusy && !staffNameTrim;
  const staffPhonePending = staffAssigned && detailBusy && !staffPhoneTrim;

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
        refreshControl={
          <RefreshControl
            refreshing={detailRefreshing}
            onRefresh={() => void refreshTicket()}
            tintColor={brandPrimary}
            colors={[brandPrimary]}
          />
        }
      >
        {isQuestionTicket ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroTitle}>{ticket.title?.trim() ? ticket.title : "—"}</Text>
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
                {ticket.description?.trim() ? ticket.description : "—"}
              </Text>
            </TicketDetailSection>

            <TicketDetailSection
              title={t("tenant_ticket_detail.section_answer")}
              headerIcon={<Icons.subject size={22} color={brandPrimary} />}
            >
              {detailBusy ? (
                <View style={styles.assetLoadingRow}>
                  <RefreshLogoInline logoPx={18} />
                  <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                </View>
              ) : questionResponse ? (
                <>
                  <Text style={styles.descriptionBody} selectable>
                    {questionResponse.content?.trim() ? questionResponse.content : "—"}
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
                {detailBusy ? (
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
                {nilUuid(ticket.slotId) ? (
                  <Text style={styles.fieldValueMuted} selectable>
                    {t("tenant_ticket_detail.no_slot")}
                  </Text>
                ) : detailBusy ? (
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
                {ticket.description?.trim() ? ticket.description : "—"}
              </Text>
            </TicketDetailSection>

            <TicketDetailSection
              title={t("ticket.images_label")}
              headerIcon={<Icons.photoLibrary size={22} color={brandPrimary} />}
            >
              {detailBusy ? (
                <View style={styles.assetLoadingRow}>
                  <RefreshLogoInline logoPx={18} />
                  <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                </View>
              ) : ticketImagesList.length > 0 ? (
                ticketImagesList.length === 1 ? (
                  <TouchableOpacity
                    style={styles.ticketImageThumbFull}
                    activeOpacity={0.85}
                    onPress={() => setActiveImageIndex(0)}
                  >
                    <Image
                      source={{ uri: ticketImagesList[0]!.url }}
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
                    {ticketImagesList.map((img, index) => (
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

            {/* Mục báo giá có thể thu/mở — fetch theo yêu cầu khi người dùng bấm mở lần đầu */}
            {!["CREATED", "CANCELLED"].includes(normalizeIssueStatus(ticket.status)) && (
              <TicketDetailSection
                title={t("tenant_ticket_detail.section_quote")}
                headerIcon={<Icons.invoice size={22} color={brandPrimary} />}
                onHeaderPress={handleToggleQuoteSection}
                headerRight={
                  <View style={{ transform: [{ rotate: quoteExpanded ? "180deg" : "0deg" }] }}>
                    <Icons.chevronDown size={18} color={neutral.textMuted} />
                  </View>
                }
              >
                {quoteExpanded && (
                  <View style={{ marginTop: 8 }}>
                    {quoteFetchLoading ? (
                      <View style={styles.assetLoadingRow}>
                        <RefreshLogoInline logoPx={18} />
                        <Text style={styles.fieldValueMuted}>{t("common.loading")}</Text>
                      </View>
                    ) : quoteFetchError ? (
                      <>
                        <Text style={styles.fieldValueMuted}>{quoteFetchError}</Text>
                        <TouchableOpacity
                          style={[styles.confirmQuoteBtn, quoteFetchLoading && { opacity: 0.72 }]}
                          onPress={() => void fetchQuotes()}
                          disabled={quoteFetchLoading}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.confirmQuoteBtnText}>{t("common.try_again")}</Text>
                        </TouchableOpacity>
                      </>
                    ) : fetchedQuotes !== null ? (
                      fetchedQuotes.length === 0 ? (
                        <Text style={styles.fieldValueMuted}>{t("common.no_data")}</Text>
                      ) : (
                        <>
                          {normalizeIssueStatus(ticket.status) === "WAITING_TENANT_APPROVAL_QUOTE" ? (
                            <Text style={styles.quoteAwaitingTenantIntro}>
                              {t("tenant_ticket_detail.quote_awaiting_tenant_intro")}
                            </Text>
                          ) : null}

                          {/* Danh sách hạng mục báo giá */}
                          {quoteToDisplay && Array.isArray(quoteToDisplay.items) && quoteToDisplay.items.length > 0 ? (
                            <>
                              {quoteToDisplay.items.map((it) => (
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
                                <Text style={styles.paymentTotalValue}>
                                  {formatMoney(quoteToDisplay.totalPrice)}
                                </Text>
                              </View>
                            </>
                          ) : (
                            <Text style={styles.fieldValueMuted}>{t("common.no_data")}</Text>
                          )}

                          {/* Nút xác nhận báo giá — khi ticket đang chờ tenant duyệt */}
                          {ticketNeedsTenantQuoteConfirm(ticket.status) && activeQuoteFromFetch?.id ? (
                            <>
                              {!!confirmQuoteError && (
                                <Text style={styles.fieldValueMuted}>{confirmQuoteError}</Text>
                              )}
                              <TouchableOpacity
                                style={[
                                  styles.confirmQuoteBtn,
                                  (confirmQuoteLoading || !activeQuoteFromFetch?.id) && { opacity: 0.72 },
                                ]}
                                onPress={handleConfirmQuote}
                                disabled={confirmQuoteLoading || !activeQuoteFromFetch?.id}
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
                          ) : null}

                          {/* Nút thanh toán — khi ticket đang chờ thanh toán */}
                          {normalizeIssueStatus(ticket.status) === "WAITING_PAYMENT" ? (
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
                              <Text style={styles.payNowBtnText}>
                                {t("tenant_ticket_detail.pay_repair_btn")}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </>
                      )
                    ) : null}
                  </View>
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
                      title: ticket.title?.trim() ? ticket.title : "—",
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
            {activeImageIndex !== null && ticketImagesList.length > 0 ? (
              <FlatList
                ref={imageModalListRef}
                data={ticketImagesList}
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
