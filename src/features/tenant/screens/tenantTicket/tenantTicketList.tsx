import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { getTenantTicketTitleForUi } from "../../../../shared/utils/issueTicketLocalizedText";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { IssueTicketResponseFromApi, RootStackParamList, TenantTicketFromApi } from "../../../../shared/types";
import { useTenantContext, useRefreshControlGate, useTenantHouses } from "../../../../shared/hooks";
import { useTenantTicketListQuery } from "../../../../shared/hooks/useTenantIssueTickets";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import {
  getIssueQuotesByTicket,
  getTenantTicketImages,
} from "../../../../shared/services/issuesApi";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { getWorkSlotById } from "../../../../shared/services/scheduleApi";
import Icons from "../../../../shared/theme/icon";
import { BRAND_DANGER, brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantTicketListStyles as styles } from "./ticketStyles";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatTenantIssueDateTime,
  formatVndDisplay,
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import {
  StackScreenTitleBadge,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantTicketList">;

type TicketListFilter = "all" | "in_progress" | "sent" | "question" | "payment" | "completed";

type ListTicketExtras = {
  thumbUrl?: string;
  quoteTotal?: number;
  slotTime?: string;
  slotIsToday?: boolean;
  /** ISO bắt đầu slot — format ngày theo locale ở UI. */
  slotStartIso?: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function nilSlotId(v: string | null | undefined): boolean {
  const s = String(v ?? "").trim();
  return !s || s === "00000000-0000-0000-0000-000000000000";
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sortByCreatedDesc(a: TenantTicketFromApi, b: TenantTicketFromApi) {
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return tb - ta;
}

const PAGE_SIZE = CLIENT_LIST_PAGE_SIZE;

function normalizeIssueStatus(status: string | undefined): string {
  return String(status ?? "")
    .trim()
    .toUpperCase();
}

/** Ưu tiên hiển thị: chờ thanh toán → chờ tenant duyệt báo giá → còn lại theo ngày. */
function ticketActionPriority(status: string | undefined): number {
  const s = normalizeIssueStatus(status);
  if (s === "WAITING_PAYMENT") return 2;
  if (s === "WAITING_TENANT_APPROVAL_QUOTE") return 1;
  return 0;
}

function sortTicketsForDisplay(a: TenantTicketFromApi, b: TenantTicketFromApi) {
  const pa = ticketActionPriority(a.status);
  const pb = ticketActionPriority(b.status);
  if (pa !== pb) return pb - pa;
  return sortByCreatedDesc(a, b);
}

function ticketMatchesFilter(item: TenantTicketFromApi, f: TicketListFilter): boolean {
  const s = normalizeIssueStatus(item.status);
  if (f === "all") return true;
  if (f === "question") return String(item.type || "").toUpperCase() === "QUESTION";
  if (f === "payment") return s === "WAITING_PAYMENT";
  if (f === "completed") return s === "DONE" || s === "CLOSED";
  if (f === "in_progress") return s === "IN_PROGRESS" || s === "SCHEDULED";
  if (f === "sent") {
    return (
      s === "CREATED" ||
      s === "NEED_RESCHEDULE" ||
      s === "WAITING_MANAGER_CONFIRM" ||
      s === "WAITING_MANAGER_APPROVAL" ||
      s === "WAITING_MANAGER_APPROVAL_QUOTE" ||
      s === "WAITING_TENANT_APPROVAL" ||
      s === "WAITING_TENANT_APPROVAL_QUOTE"
    );
  }
  return true;
}

/** Phản hồi mới nhất theo ticket QUESTION (mở TenantQuestionDetail). */
function latestResponseByQuestionTicketId(
  tickets: TenantTicketFromApi[],
  responses: IssueTicketResponseFromApi[]
): Record<string, IssueTicketResponseFromApi> {
  const questionIds = new Set(
    tickets.filter((t) => String(t.type || "").toUpperCase() === "QUESTION").map((t) => t.id)
  );
  const out: Record<string, IssueTicketResponseFromApi> = {};
  for (const r of responses) {
    if (!questionIds.has(r.ticketId)) continue;
    const prev = out[r.ticketId];
    if (!prev) {
      out[r.ticketId] = r;
      continue;
    }
    const tr = new Date(r.createdAt).getTime();
    const tp = new Date(prev.createdAt).getTime();
    if (tr > tp) out[r.ticketId] = r;
  }
  return out;
}

/**
 * Chạy `fn` song song với giới hạn số worker — tránh bão hàng chục/hàng trăm request (ảnh slot/quote)
 * khi danh sách ticket dài, vẫn tải dần phần bổ sung sau khi màn đã hiển thị khung danh sách chính.
 */
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    for (;;) {
      const i = index++;
      if (i >= items.length) break;
      results[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

/** Request phụ (thumb / quote / slot) — chỉ chạy cho ticket đang ở trang danh sách; không enqueue theo toàn bộ BE. */
const TENANT_TICKET_LIST_ENRICH_CONCURRENCY = 6;

async function enrichTicketForList(item: TenantTicketFromApi): Promise<ListTicketExtras> {
  const out: ListTicketExtras = {};
  const st = normalizeIssueStatus(item.status);

  try {
    const fromList = Array.isArray(item.images) ? item.images[0]?.url?.trim() : "";
    if (fromList) {
      out.thumbUrl = fromList;
    } else {
      const imgs = await getTenantTicketImages(item.id);
      const u = imgs[0]?.url?.trim();
      if (u) out.thumbUrl = u;
    }
  } catch {
    /* bỏ qua ảnh nếu lỗi */
  }

  if (st === "WAITING_PAYMENT") {
    const q = item.quote;
    if (
      q != null &&
      normalizeIssueStatus(String(q.status)) === "APPROVED" &&
      Number.isFinite(Number(q.totalPrice))
    ) {
      out.quoteTotal = Number(q.totalPrice);
    } else {
      try {
        const quotes = await getIssueQuotesByTicket(item.id);
        const approved =
          quotes.find((qItem) => normalizeIssueStatus(qItem.status) === "APPROVED") ?? quotes[0];
        const n = approved != null ? Number(approved.totalPrice) : NaN;
        if (Number.isFinite(n)) out.quoteTotal = n;
      } catch {
        /* */
      }
    }
  }

  if (st === "IN_PROGRESS" || st === "SCHEDULED") {
    const embedded = typeof item.startTime === "string" ? item.startTime.trim() : "";
    if (embedded) {
      const d = new Date(embedded);
      if (!Number.isNaN(d.getTime())) {
        out.slotStartIso = embedded;
        out.slotTime = `${d.getHours()}:${pad2(d.getMinutes())}`;
        out.slotIsToday = isSameLocalDay(d, new Date());
      }
    } else if (item.slotId && !nilSlotId(item.slotId)) {
      try {
        const res = await getWorkSlotById(String(item.slotId));
        const slot = res?.success ? res.data : null;
        if (slot?.startTime) {
          const d = new Date(slot.startTime);
          if (!Number.isNaN(d.getTime())) {
            out.slotStartIso = String(slot.startTime);
            out.slotTime = `${d.getHours()}:${pad2(d.getMinutes())}`;
            out.slotIsToday = isSameLocalDay(d, new Date());
          }
        }
      } catch {
        /* */
      }
    }
  }

  return out;
}

const TenantTicketListScreen = () => {
  const { t, i18n } = useTranslation();
  const appLang = i18n.language;
  const navigation = useNavigation<NavProp>();
  const { houseId } = useTenantContext();
  const { data: housesData } = useTenantHouses();
  const tenantHouseList = housesData?.data ?? [];

  const houseNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of tenantHouseList) {
      const id = String(h.id ?? "").trim();
      if (!id) continue;
      const name = String(h.name ?? "").trim();
      m.set(id, name.length ? name : id);
    }
    return m;
  }, [tenantHouseList]);

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<TenantTicketFromApi>>(null);

  const listFocused = useIsFocused();
  const {
    data: listBundle,
    isPending,
    isError,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useTenantTicketListQuery({ focused: listFocused });

  const sortedTickets = useMemo(() => {
    if (!listBundle?.tickets?.length) return [];
    return [...listBundle.tickets].sort(sortTicketsForDisplay);
  }, [listBundle?.tickets]);

  const [extrasById, setExtrasById] = useState<Record<string, ListTicketExtras>>({});
  const [listFilter, setListFilter] = useState<TicketListFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();
  /** Đang tạo link VNPay từ danh sách — khóa trùng tap. */
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null);

  const responseByTicketId = useMemo(
    () =>
      latestResponseByQuestionTicketId(
        sortedTickets,
        listBundle?.responses ?? []
      ),
    [sortedTickets, listBundle?.responses]
  );

  const onManualRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedTickets.length, listFilter]);

  const filteredAll = useMemo(
    () => sortedTickets.filter((it) => ticketMatchesFilter(it, listFilter)),
    [sortedTickets, listFilter]
  );

  const totalPages = useMemo(
    () => getTotalPages(filteredAll.length, PAGE_SIZE),
    [filteredAll.length]
  );

  const pagedItems = useMemo(
    () => slicePage(filteredAll, currentPage, PAGE_SIZE),
    [filteredAll, currentPage]
  );

  /**
   * Sau refetch BE: bỏ extras của ticket không còn trong danh sách (tránh leak map trong bộ nhớ).
   */
  useEffect(() => {
    const valid = new Set(sortedTickets.map((x) => x.id));
    if (valid.size === 0) {
      setExtrasById({});
      return;
    }
    setExtrasById((prev) => {
      let touched = false;
      const next: Record<string, ListTicketExtras> = { ...prev };
      for (const k of Object.keys(next)) {
        if (!valid.has(k)) {
          delete next[k];
          touched = true;
        }
      }
      return touched ? next : prev;
    });
  }, [sortedTickets]);

  /**
   * Enrich chỉ ticket đang ở trang hiện tại (~PAGE_SIZE): tránh trăm request + JSON khổng lồ cùng lúc
   * khi GET /issues/tickets/tenant trả toàn bộ lịch sử (crash / timeout).
   * Đổi trang hoặc `dataUpdatedAt` (kéo refresh / poll) → tải bổ sung cho trang đang xem.
   */
  useEffect(() => {
    if (!pagedItems.length) return;
    let cancelled = false;
    void (async () => {
      try {
        const entries = await mapPool(
          pagedItems,
          TENANT_TICKET_LIST_ENRICH_CONCURRENCY,
          async (item): Promise<[string, ListTicketExtras]> => {
            const ex = await enrichTicketForList(item);
            return [item.id, ex];
          }
        );
        if (cancelled) return;
        setExtrasById((prev) => {
          const next = { ...prev };
          for (const [id, ex] of entries) {
            next[id] = ex;
          }
          return next;
        });
      } catch {
        /* enqueue lớp ngoài hiếm — từng ticket đã try/catch */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pagedItems, dataUpdatedAt]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const formatMoney = useCallback(
    (v: number) => formatVndDisplay(v, locale, t),
    [locale, t]
  );

  const statusLabel = (status: string) => {
    const normalized = normalizeIssueStatus(status);
    const key = `tenant_ticket_list.status_${normalized}`;
    const label = t(key);
    if (label !== key) return label;
    return normalized || status;
  };

  const headerStatusColor = (status: string) => {
    const s = normalizeIssueStatus(status);
    if (s === "WAITING_PAYMENT") return BRAND_DANGER;
    if (s === "WAITING_TENANT_APPROVAL_QUOTE") return "#B45309";
    if (s === "IN_PROGRESS" || s === "SCHEDULED") return brandSecondary;
    return neutral.textSecondary;
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
    if (u === "REPAIR") return styles.typeRepair;
    if (u === "MAINTENANCE") return styles.typeMaintenance;
    if (u === "QUESTION") return styles.typeQuestion;
    return styles.typeDefault;
  };

  const typeTagFg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return styles.typeRepairText;
    if (u === "MAINTENANCE") return styles.typeMaintenanceText;
    if (u === "QUESTION") return styles.typeQuestionText;
    return styles.typeDefaultText;
  };

  const onPressDetail = (item: TenantTicketFromApi) => {
    navigation.navigate("TenantTicketDetail", { ticket: item });
  };

  const zoneLabelForTicket = useCallback(
    (item: TenantTicketFromApi) => {
      const hid = String(item.houseId ?? "").trim();
      if (!hid) return t("tenant_question_list.zone_unknown");
      return houseNameById.get(hid) ?? t("tenant_question_list.zone_unknown");
    },
    [houseNameById, t]
  );

  const onPressQuestionAnswerDetail = useCallback(
    (item: TenantTicketFromApi) => {
      const r = responseByTicketId[item.id];
      if (!r) return;
      navigation.navigate("TenantQuestionDetail", {
        response: r,
        zoneLabel: zoneLabelForTicket(item),
      });
    },
    [navigation, responseByTicketId, zoneLabelForTicket]
  );

  const handlePayFromList = useCallback(
    (item: TenantTicketFromApi) => {
      const tid = String(item.id ?? "").trim();
      if (!tid || payingTicketId != null) return;

      Alert.alert(
        t("tenant_issue_payment.pick_method_title"),
        t("tenant_issue_payment.pick_method_body_vnpay_only"),
        [
          {
            text: t("tenant_issue_payment.pick_cancel"),
            style: "cancel",
            onPress: () => {},
          },
          {
            text: t("tenant_issue_payment.pick_vnpay"),
            onPress: () => {
              void (async () => {
                setPayingTicketId(tid);
                try {
                  const quotes = await getIssueQuotesByTicket(tid);
                  const approved =
                    quotes.find((q) => normalizeIssueStatus(q.status) === "APPROVED") ?? quotes[0];
                  const quoteId = String(approved?.id ?? "").trim();
                  if (!quoteId) {
                    Alert.alert(
                      t("tenant_payment.title"),
                      t("tenant_ticket_list.pay_no_quote_body"),
                      [{ text: t("common.close") }],
                      { type: "error" },
                    );
                    return;
                  }
                  const checkoutUrl = await createVnpayPaymentLink(
                    { quoteId },
                    { appLanguage: i18n.language },
                  );
                  navigation.navigate("VnpayCheckout", {
                    checkoutUrl,
                    afterSuccess: "ticketDetail",
                    ticketForAfterSuccess: item,
                    vnpayUiContext: "repair_quote",
                  });
                } catch (e: unknown) {
                  const msg = formatApiErrorForTenantAlert(e, t, "payment_link");
                  Alert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], {
                    type: "error",
                  });
                } finally {
                  setPayingTicketId(null);
                }
              })();
            },
          },
        ],
        { type: "info" },
      );
    },
    [payingTicketId, i18n.language, navigation, t],
  );

  const openCreateTicket = () => {
    const hid = String(houseId ?? "").trim();
    if (!hid) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.house_missing"));
      return;
    }
    navigation.navigate("Ticket", { houseId: hid });
  };

  const filterChips = useMemo(
    () =>
      [
        { key: "all" as const, label: t("tenant_ticket_list.filter_all") },
        { key: "in_progress" as const, label: t("tenant_ticket_list.filter_in_progress") },
        { key: "sent" as const, label: t("tenant_ticket_list.filter_sent") },
        { key: "question" as const, label: t("tenant_ticket_list.filter_question") },
        { key: "payment" as const, label: t("tenant_ticket_list.filter_payment") },
        { key: "completed" as const, label: t("tenant_ticket_list.filter_completed") },
      ] as const,
    [t]
  );

  const showProgressInset = (item: TenantTicketFromApi) => {
    const s = normalizeIssueStatus(item.status);
    return s === "IN_PROGRESS" || s === "SCHEDULED";
  };

  const showContactSoonInset = (item: TenantTicketFromApi) =>
    normalizeIssueStatus(item.status) === "CREATED";

  /** Khung trắng + chip lọc đồng bộ với thẻ list và tab trong Notification. */
  const renderFilterHeader = () => (
    <View style={styles.filterCard}>
      <View style={styles.filterCardIntro}>
        <Text style={styles.filterCardTitle} numberOfLines={1}>
          {t("tenant_ticket_list.list_heading")}
        </Text>
        <Text style={styles.filterCardSubtitle} numberOfLines={2}>
          {t("tenant_ticket_list.list_subtitle")}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChipsScroll}
        contentContainerStyle={styles.filterChipsContent}
        keyboardShouldPersistTaps="handled"
      >
        {filterChips.map(({ key, label }) => {
          const active = listFilter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterSortChip, active && styles.filterSortChipActive]}
              onPress={() => setListFilter(key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterSortChipText, active && styles.filterSortChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderItem = ({ item }: { item: TenantTicketFromApi }) => {
    const stNorm = normalizeIssueStatus(item.status);
    const waitingPay = stNorm === "WAITING_PAYMENT";
    const awaitingQuoteConfirm = stNorm === "WAITING_TENANT_APPROVAL_QUOTE";
    const ex = extrasById[item.id] ?? {};
    const progress = showProgressInset(item);
    const contactSoon = showContactSoonInset(item);

    const payingThis = payingTicketId != null && payingTicketId === item.id;
    const isQuestionTicket = String(item.type || "").toUpperCase() === "QUESTION";
    const questionAnswer = isQuestionTicket ? responseByTicketId[item.id] : undefined;
    const showViewAnswerBtn = questionAnswer != null;

    return (
      <View
        style={[
          styles.card,
          waitingPay && styles.cardAwaitingPayment,
          awaitingQuoteConfirm && styles.cardAwaitingTenantQuote,
          stNorm === "CREATED" && styles.cardBorderCreated,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => onPressDetail(item)}
          accessibilityRole="button"
          accessibilityHint={
            awaitingQuoteConfirm ? t("tenant_ticket_list.quote_confirm_card_a11y_hint") : undefined
          }
        >
          <View style={styles.metaHeaderRow}>
          <View style={[styles.typeTagOnCard, styles.typeTagInMeta, typeTagBg(item.type)]}>
            <Text style={[styles.typeTagOnCardText, typeTagFg(item.type)]}>{typeLabel(item.type)}</Text>
          </View>
          <View style={styles.headerRightCol}>
            <Text style={styles.headerTimeText}>{formatTenantIssueDateTime(item.createdAt, locale)}</Text>
            <View style={styles.headerStatusRowEnd}>
              <Text
                style={[styles.headerStatusEmphasis, { color: headerStatusColor(item.status) }]}
                numberOfLines={2}
              >
                {statusLabel(item.status)}
              </Text>
              {awaitingQuoteConfirm ? <Icons.chevronForward size={18} color="#B45309" /> : null}
            </View>
          </View>
        </View>

        <View style={styles.contentRowThumb}>
          {ex.thumbUrl ? (
            <Image source={{ uri: ex.thumbUrl }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <View style={styles.thumbSpacer} accessible={false} />
          )}
          <View style={styles.contentTextCol}>
            <Text style={styles.cardTitleFigma} numberOfLines={3}>
              {getTenantTicketTitleForUi(item)}
            </Text>
          </View>
        </View>

        {awaitingQuoteConfirm ? (
          <View style={styles.progressInsetQuoteApprove}>
            <Icons.contract size={20} color="#B45309" />
            <View style={styles.progressInsetTextCol}>
              <Text style={styles.progressInsetTitleQuoteApprove}>
                {t("tenant_ticket_list.quote_approve_inset_line")}
              </Text>
            </View>
          </View>
        ) : null}

        {waitingPay ? (
          <>
            <View style={styles.dividerThin} />
            <View style={styles.costEstimateRow}>
              <Text style={styles.costEstimateLabel}>
                {t("tenant_ticket_list.estimated_cost_prefix")}{" "}
                <Text style={styles.costEstimateAmount}>
                  {ex.quoteTotal != null ? formatMoney(ex.quoteTotal) : "—"}
                </Text>
              </Text>
            </View>
          </>
        ) : null}

        {progress ? (
          <View style={styles.progressInset}>
            <Icons.build size={20} color={brandSecondary} />
            <View style={styles.progressInsetTextCol}>
              <Text style={styles.progressInsetTitle}>
                {t(
                  stNorm === "IN_PROGRESS"
                    ? "tenant_ticket_list.progress_technician_line_in_progress"
                    : "tenant_ticket_list.progress_technician_line_scheduled"
                )}
              </Text>
              <Text style={styles.progressInsetSub}>
                {!ex.slotTime
                  ? t("tenant_ticket_list.progress_time_pending")
                  : ex.slotStartIso
                    ? (() => {
                        const sd = new Date(ex.slotStartIso);
                        if (Number.isNaN(sd.getTime())) {
                          return ex.slotIsToday
                            ? t("tenant_ticket_list.progress_expected_today", { time: ex.slotTime })
                            : t("tenant_ticket_list.progress_expected_time", { time: ex.slotTime });
                        }
                        const dateStr = sd.toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        });
                        return t("tenant_ticket_list.progress_expected_datetime", {
                          date: dateStr,
                          time: ex.slotTime,
                        });
                      })()
                    : ex.slotIsToday
                      ? t("tenant_ticket_list.progress_expected_today", { time: ex.slotTime })
                      : t("tenant_ticket_list.progress_expected_time", { time: ex.slotTime })}
              </Text>
            </View>
          </View>
        ) : null}

        {contactSoon ? (
          <View style={styles.progressInset}>
            <Icons.call size={20} color={brandSecondary} />
            <View style={styles.progressInsetTextCol}>
              <Text style={styles.progressInsetTitle}>{t("tenant_ticket_list.progress_contact_soon_line")}</Text>
            </View>
          </View>
        ) : null}
        </TouchableOpacity>

        {showViewAnswerBtn ? (
          <TouchableOpacity
            style={styles.questionAnswerBtn}
            onPress={() => onPressQuestionAnswerDetail(item)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("tenant_ticket_list.question_view_answer_btn")}
          >
            <Icons.helpOutline size={20} color={brandSecondary} />
            <Text style={styles.questionAnswerBtnText}>{t("tenant_ticket_list.question_view_answer_btn")}</Text>
            <Icons.chevronForward size={18} color={brandSecondary} />
          </TouchableOpacity>
        ) : null}

        {waitingPay ? (
          <TouchableOpacity
            style={[
              styles.payBtnFull,
              showViewAnswerBtn && { marginTop: 10 },
              (payingThis || payingTicketId != null) && { opacity: 0.72 },
            ]}
            onPress={() => void handlePayFromList(item)}
            disabled={payingTicketId != null}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("tenant_ticket_list.pay_btn")}
          >
            {payingThis ? (
              <RefreshLogoInline logoPx={18} />
            ) : (
              <Icons.wallet size={20} color={neutral.surface} />
            )}
            <Text style={styles.payBtnFullText}>{t("tenant_ticket_list.pay_btn")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const listBottomPad = Math.max(insets.bottom, 24) + (totalPages > 1 ? 8 : 0) + 72;

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
              {t("tenant_ticket_list.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <View style={stackScreenTitleSideSlotStyle} />
        </View>
      </StackScreenTitleHeaderStrip>

      {isPending && sortedTickets.length === 0 ? (
        <View style={[styles.centered, { flex: 1, position: "relative" }]}>
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : isError && sortedTickets.length === 0 ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={styles.errorText}>{t("tenant_ticket_list.load_error")}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={{ flex: 1, position: "relative" }}>
            <RefreshLogoOverlay visible={isRefetching} />
            <View style={styles.filterSectionWrap}>{renderFilterHeader()}</View>
            <FlatList
              ref={listRef}
              style={{ flex: 1, zIndex: 0 }}
              data={pagedItems}
              keyExtractor={(it) => it.id}
              renderItem={renderItem}
              extraData={{
                extrasById,
                payingTicketId,
                listFilter,
                currentPage,
                responseByTicketId,
                appLang,
              }}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: listBottomPad },
                filteredAll.length === 0 && styles.listEmptyGrow,
              ]}
              onScroll={onScrollForRefreshGate}
              scrollEventThrottle={16}
              refreshControl={
                <PullToRefreshControl
                  refreshing={isRefetching}
                  onRefresh={onManualRefresh}
                  scrollAtTop={scrollAtTop}
                />
              }
              ListEmptyComponent={
                <Text style={styles.empty}>{t("tenant_ticket_list.empty")}</Text>
              }
              ListFooterComponent={
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  style={{ paddingBottom: Math.max(insets.bottom, 8) }}
                />
              }
            />
          </View>
          <TouchableOpacity
            style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 8 }]}
            onPress={openCreateTicket}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={t("tenant_ticket_list.fab_create_a11y")}
          >
            <Icons.plus size={26} color={neutral.surface} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default TenantTicketListScreen;
