import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CustomAlert } from "../../../../shared/components/alert";
import { RootStackParamList, TenantInvoiceFromApi, TenantTicketFromApi } from "../../../../shared/types";
import {
  formatTenantInvoiceAmount,
  formatTenantInvoiceCardTitle,
  isTenantInvoiceIssueType,
  isTenantInvoicePayable,
  isTenantRepairInvoiceFlow,
} from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import Icons from "../../../../shared/theme/icon";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { neutral, tenantInvoicePaidBadgeFg } from "../../../../shared/theme/color";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useHouseById, useTenantHouses, useTenantInvoices } from "../../../../shared/hooks";
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
import { fetchTenantInvoiceDetail } from "../../../../shared/services/tenantInvoiceApi";

type Props = NativeStackScreenProps<RootStackParamList, "TenantInvoiceDetail">;

const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];

export default function TenantInvoiceDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { invoice } = route.params;
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
  const { data: invoiceQueryData } = useTenantInvoices();
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

  useEffect(() => {
    let cancelled = false;
    const invId = String(invoice.id ?? "").trim();
    if (!invId) return;
    void (async () => {
      try {
        const detail = await fetchTenantInvoiceDetail(invId);
        if (!cancelled && detail?.invoice) {
          setDetailInvoice(detail.invoice);
        }
      } catch {
        /* giữ dữ liệu cũ nếu lỗi */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [invoice.id]);

  /**
   * ID ticket sửa chữa liên kết với hóa đơn này (dùng để điều hướng sang TenantTicketDetail).
   * Ưu tiên issueTicketId; fallback issueId nếu không có.
   */
  const issueTicketId = useMemo(
    () =>
      String(mergedInvoice.issueTicketId ?? mergedInvoice.issueId ?? "").trim(),
    [mergedInvoice.issueTicketId, mergedInvoice.issueId]
  );

  /**
   * Điều hướng sang TenantTicketDetail nếu có ticket ID, ngược lại mở TenantTicketList.
   * - Có ticket ID (issueTicketId | issueId): mở chi tiết ticket với stub tối thiểu;
   *   TenantTicketDetail tự fetch đầy đủ qua getTenantTicketById khi mount.
   * - Không có ticket ID (BE không trả về): mở danh sách ticket để user tự tìm.
   */
  const handleOpenTicketDetail = useCallback(() => {
    if (issueTicketId) {
      navigation.navigate("TenantTicketDetail", {
        ticket: {
          id: issueTicketId,
          tenantId: "",
          houseId: String(mergedInvoice.houseId ?? ""),
          assetId: "",
          assignedStaffId: null,
          slotId: null,
          type: "REPAIR",
          status: "CREATED",
          title: "",
          description: "",
          createdAt: String(mergedInvoice.createdAt ?? new Date().toISOString()),
        } as TenantTicketFromApi,
      });
    } else {
      navigation.navigate("TenantTicketList");
    }
  }, [issueTicketId, mergedInvoice.houseId, mergedInvoice.createdAt, navigation]);

  const openPay = useCallback(async () => {
    if (creatingLink) return;
    const invId = String(mergedInvoice.id ?? "").trim();
    if (!invId) return;
    /** Hóa đơn sửa chữa: chỉ một id; tiền nhà/cọc cùng căn có thể gộp với các hóa đơn bắt buộc khác. */
    const selectedIds = isTenantRepairInvoiceFlow(mergedInvoice)
      ? [invId]
      : Array.from(new Set([invId, ...mandatorySelectedHouseInvoiceIds].filter(Boolean)));
    if (selectedIds.length === 0) return;
    setCreatingLink(true);
    try {
      const checkoutUrl = await createVnpayPaymentLink(
        { invoiceIds: selectedIds },
        { appLanguage: i18n.language }
      );
      navigation.navigate("VnpayCheckout", {
        checkoutUrl,
        afterSuccess: "home",
        ...(isTenantRepairInvoiceFlow(mergedInvoice)
          ? { vnpayUiContext: "repair_fee_invoice" as const }
          : { vnpayUiContext: "house_invoice" as const }),
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
            <Text style={styles.meta}>{t("tenant_invoice.issue_quote_empty")}</Text>
            <TouchableOpacity
              style={[styles.detailPayButton, { marginTop: 14 }]}
              onPress={handleOpenTicketDetail}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Icons.invoice size={20} color={neutral.surface} />
              <Text style={styles.detailPayButtonText}>{t("tenant_invoice.view_ticket_detail_btn")}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
