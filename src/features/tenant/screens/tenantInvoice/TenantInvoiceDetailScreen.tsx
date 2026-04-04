import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CustomAlert } from "../../../../shared/components/alert";
import { RootStackParamList } from "../../../../shared/types";
import { formatTenantInvoiceAmount, isTenantInvoicePayable } from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import Icons from "../../../../shared/theme/icon";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import { iotOfflineLabelColor, neutral } from "../../../../shared/theme/color";
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

type Props = NativeStackScreenProps<RootStackParamList, "TenantInvoiceDetail">;

type FeeLine = { key: string; label: string; amount: number };

export default function TenantInvoiceDetailScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { invoice } = route.params;
  const { houseId: mainHouseIdFromStore } = useAuthStore();
  const { data: rawInvoiceData = [] } = useTenantInvoices();
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

  const getInvoiceSubtitle = (inv: typeof invoice) => {
    const title = String(inv.title ?? "").trim();
    const id = String(inv.id ?? "").trim();
    if (title && title !== id) return title;
    const type = String(inv.type ?? "").trim();
    const period = String(inv.periodKey ?? "").trim();
    const fromParts = [type, period].filter((x) => x.length > 0).join(" - ");
    return fromParts || id || t("tenant_invoice.invoice_placeholder_title");
  };

  const payable = isTenantInvoicePayable(invoice.status);
  const normalizedMainHouseId = useMemo(
    () => String(mainHouseIdFromStore ?? "").trim(),
    [mainHouseIdFromStore]
  );
  const mandatoryMainInvoiceIds = useMemo(() => {
    if (!normalizedMainHouseId) return [] as string[];
    return rawInvoiceData
      .filter(
        (inv) =>
          isTenantInvoicePayable(inv.status) &&
          String(inv.houseId ?? "").trim() === normalizedMainHouseId
      )
      .map((inv) => String(inv.id ?? "").trim())
      .filter((id) => id.length > 0);
  }, [rawInvoiceData, normalizedMainHouseId]);

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
    const selectedIds = Array.from(
      new Set([invoice.id, ...mandatoryMainInvoiceIds].filter((id) => String(id ?? "").trim().length > 0))
    );
    if (selectedIds.length === 0) return;
    setCreatingLink(true);
    try {
      const checkoutUrl = await createVnpayPaymentLink(selectedIds, {
        appLanguage: i18n.language,
      });
      navigation.navigate("TenantRentPayment", {
        invoiceId: selectedIds[0] ?? invoice.id,
        invoiceIds: selectedIds,
        checkoutUrl,
        afterSuccess: "invoiceList",
      });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      const apiMsg = ax?.response?.data?.message;
      const msg =
        (typeof apiMsg === "string" && apiMsg.trim()) ||
        (typeof ax?.message === "string" ? ax.message : null) ||
        t("tenant_payment.link_error");
      CustomAlert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], { type: "error" });
    } finally {
      setCreatingLink(false);
    }
  }, [creatingLink, invoice.id, mandatoryMainInvoiceIds, i18n.language, navigation, t]);

  const statusUpper = String(invoice.status || "").toUpperCase();
  const isPaidVisual = !payable;

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
          <Text style={styles.detailInvoiceCode}>{getInvoiceSubtitle(invoice)}</Text>
          <Text style={styles.detailTotalHero}>
            {formatTenantInvoiceAmount(invoice.amount, invoice.currency, locale)}
          </Text>
        </View>

        <View style={styles.detailTimelineCard}>
          <View style={styles.detailTimelineRow}>
            <View style={styles.detailTimelineRail}>
              <View style={styles.detailTimelineIconBoxIssue}>
                <Icons.calendar size={22} color={neutral.slate700} />
              </View>
              <View style={styles.detailTimelineVLine} />
              <View style={styles.detailTimelineIconBoxDue}>
                <MaterialIcons name="event-busy" size={22} color={iotOfflineLabelColor} />
              </View>
            </View>
            <View style={styles.detailTimelineBody}>
              <View style={styles.detailTimelineBlock}>
                <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.detail_issued_label")}</Text>
                <Text style={styles.detailTimelineValue}>
                  {invoice.issuedAt ? formatInvoiceDate(invoice.issuedAt) : "—"}
                </Text>
              </View>
              <View style={styles.detailTimelineBlock}>
                <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_due")}</Text>
                <Text style={styles.detailTimelineValue}>
                  {invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : "—"}
                </Text>
              </View>
            </View>
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

        {String(statusUpper) === "PAID" && invoice.paidAt ? (
          <View style={[styles.detailTimelineCard, { marginTop: 4 }]}>
            <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_paid")}</Text>
            <Text style={styles.detailTimelineValue}>{formatInvoiceDate(invoice.paidAt)}</Text>
          </View>
        ) : null}

        {!payable ? (
          <Text style={[styles.meta, { textAlign: "center", marginTop: 20 }]}>{t("tenant_invoice.paid_no_action")}</Text>
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
