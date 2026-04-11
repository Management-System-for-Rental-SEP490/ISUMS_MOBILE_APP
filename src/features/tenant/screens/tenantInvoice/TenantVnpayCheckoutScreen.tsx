import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../../../../shared/types";
import {
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import Icons from "../../../../shared/theme/icon";
import {
  isLikelyVnpayReturnNavigation,
  isVnpayReturnGatewaySuccess,
  parseVnpayReturnUrlForDisplay,
  type VnpayReturnUrlDisplayFields,
  validateVnpayReturnUrl,
} from "../../../../shared/services/tenantPaymentApi";
import { formatVndDisplay } from "../../../../shared/utils/currencyFormat";
import { formatVnpPayDateFromGateway } from "../../../../shared/utils/dateTimeFormat";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils/typography";
import { HOUSES_KEYS, TENANT_INVOICES_QUERY_KEY } from "../../../../shared/hooks";
import { dispatchAfterVnpaySuccess } from "../../../../shared/utils/tenantVnpayNavigation";
import { VnpayReturnResultView, type VnpayReturnDetailRow } from "./VnpayReturnResultView";

type Props = NativeStackScreenProps<RootStackParamList, "VnpayCheckout">;

type VnpayReturnUiState =
  | null
  | { kind: "confirming" }
  | { kind: "success"; fields: VnpayReturnUrlDisplayFields }
  | { kind: "verify_skipped"; fields: VnpayReturnUrlDisplayFields }
  | { kind: "failed"; fields: VnpayReturnUrlDisplayFields };

function buildVnpayReturnDetailRows(
  fields: VnpayReturnUrlDisplayFields,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string
): VnpayReturnDetailRow[] {
  const rows: VnpayReturnDetailRow[] = [];
  if (fields.amountVnd != null && Number.isFinite(fields.amountVnd)) {
    rows.push({
      label: t("tenant_payment.return_detail_amount"),
      value: formatVndDisplay(fields.amountVnd, locale, t),
    });
  }
  const payFmt = fields.payDateRaw ? formatVnpPayDateFromGateway(fields.payDateRaw, locale) : null;
  if (payFmt) {
    rows.push({ label: t("tenant_payment.return_detail_pay_time"), value: payFmt });
  }
  const pushStr = (labelKey: string, val: string | null | undefined) => {
    const v = typeof val === "string" ? val.trim() : "";
    if (v) rows.push({ label: t(labelKey), value: v });
  };
  pushStr("tenant_payment.return_detail_order_info", fields.orderInfo);
  pushStr("tenant_payment.return_detail_transaction_no", fields.transactionNo);
  pushStr("tenant_payment.return_detail_bank", fields.bankCode);
  pushStr("tenant_payment.return_detail_card_type", fields.cardType);
  const code = fields.responseCode?.trim() ?? "";
  if (code) {
    const value =
      code === "00" ? t("tenant_payment.return_detail_response_success") : code;
    rows.push({ label: t("tenant_payment.return_detail_status"), value });
  }
  return rows;
}

/**
 * WebView VNPay + màn kết quả in-app sau redirect (tiền nhà `invoiceIds`, báo giá sửa chữa `quoteId`).
 */
export default function TenantVnpayCheckoutScreen({ navigation, route }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const checkoutUrl = String(route.params?.checkoutUrl ?? "").trim();
  const afterSuccess = route.params?.afterSuccess;
  const ticketForAfterSuccess = route.params?.ticketForAfterSuccess;
  const vnpayUiContext = route.params?.vnpayUiContext;

  const vnpayCopyKeys = useMemo(() => {
    if (vnpayUiContext === "house_invoice") {
      return {
        successSubtitle: "tenant_payment.return_ui_success_subtitle_house",
        verifySkippedSubtitle: "tenant_payment.return_ui_verify_skipped_subtitle_house",
      } as const;
    }
    return {
      successSubtitle: "tenant_payment.return_ui_success_subtitle",
      verifySkippedSubtitle: "tenant_payment.return_ui_verify_skipped_subtitle",
    } as const;
  }, [vnpayUiContext]);

  const [returnUi, setReturnUi] = useState<VnpayReturnUiState>(null);
  const [isNavigatingAfterSuccess, setIsNavigatingAfterSuccess] = useState(false);
  const handledVnpayReturnUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!checkoutUrl) {
      navigation.goBack();
    }
  }, [checkoutUrl, navigation]);

  useEffect(() => {
    handledVnpayReturnUrlsRef.current = new Set();
  }, [checkoutUrl]);

  const processVnpayReturnIfNeeded = useCallback(
    async (url: string) => {
      if (!isLikelyVnpayReturnNavigation(url)) return;
      if (handledVnpayReturnUrlsRef.current.has(url)) return;
      handledVnpayReturnUrlsRef.current.add(url);
      const fields = parseVnpayReturnUrlForDisplay(url);
      setReturnUi({ kind: "confirming" });
      try {
        const payload = await validateVnpayReturnUrl(url);
        const ok = Boolean(payload.success);
        if (ok) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
        }
        await new Promise((resolve) => setTimeout(resolve, 280));
        if (ok) {
          setReturnUi({ kind: "success", fields });
        } else {
          setReturnUi({ kind: "failed", fields });
        }
      } catch {
        if (isVnpayReturnGatewaySuccess(url)) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
          await new Promise((resolve) => setTimeout(resolve, 280));
          setReturnUi({ kind: "verify_skipped", fields });
          return;
        }

        handledVnpayReturnUrlsRef.current.delete(url);
        await new Promise((resolve) => setTimeout(resolve, 220));
        setReturnUi({ kind: "failed", fields });
      }
    },
    [queryClient]
  );

  const onReturnResultPrimary = useCallback(() => {
    if (!returnUi || returnUi.kind === "confirming") return;
    if (returnUi.kind === "failed") {
      setReturnUi(null);
      return;
    }
    setReturnUi(null);
    setIsNavigatingAfterSuccess(true);
    requestAnimationFrame(() => {
      dispatchAfterVnpaySuccess(navigation, afterSuccess, ticketForAfterSuccess);
    });
  }, [afterSuccess, navigation, returnUi, ticketForAfterSuccess]);

  const headerStrip = (
    <StackScreenTitleHeaderStrip>
      <View style={stackScreenTitleRowStyle}>
        <View style={stackScreenTitleSideSlotStyle}>
          <TouchableOpacity
            style={stackScreenTitleBackBtnOnBrand}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
          </TouchableOpacity>
        </View>
        <View style={stackScreenTitleCenterSlotStyle}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t("tenant_payment.title")}
          </Text>
        </View>
        <View style={stackScreenTitleSideSlotStyle}>
          <StackScreenTitleBarBalance />
        </View>
      </View>
    </StackScreenTitleHeaderStrip>
  );

  if (!checkoutUrl) {
    return null;
  }

  if (isNavigatingAfterSuccess) {
    return (
      <View style={styles.screenRoot}>
        {headerStrip}
        <SafeAreaView style={styles.flex} edges={["bottom"]}>
          <View style={styles.loadingBody}>
            <ActivityIndicator size="large" color={brandPrimary} />
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (returnUi) {
    let phase: "confirming" | "success" | "verify_skipped" | "failed" = "confirming";
    let title = "";
    let message: string | undefined;
    if (returnUi.kind === "confirming") {
      phase = "confirming";
      title = t("tenant_payment.return_confirming_title");
      message = undefined;
    } else if (returnUi.kind === "success") {
      phase = "success";
      title = t("tenant_payment.return_success_title");
      message = t(vnpayCopyKeys.successSubtitle);
    } else if (returnUi.kind === "verify_skipped") {
      phase = "verify_skipped";
      title = t("tenant_payment.return_success_title");
      message = t(vnpayCopyKeys.verifySkippedSubtitle);
    } else {
      phase = "failed";
      title = t("tenant_payment.return_ui_problem_title");
      message = t("tenant_payment.return_ui_problem_subtitle");
    }
    const primaryLabel =
      returnUi.kind === "failed"
        ? t("common.close")
        : t("tenant_payment.return_result_done");
    const detailRows =
      returnUi.kind === "confirming"
        ? undefined
        : buildVnpayReturnDetailRows(returnUi.fields, t, i18n.language);
    return (
      <View style={styles.screenRoot}>
        {headerStrip}
        <VnpayReturnResultView
          phase={phase}
          title={title}
          message={message}
          detailSectionTitle={t("tenant_payment.return_detail_heading")}
          detailRows={detailRows}
          onPrimaryPress={onReturnResultPrimary}
          primaryLabel={primaryLabel}
          omitTopInset
        />
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="dark-content" backgroundColor={neutral.surface} />
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <WebView
          source={{ uri: checkoutUrl }}
          style={styles.flex}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webLoadingOverlay}>
              <ActivityIndicator size="large" color={brandPrimary} />
            </View>
          )}
        injectedJavaScriptBeforeContentLoaded={`
            (function() {
              function hideTestOrderInfo() {
                try {
                  var nodes = document.querySelectorAll('*');
                  for (var i = 0; i < nodes.length; i++) {
                    var text = (nodes[i].textContent || '').trim();
                    if (!text) continue;
                    if (text.indexOf('(Test)') >= 0 && text.length < 240) {
                      nodes[i].style.display = 'none';
                    }
                  }
                } catch (e) {}
              }
              hideTestOrderInfo();
              setTimeout(hideTestOrderInfo, 400);
              setTimeout(hideTestOrderInfo, 1200);
            })();
            true;
          `}
        onShouldStartLoadWithRequest={(req) => {
          const url = req.url;
          if (!isLikelyVnpayReturnNavigation(url)) return true;
          void processVnpayReturnIfNeeded(url);
          return false;
        }}
        onNavigationStateChange={(nav) => {
          void processVnpayReturnIfNeeded(nav.url);
        }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    ...appTypography.listTitle,
    fontWeight: "600",
    color: neutral.surface,
    textAlign: "center",
  },
  screenRoot: { flex: 1, backgroundColor: neutral.background },
  flex: { flex: 1, backgroundColor: neutral.background },
  loadingBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.background,
  },
  webLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: neutral.background,
  },
  loadingText: { color: neutral.textSecondary, marginTop: 10 },
});
