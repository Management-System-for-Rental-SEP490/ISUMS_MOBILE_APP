import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../../../../shared/types";
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
import Icons from "../../../../shared/theme/icon";
import {
  isLikelyVnpayReturnNavigation,
  isVnpayReturnGatewaySuccess,
  validateVnpayReturnUrl,
} from "../../../../shared/services/tenantPaymentApi";
import { formatApiErrorForTenantAlert } from "../../../../shared/utils/apiErrorMessage";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
import { HOUSES_KEYS, TENANT_INVOICES_QUERY_KEY } from "../../../../shared/hooks";
import { dispatchAfterVnpaySuccess } from "../../../../shared/utils/tenantVnpayNavigation";
import { VnpayReturnResultView } from "./VnpayReturnResultView";

type Props = NativeStackScreenProps<RootStackParamList, "VnpayCheckout">;

type VnpayReturnUiState =
  | null
  | { kind: "confirming" }
  | { kind: "success" }
  | { kind: "verify_skipped" }
  | { kind: "failed" };

function extractPaymentReturnLogDetail(message: unknown, data: unknown): string | undefined {
  const parts: string[] = [];
  for (const x of [message, data]) {
    if (typeof x !== "string") continue;
    const s = x.trim();
    if (!s) continue;
    parts.push(s);
  }
  const joined = parts.join("\n").trim();
  return joined.length ? joined : undefined;
}

/**
 * WebView VNPay + màn kết quả in-app sau redirect (tiền nhà `invoiceIds`, báo giá sửa chữa `quoteId`).
 */
export default function TenantVnpayCheckoutScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
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
      setReturnUi({ kind: "confirming" });
      try {
        const payload = await validateVnpayReturnUrl(url);
        const detail = extractPaymentReturnLogDetail(payload.message, payload.data);
        const ok = Boolean(payload.success);
        if (ok) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
        }
        await new Promise((resolve) => setTimeout(resolve, 280));
        if (ok) {
          if (detail) {
            console.warn("[ISUMS][vnpay-return] Xác thực OK — nội dung máy chủ (chỉ log):", detail);
          }
          setReturnUi({ kind: "success" });
        } else {
          console.warn("[ISUMS][vnpay-return] success=false từ API:", { payload, detail });
          setReturnUi({ kind: "failed" });
        }
      } catch (e: unknown) {
        if (isVnpayReturnGatewaySuccess(url)) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
          await new Promise((resolve) => setTimeout(resolve, 280));
          console.warn(
            "[ISUMS][vnpay-return] Cổng 00 nhưng xác thực lỗi — hiển thị thành công gọn; chi tiết:",
            formatApiErrorForTenantAlert(e, t, "vnpay_return"),
            e
          );
          setReturnUi({ kind: "verify_skipped" });
          return;
        }

        handledVnpayReturnUrlsRef.current.delete(url);
        await new Promise((resolve) => setTimeout(resolve, 220));
        console.warn(
          "[ISUMS][vnpay-return] Lỗi xác thực (chỉ log):",
          formatApiErrorForTenantAlert(e, t, "vnpay_return"),
          e
        );
        setReturnUi({ kind: "failed" });
      }
    },
    [queryClient, t, vnpayCopyKeys]
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
          <StackScreenTitleBadge numberOfLines={1}>{t("tenant_payment.title")}</StackScreenTitleBadge>
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
    return (
      <View style={styles.screenRoot}>
        {headerStrip}
        <VnpayReturnResultView
          phase={phase}
          title={title}
          message={message}
          onPrimaryPress={onReturnResultPrimary}
          primaryLabel={primaryLabel}
          omitTopInset
        />
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      {headerStrip}
      <SafeAreaView style={styles.flex} edges={["bottom"]}>
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
