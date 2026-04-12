import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { CustomAlert } from "../../../../shared/components/alert";
import { RootStackParamList, TenantInvoiceFromApi } from "../../../../shared/types";
import {
  formatTenantInvoiceAmount,
  formatTenantInvoiceCardTitle,
  isTenantInvoicePayable,
} from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import { createVnpayPaymentLink } from "../../../../shared/services/tenantPaymentApi";
import Icons from "../../../../shared/theme/icon";
import { neutral } from "../../../../shared/theme/color";
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";
import {
  StackScreenTitleBadge,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import { tenantInvoiceStyles as styles } from "../tenantInvoice/tenantInvoiceStyles";
import { InvoicePaymentFlowSection } from "../tenantInvoice/InvoicePaymentFlowSection";

type Props = NativeStackScreenProps<RootStackParamList, "TenantIssueInvoice">;

/**
 * Chi tiết hóa đơn gắn ticket sửa chữa: tổng tiền + lịch sử các lượt thanh toán (VNPay, v.v.).
 */
export default function TenantIssueInvoiceScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const invoice = route.params.invoice;
  const [creatingLink, setCreatingLink] = React.useState(false);

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

  const payable = isTenantInvoicePayable(invoice.status);

  const statusLabel = () => {
    const key = `tenant_invoice.status_${String(invoice.status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return invoice.status || "—";
  };

  const titleDisplay = formatTenantInvoiceCardTitle(invoice, t);
  const isPaidVisual = !payable;

  const openPay = React.useCallback(async () => {
    if (creatingLink) return;
    const invId = String(invoice.id ?? "").trim();
    if (!invId) return;
    setCreatingLink(true);
    try {
      const checkoutUrl = await createVnpayPaymentLink(
        { invoiceIds: [invId] },
        { appLanguage: i18n.language }
      );
      navigation.navigate("VnpayCheckout", {
        checkoutUrl,
        afterSuccess: "invoiceList",
        vnpayUiContext: "repair_fee_invoice",
      });
    } catch (e: unknown) {
      const msg = formatApiErrorForTenantAlert(e, t, "payment_link");
      CustomAlert.alert(t("tenant_payment.title"), msg, [{ text: t("common.close") }], { type: "error" });
    } finally {
      setCreatingLink(false);
    }
  }, [creatingLink, invoice.id, i18n.language, navigation, t]);

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
              {t("tenant_issue_invoice.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <View style={stackScreenTitleSideSlotStyle} />
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
            <Text style={styles.detailInvoiceCode}>{titleDisplay}</Text>
            <Text style={styles.detailTotalHero}>
              {formatTenantInvoiceAmount(invoice.amount, invoice.currency, locale, t)}
            </Text>
          </View>
        </View>

        <View style={styles.detailTimelineCard}>
          <View style={styles.detailTimelineBlock}>
            <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_due")}</Text>
            <Text style={styles.detailTimelineValue}>
              {invoice.dueDate ? formatInvoiceDate(invoice.dueDate) : "—"}
            </Text>
          </View>
          {!payable && invoice.paidAt ? (
            <View style={[styles.detailTimelineBlock, { marginTop: 12 }]}>
              <Text style={styles.detailTimelineLabel}>{t("tenant_invoice.field_paid")}</Text>
              <Text style={styles.detailTimelineValue}>{formatInvoiceDate(invoice.paidAt)}</Text>
            </View>
          ) : null}
        </View>

        <InvoicePaymentFlowSection invoiceId={invoice.id} />
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
