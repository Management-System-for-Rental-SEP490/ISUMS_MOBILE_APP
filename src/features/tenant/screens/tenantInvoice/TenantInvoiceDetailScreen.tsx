import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
  isTenantInvoicePayable,
  isTenantRepairInvoiceFlow,
} from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import Icons from "../../../../shared/theme/icon";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { brandPrimary, neutral, tenantInvoicePaidBadgeFg } from "../../../../shared/theme/color";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useTenantInvoices } from "../../../../shared/hooks";
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
import { InvoicePaymentFlowSection } from "./InvoicePaymentFlowSection";

type Props = NativeStackScreenProps<RootStackParamList, "TenantInvoiceDetail">;

type FeeLine = { key: string; label: string; amount: number };

const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];

export default function TenantInvoiceDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { invoice } = route.params;

  useLayoutEffect(() => {
    if (isTenantRepairInvoiceFlow(invoice)) {
      navigation.replace("TenantIssueInvoice", { invoice });
    }
  }, [invoice, navigation]);
  const { houseId: selectedHouseIdFromStore } = useAuthStore();
  const { data: invoiceQueryData } = useTenantInvoices();
  const rawInvoiceData = invoiceQueryData ?? EMPTY_TENANT_INVOICES;
  const [creatingLink, setCreatingLink] = useState(false);

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

  const detailHeroTitle = useMemo(() => formatTenantInvoiceCardTitle(invoice, t), [invoice, t]);

  const payable = isTenantInvoicePayable(invoice.status);
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
    const key = `tenant_invoice.status_${String(invoice.status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return invoice.status || "—";
  };

  const feeLines = useMemo((): FeeLine[] => {
    const total = Number(invoice.amount ?? 0);
    const base = Number(invoice.baseAmount ?? 0);
    const penalty = Number(invoice.penaltyAmount ?? 0);
    const lines: FeeLine[] = [];
    if (base > 0.01) {
      lines.push({ key: "base", label: t("tenant_invoice.line_apartment_rent"), amount: base });
    }
    if (penalty > 0.01) {
      lines.push({ key: "penalty", label: t("tenant_invoice.field_penalty_amount"), amount: penalty });
    }
    const other = Math.max(0, total - base - penalty);
    if (other > 0.01) {
      const hasSplit = base > 0.01 || penalty > 0.01;
      lines.push({
        key: "service",
        label: hasSplit ? t("tenant_invoice.line_management_fee") : t("tenant_invoice.field_total_amount"),
        amount: other,
      });
    }
    if (lines.length === 0 && total > 0) {
      lines.push({ key: "total_only", label: t("tenant_invoice.field_total_amount"), amount: total });
    }
    return lines;
  }, [invoice.amount, invoice.baseAmount, invoice.penaltyAmount, t]);

  const openPay = useCallback(async () => {
    if (creatingLink) return;
    const invId = String(invoice.id ?? "").trim();
    if (!invId) return;
    /** Hóa đơn sửa chữa: chỉ một id; tiền nhà/cọc cùng căn có thể gộp với các hóa đơn bắt buộc khác. */
    const selectedIds = isTenantRepairInvoiceFlow(invoice)
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
        afterSuccess: "invoiceList",
        ...(isTenantRepairInvoiceFlow(invoice)
          ? { vnpayUiContext: "repair_fee_invoice" as const }
          : { vnpayUiContext: "house_invoice" as const }),
      });
    } catch (e: unknown) {
      const msg = formatApiErrorForTenantAlert(e, t, "payment_link");
      CustomAlert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], { type: "error" });
    } finally {
      setCreatingLink(false);
    }
  }, [creatingLink, invoice, mandatorySelectedHouseInvoiceIds, i18n.language, navigation, t]);

  const isPaidVisual = !payable;
  const hasPaidSuccessAt = Boolean(invoice.paidAt && String(invoice.paidAt).trim());

  if (isTenantRepairInvoiceFlow(invoice)) {
    return (
      <View style={[styles.container, { justifyContent: "center", flex: 1 }]}>
        <ActivityIndicator size="large" color={brandPrimary} />
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
              {formatTenantInvoiceAmount(invoice.amount, invoice.currency, locale)}
            </Text>
          </View>
        </View>

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
                  {invoice.createdAt
                    ? formatInvoiceDate(invoice.createdAt)
                    : invoice.issuedAt
                      ? formatInvoiceDate(invoice.issuedAt)
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
                    ? formatInvoiceDate(invoice.paidAt)
                    : t("tenant_invoice.detail_payment_success_pending")}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.detailTimelineDueSection}>
            <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_due")}</Text>
            <Text style={styles.detailTimelineValue}>
              {invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : "—"}
            </Text>
          </View>
        </View>

        {feeLines.length > 0 ? (
          <View style={styles.detailFeeCard}>
            <Text style={styles.detailFeeCardTitle}>{t("tenant_invoice.fee_breakdown_title")}</Text>
            {feeLines.map((line) => (
              <View key={line.key} style={styles.detailFeeRow}>
                <Text style={styles.detailFeeRowLabel}>{line.label}</Text>
                <Text style={styles.detailFeeRowValue}>
                  {formatTenantInvoiceAmount(line.amount, invoice.currency, locale)}
                </Text>
              </View>
            ))}
            <View style={styles.detailFeeDivider} />
            <View style={styles.detailFeeTotalRow}>
              <Text style={styles.detailFeeTotalLabel}>{t("tenant_invoice.total_combined")}</Text>
              <Text style={styles.detailFeeTotalValue}>
                {formatTenantInvoiceAmount(invoice.amount, invoice.currency, locale)}
              </Text>
            </View>
          </View>
        ) : null}

        <InvoicePaymentFlowSection invoiceId={invoice.id} />

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
              <ActivityIndicator size="small" color={neutral.surface} />
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
