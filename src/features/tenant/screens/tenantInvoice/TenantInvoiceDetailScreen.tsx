import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CustomAlert } from "../../../../shared/components/alert";
import { RootStackParamList, TenantInvoiceFromApi } from "../../../../shared/types";
import {
  formatTenantInvoiceAmount,
  formatTenantInvoiceCardTitle,
  isTenantInvoiceIssueType,
  isTenantInvoicePayable,
  isTenantRepairInvoiceFlow,
} from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime, formatVndDisplay, logAllInvoicePaymentIdResolutions } from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import Icons from "../../../../shared/theme/icon";
import { resolveVnpayQuoteIdForRepairInvoice } from "../../../../shared/services/tenantInvoiceApi";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { neutral, tenantInvoicePaidBadgeFg } from "../../../../shared/theme/color";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useHouseById, useTenantHouses, useTenantInvoiceDetailQuery, useTenantInvoices } from "../../../../shared/hooks";
import {
  isHouseIdOutsideTenantAccess,
  shortHouseIdForDisplay,
  tenantAccessibleHouseIdSet,
} from "../../../../shared/utils";
import {
  StackScreenTitleBadge,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import { tenantInvoiceStyles as styles } from "./tenantInvoiceStyles";
import { RefreshLogoInline, RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";
import { InvoicePaymentFlowSection } from "./InvoicePaymentFlowSection";
import { getIssueBanners, getIssueQuotesByTicket } from "../../../../shared/services/issuesApi";
import type { InvoiceIssueItemFromApi, IssueBannerFromApi, IssueQuoteFromApi } from "../../../../shared/types/api";

function normalizeIssueQuoteStatus(status: string | undefined): string {
  return String(status ?? "").trim().toUpperCase();
}

type Props = NativeStackScreenProps<RootStackParamList, "TenantInvoiceDetail">;

const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];

export default function TenantInvoiceDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { invoice } = route.params;
  const invIdFromRoute = String(invoice.id ?? "").trim();
  const invoiceDetailQuery = useTenantInvoiceDetailQuery(invIdFromRoute, {
    focused: isFocused,
    enabled: Boolean(invIdFromRoute),
  });
  const [detailInvoice, setDetailInvoice] = useState<Partial<TenantInvoiceFromApi>>({});
  const mergedInvoice = useMemo(
    () => ({ ...invoice, ...detailInvoice }),
    [invoice, detailInvoice]
  );

  useLayoutEffect(() => {
    if (isTenantRepairInvoiceFlow(mergedInvoice) && !isTenantInvoiceIssueType(mergedInvoice)) {
      navigation.replace("TenantIssueInvoice", { invoice: mergedInvoice });
    }
  }, [mergedInvoice, navigation]);
  const { houseId: selectedHouseIdFromStore } = useAuthStore();
  const { data: invoiceQueryData } = useTenantInvoices(true, { focused: isFocused });
  const { data: housesData } = useTenantHouses();
  const rawInvoiceData = invoiceQueryData ?? EMPTY_TENANT_INVOICES;
  const [creatingLink, setCreatingLink] = useState(false);

  const tenantHouseRows = useMemo(() => {
    const raw = housesData?.data;
    return Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  }, [housesData?.data]);

  const accessHouseIds = useMemo(() => tenantAccessibleHouseIdSet(tenantHouseRows), [tenantHouseRows]);

  const invoiceHouseId = useMemo(() => String(mergedInvoice.houseId ?? "").trim(), [mergedInvoice.houseId]);

  const invoiceHouseOutsideAccess = useMemo(
    () => Boolean(invoiceHouseId && isHouseIdOutsideTenantAccess(invoiceHouseId, accessHouseIds)),
    [invoiceHouseId, accessHouseIds]
  );

  const lacksInvoiceHouseName = !String(mergedInvoice.houseName ?? "").trim();
  const hasNameFromMyAccess = useMemo(() => {
    if (!invoiceHouseId) return false;
    const found = tenantHouseRows.find((h) => String(h.id ?? "").trim() === invoiceHouseId);
    return Boolean(found?.name?.trim());
  }, [invoiceHouseId, tenantHouseRows]);

  const needsInvoiceHouseById =
    Boolean(invoiceHouseId && lacksInvoiceHouseName && !hasNameFromMyAccess);
  const { data: invoiceHouseByIdRes, isPending: invoiceHouseByIdPending } = useHouseById(
    invoiceHouseId,
    needsInvoiceHouseById
  );

  const invoiceHouseLabelLoading = useMemo(() => {
    if (!invoiceHouseId) return false;
    const fromInv = String(mergedInvoice.houseName ?? "").trim();
    if (fromInv) return false;
    const found = tenantHouseRows.find((h) => String(h.id ?? "").trim() === invoiceHouseId);
    if (found?.name?.trim()) return false;
    return needsInvoiceHouseById && invoiceHouseByIdPending;
  }, [
    invoiceHouseId,
    mergedInvoice.houseName,
    needsInvoiceHouseById,
    invoiceHouseByIdPending,
    tenantHouseRows,
  ]);

  const invoiceHouseLabel = useMemo(() => {
    if (!invoiceHouseId) return "";
    const fromInv = String(mergedInvoice.houseName ?? "").trim();
    if (fromInv) return fromInv;
    const found = tenantHouseRows.find((h) => String(h.id ?? "").trim() === invoiceHouseId);
    const n = found?.name?.trim();
    if (n) return n;
    const fromHouseById =
      invoiceHouseByIdRes?.success && invoiceHouseByIdRes.data
        ? String(invoiceHouseByIdRes.data.name ?? "").trim()
        : "";
    if (fromHouseById) return fromHouseById;
    if (invoiceHouseLabelLoading) return "";
    return shortHouseIdForDisplay(invoiceHouseId);
  }, [
    mergedInvoice.houseName,
    invoiceHouseId,
    tenantHouseRows,
    invoiceHouseByIdRes,
    invoiceHouseLabelLoading,
  ]);

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  const formatInvoiceDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return formatTenantIssueDateTime(String(iso), locale);
  };

  const detailHeroTitle = useMemo(() => formatTenantInvoiceCardTitle(mergedInvoice, t), [mergedInvoice, t]);

  const payable = isTenantInvoicePayable(mergedInvoice.status);
  const normalizedSelectedHouseId = useMemo(
    () => String(selectedHouseIdFromStore ?? "").trim(),
    [selectedHouseIdFromStore]
  );
  const mandatorySelectedHouseInvoiceIds = useMemo(() => {
    if (!normalizedSelectedHouseId) return [] as string[];
    return rawInvoiceData
      .filter(
        (inv) =>
          isTenantInvoicePayable(inv.status) &&
          !isTenantRepairInvoiceFlow(inv) &&
          String(inv.houseId ?? "").trim() === normalizedSelectedHouseId
      )
      .map((inv) => String(inv.id ?? "").trim())
      .filter((id) => id.length > 0);
  }, [rawInvoiceData, normalizedSelectedHouseId]);

  const statusLabel = () => {
    const key = `tenant_invoice.status_${String(mergedInvoice.status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return mergedInvoice.status || "—";
  };

  const issueFlow = useMemo(
    () =>
      isTenantInvoiceIssueType(mergedInvoice) ||
      Boolean(String(mergedInvoice.issueTicketId ?? "").trim()) ||
      Boolean(String(mergedInvoice.issueId ?? "").trim()) ||
      Boolean(String(mergedInvoice.quoteId ?? "").trim()) ||
      (mergedInvoice.issueItems?.length ?? 0) > 0,
    [mergedInvoice]
  );

  const [issueQuotes, setIssueQuotes] = useState<IssueQuoteFromApi[]>([]);
  const [issueQuotesLoading, setIssueQuotesLoading] = useState(false);
  const [issueBannersCatalog, setIssueBannersCatalog] = useState<IssueBannerFromApi[]>([]);

  useEffect(() => {
    const row = invoiceDetailQuery.data?.invoice;
    if (row) setDetailInvoice(row);
  }, [invoiceDetailQuery.data]);

  useEffect(() => {
    let cancelled = false;
    const invId = String(invoice.id ?? "").trim();
    if (!invId) return;

    const detail = invoiceDetailQuery.data;
    if (!detail?.invoice) {
      setIssueQuotesLoading(invoiceDetailQuery.isFetching);
      if (invoiceDetailQuery.isFetched && !invoiceDetailQuery.isFetching && !detail) {
        setIssueQuotes([]);
        setIssueBannersCatalog([]);
      }
      return;
    }

    setIssueQuotesLoading(true);
    void (async () => {
      try {
        const payments = detail.payments ?? [];
        const inv = detail.invoice;

        const shouldIssueFlow =
          isTenantInvoiceIssueType(inv) ||
          Boolean(String(inv.issueTicketId ?? "").trim()) ||
          Boolean(String(inv.issueId ?? "").trim()) ||
          Boolean(String(inv.quoteId ?? "").trim()) ||
          (inv.issueItems?.length ?? 0) > 0;

        if (!shouldIssueFlow) {
          if (!cancelled) {
            setIssueQuotes([]);
            setIssueBannersCatalog([]);
          }
          return;
        }

        const tid =
          String(inv.issueId ?? "").trim() ||
          String(inv.issueTicketId ?? "").trim() ||
          String(invoice.issueTicketId ?? "").trim();
        let quotes: IssueQuoteFromApi[] = [];
        let ticketIdUsedForFetch: string | null = tid || null;

        const hasIssueItemsFromApi = (inv.issueItems?.length ?? 0) > 0;
        if (hasIssueItemsFromApi) {
          quotes = [];
        } else if (tid) {
          quotes = await getIssueQuotesByTicket(tid);
        } else if (String(inv.quoteId ?? "").trim()) {
          const qid = String(inv.quoteId).trim();
          try {
            quotes = await getIssueQuotesByTicket(qid);
            ticketIdUsedForFetch = qid;
          } catch {
            /* ignore */
          }
        } else if (payments.length > 0) {
          const tryId = String(payments[0]?.id ?? "").trim();
          if (tryId) {
            try {
              quotes = await getIssueQuotesByTicket(tryId);
              ticketIdUsedForFetch = tryId;
            } catch {
              /* ignore */
            }
          }
        }

        const items = inv.issueItems ?? [];
        const needBannerCatalog = items.some((x) => String(x.bannerId ?? "").trim());
        if (needBannerCatalog) {
          try {
            const b = await getIssueBanners();
            if (!cancelled) setIssueBannersCatalog(b);
          } catch {
            if (!cancelled) setIssueBannersCatalog([]);
          }
        } else if (!cancelled) {
          setIssueBannersCatalog([]);
        }

        logAllInvoicePaymentIdResolutions(invId, payments, tid || null, quotes, ticketIdUsedForFetch);

        if (!cancelled) setIssueQuotes(quotes);
      } catch {
        if (!cancelled) {
          setIssueQuotes([]);
          setIssueBannersCatalog([]);
        }
      } finally {
        if (!cancelled) setIssueQuotesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    invoice.id,
    invoice.issueTicketId,
    invoiceDetailQuery.data,
    invoiceDetailQuery.isFetched,
    invoiceDetailQuery.isFetching,
  ]);

  const issueQuoteForDisplay = useMemo(() => {
    if (!issueQuotes.length) return null;
    const approved = issueQuotes.find((q) => normalizeIssueQuoteStatus(q.status) === "APPROVED");
    if (approved) return approved;
    return (
      [...issueQuotes].sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        if (tb !== ta) return tb - ta;
        return String(a.id).localeCompare(String(b.id));
      })[0] ?? null
    );
  }, [issueQuotes]);

  const invoiceIssueItemsLines = useMemo((): InvoiceIssueItemFromApi[] => {
    const raw = mergedInvoice.issueItems;
    return Array.isArray(raw) && raw.length > 0 ? raw : [];
  }, [mergedInvoice.issueItems]);

  /** Luôn rỗng — tránh `ReferenceError` khi Metro/HMR còn chunk cũ tham chiếu tên biến này. */
  const quoteTicketBannerRows = useMemo(() => [] as { key: string; labelKey: string; id: string }[], []);
  void quoteTicketBannerRows;

  const issueQuoteDisplayTotal = useMemo(() => {
    if (invoiceIssueItemsLines.length > 0) {
      return invoiceIssueItemsLines.reduce((s, x) => s + Number(x.price ?? 0), 0);
    }
    return Number(issueQuoteForDisplay?.totalPrice ?? 0);
  }, [invoiceIssueItemsLines, issueQuoteForDisplay]);

  const hasIssueQuoteLines =
    invoiceIssueItemsLines.length > 0 ||
    Boolean(issueQuoteForDisplay?.items && issueQuoteForDisplay.items.length > 0);

  const formatIssueMoney = useCallback(
    (v: number) => formatVndDisplay(v, locale, t),
    [locale, t]
  );

  const openPay = useCallback(async () => {
    if (creatingLink) return;
    const invId = String(mergedInvoice.id ?? "").trim();
    if (!invId) return;
    /**
     * `selectedIds`: luồng **tiền nhà/cọc** (POST VNPay `invoiceIds`).
     * Hóa đơn sửa chữa: một `invId`; tiền nhà/cọc cùng căn có thể gộp thêm hóa đơn bắt buộc.
     */
    const selectedIds = isTenantRepairInvoiceFlow(mergedInvoice)
      ? [invId]
      : Array.from(new Set([invId, ...mandatorySelectedHouseInvoiceIds].filter(Boolean)));
    if (selectedIds.length === 0) return;
    setCreatingLink(true);
    try {
      /** Chỉ hóa đơn repair/ISSUE mới resolve `quoteId`; tiền nhà (`!isRepair`) không gọi API này — vẫn `invoiceIds` như cũ. */
      const isRepair = isTenantRepairInvoiceFlow(mergedInvoice);
      const repairQuoteId = isRepair
        ? (await resolveVnpayQuoteIdForRepairInvoice(mergedInvoice)) ?? ""
        : "";
      const useQuoteFlow = isRepair && Boolean(repairQuoteId);
      if (isRepair && !repairQuoteId) {
        CustomAlert.alert(
          t("tenant_payment.title"),
          t("tenant_payment.missing_quote_for_issue_vnpay"),
          [{ text: t("common.close") }],
          { type: "error" }
        );
        return;
      }
      const checkoutUrl = useQuoteFlow
        ? await createVnpayPaymentLink({ quoteId: repairQuoteId }, { appLanguage: i18n.language })
        : await createVnpayPaymentLink({ invoiceIds: selectedIds }, { appLanguage: i18n.language });
      navigation.navigate("VnpayCheckout", {
        checkoutUrl,
        afterSuccess: "invoiceList",
        ...(useQuoteFlow ? { vnpayUiContext: "repair_quote" as const } : { vnpayUiContext: "house_invoice" as const }),
      });
    } catch (e: unknown) {
      const msg = formatApiErrorForTenantAlert(e, t, "payment_link");
      CustomAlert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], { type: "error" });
    } finally {
      setCreatingLink(false);
    }
  }, [creatingLink, mergedInvoice, mandatorySelectedHouseInvoiceIds, i18n.language, navigation, t]);

  const isPaidVisual = !payable;
  const hasPaidSuccessAt = Boolean(mergedInvoice.paidAt && String(mergedInvoice.paidAt).trim());

  if (isTenantRepairInvoiceFlow(mergedInvoice) && !isTenantInvoiceIssueType(mergedInvoice)) {
    return (
      <View style={[styles.container, { justifyContent: "center", flex: 1, position: "relative" }]}>
        <RefreshLogoOverlay visible mode="page" />
      </View>
    );
  }

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
            <StackScreenTitleBadge numberOfLines={1}>{t("tenant_invoice.detail_title")}</StackScreenTitleBadge>
          </View>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t("tenant_invoice.detail_menu_a11y")}
            >
              <MaterialIcons name="more-vert" size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: (payable ? 120 : 32) + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailSummaryCard}>
          <View style={styles.detailSummaryBlock}>
            <View
              style={[
                styles.detailStatusPill,
                isPaidVisual ? styles.detailStatusPaidBg : styles.detailStatusUnpaidBg,
              ]}
            >
              <Text
                style={[
                  styles.detailStatusPillText,
                  isPaidVisual ? styles.detailStatusPaidText : styles.detailStatusUnpaidText,
                ]}
              >
                {statusLabel()}
              </Text>
            </View>
            <Text style={styles.detailInvoiceCode}>{detailHeroTitle}</Text>
            <Text style={styles.detailTotalHero}>
              {formatTenantInvoiceAmount(mergedInvoice.amount, mergedInvoice.currency, locale, t)}
            </Text>
          </View>
        </View>

        {invoiceHouseId ? (
          <View style={styles.detailNoticeCard}>
            <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_house")}</Text>
            {invoiceHouseLabelLoading ? (
              <View style={{ minHeight: 24, justifyContent: "center" }}>
                <RefreshLogoInline logoPx={18} showLabel={false} />
              </View>
            ) : (
              <Text style={styles.detailTimelineValue}>{invoiceHouseLabel}</Text>
            )}
            {invoiceHouseOutsideAccess ? (
              <Text style={[styles.accessMismatchNotice, { marginTop: 8 }]}>
                {t("tenant_access.house_not_owned_disclaimer")}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.detailTimelineCard}>
          <Text style={styles.detailTimelineProcessTitle}>
            {t("tenant_invoice.detail_timeline_process_title")}
          </Text>
          <View style={styles.detailTimelineRow}>
            <View style={styles.detailTimelineRail}>
              <View style={styles.detailTimelineIconBoxIssue}>
                <Icons.calendar size={22} color={neutral.slate700} />
              </View>
              <View style={styles.detailTimelineVLine} />
              <View
                style={
                  hasPaidSuccessAt
                    ? styles.detailTimelineIconBoxPaidSuccess
                    : styles.detailTimelineIconBoxPaidPending
                }
              >
                <MaterialIcons
                  name={hasPaidSuccessAt ? "check-circle" : "schedule"}
                  size={24}
                  color={hasPaidSuccessAt ? tenantInvoicePaidBadgeFg : neutral.textMuted}
                />
              </View>
            </View>
            <View style={styles.detailTimelineBody}>
              <View style={styles.detailTimelineBlock}>
                <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.detail_created_at_label")}</Text>
                <Text style={styles.detailTimelineValue}>
                  {mergedInvoice.createdAt
                    ? formatInvoiceDate(mergedInvoice.createdAt)
                    : mergedInvoice.issuedAt
                      ? formatInvoiceDate(mergedInvoice.issuedAt)
                      : "—"}
                </Text>
              </View>
              <View style={styles.detailTimelineBlock}>
                <Text style={styles.detailTimelineLabel}>
                  {t("tenant_invoice.detail_payment_success_at_label")}
                </Text>
                <Text
                  style={[
                    styles.detailTimelineValue,
                    !hasPaidSuccessAt && { fontWeight: "600", color: neutral.textMuted },
                  ]}
                >
                  {hasPaidSuccessAt
                    ? formatInvoiceDate(mergedInvoice.paidAt)
                    : t("tenant_invoice.detail_payment_success_pending")}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailTimelineDueSection}>
            <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_due")}</Text>
            <Text style={styles.detailTimelineValue}>
              {mergedInvoice.dueDate ? formatInvoiceDate(mergedInvoice.dueDate) : "—"}
            </Text>
          </View>
        </View>

        {issueFlow ? (
          <View style={styles.detailFeeCard}>
            <Text style={styles.detailFeeCardTitle}>{t("tenant_invoice.issue_quote_section_title")}</Text>
            {issueQuotesLoading ? (
              <View style={[styles.issueQuoteLoadingRow, { flexDirection: "column", alignItems: "flex-start" }]}>
                <RefreshLogoInline logoPx={20} showLabel />
              </View>
            ) : hasIssueQuoteLines ? (
              <>
                {invoiceIssueItemsLines.length > 0
                  ? invoiceIssueItemsLines.map((it) => {
                      const banner =
                        it.bannerId != null && String(it.bannerId).trim()
                          ? issueBannersCatalog.find((b) => b.id === String(it.bannerId).trim())
                          : undefined;
                      return (
                        <View key={it.id}>
                          <View style={styles.issueQuoteLineRow}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.issueQuoteLineName} numberOfLines={2}>
                                {it.itemName}
                              </Text>
                            </View>
                            <Text style={styles.issueQuoteLinePrice}>{formatIssueMoney(Number(it.price ?? 0))}</Text>
                          </View>
                          {banner ? (
                            <View style={styles.issueBannerCatalogRow}>
                              <Text style={styles.issueBannerCatalogName} numberOfLines={2}>
                                {t("tenant_invoice.issue_quote_banner_catalog")}: {banner.name}
                              </Text>
                              <Text style={styles.issueBannerCatalogPrice}>
                                {formatIssueMoney(Number(banner.currentPrice ?? 0))}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  : (issueQuoteForDisplay?.items ?? []).map((it) => (
                      <View key={it.id} style={styles.issueQuoteLineRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.issueQuoteLineName} numberOfLines={2}>
                            {it.itemName}
                          </Text>
                          {it.description != null && String(it.description).trim() !== "" ? (
                            <Text style={styles.issueQuoteLineDesc} numberOfLines={3}>
                              {String(it.description).trim()}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.issueQuoteLinePrice}>{formatIssueMoney(Number(it.price ?? 0))}</Text>
                      </View>
                    ))}
                <View style={styles.issueQuoteDivider} />
                <View style={styles.issueQuoteTotalRow}>
                  <Text style={styles.issueQuoteTotalLabel}>
                    {t("tenant_ticket_detail.quote_total_label")}
                  </Text>
                  <Text style={styles.issueQuoteTotalValue}>{formatIssueMoney(issueQuoteDisplayTotal)}</Text>
                </View>
              </>
            ) : (
              <Text style={styles.meta}>{t("tenant_invoice.issue_quote_empty")}</Text>
            )}
          </View>
        ) : null}

        <InvoicePaymentFlowSection invoiceId={mergedInvoice.id} />

        {!payable ? (
          <View style={styles.detailNoticeCard}>
            <Text style={[styles.meta, { textAlign: "center" }]}>{t("tenant_invoice.paid_no_action")}</Text>
          </View>
        ) : null}
      </ScrollView>

      {payable ? (
        <View style={[styles.detailFooter, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.detailPayButton, creatingLink && styles.payButtonDisabled]}
            onPress={openPay}
            activeOpacity={0.85}
            disabled={creatingLink}
          >
            {creatingLink ? (
              <RefreshLogoInline logoPx={20} />
            ) : (
              <>
                <FontAwesome5 name="money-bill-wave" size={20} color={neutral.surface} />
                <Text style={styles.detailPayButtonText}>{t("tenant_invoice.pay_this")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
