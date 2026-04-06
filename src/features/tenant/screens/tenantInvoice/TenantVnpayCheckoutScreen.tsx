import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { RootStackParamList } from "../../../../shared/types";
import { CustomAlert } from "../../../../shared/components/alert";
import {
  isLikelyVnpayReturnNavigation,
  validateVnpayReturnUrl,
} from "../../../../shared/services/tenantPaymentApi";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
import { HOUSES_KEYS, TENANT_INVOICES_QUERY_KEY } from "../../../../shared/hooks";
import { dispatchAfterVnpaySuccess } from "../../../../shared/utils/tenantVnpayNavigation";

type Props = NativeStackScreenProps<RootStackParamList, "VnpayCheckout">;

function isRawBackendPaymentToken(text: string): boolean {
  const s = text.trim();
  if (!s.length) return false;
  return /^[A-Z][A-Z0-9_]*$/.test(s);
}

function userFacingPaymentReturnBody(message: unknown, data: unknown): string | undefined {
  const parts: string[] = [];
  for (const x of [message, data]) {
    if (typeof x !== "string") continue;
    const s = x.trim();
    if (!s || isRawBackendPaymentToken(s)) continue;
    parts.push(s);
  }
  const joined = parts.join("\n\n").trim();
  return joined.length ? joined : undefined;
}

/**
 * WebView VNPay sau khi đã có `checkoutUrl` (tạo từ màn hóa đơn).
 */
export default function TenantVnpayCheckoutScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const checkoutUrl = String(route.params?.checkoutUrl ?? "").trim();
  const afterSuccess = route.params?.afterSuccess;
  const [isReturnProcessing, setIsReturnProcessing] = useState(false);
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
      setIsReturnProcessing(true);
      try {
        const payload = await validateVnpayReturnUrl(url);
        const body = userFacingPaymentReturnBody(payload.message, payload.data);
        const ok = Boolean(payload.success);
        if (ok) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: HOUSES_KEYS.tenant }),
          ]);
        }
        await new Promise((resolve) => setTimeout(resolve, 350));
        CustomAlert.alert(
          ok ? t("tenant_payment.return_success_title") : t("tenant_payment.return_failed_title"),
          body,
          [
            {
              text: t("common.close"),
              onPress: () => {
                if (!ok) {
                  setIsReturnProcessing(false);
                  return;
                }
                setIsNavigatingAfterSuccess(true);
                requestAnimationFrame(() => {
                  dispatchAfterVnpaySuccess(navigation, afterSuccess);
                });
              },
            },
          ],
          { type: ok ? "success" : "error" }
        );
      } catch (e: unknown) {
        handledVnpayReturnUrlsRef.current.delete(url);
        await new Promise((resolve) => setTimeout(resolve, 250));
        const ax = e as { message?: string; response?: { data?: { message?: string } } };
        const apiMsg = ax?.response?.data?.message;
        const raw =
          (typeof apiMsg === "string" && apiMsg.trim()) ||
          (typeof ax?.message === "string" ? ax.message.trim() : "") ||
          "";
        const msg =
          raw && !isRawBackendPaymentToken(raw)
            ? raw
            : t("tenant_payment.return_validate_error");
        CustomAlert.alert(t("tenant_payment.return_validate_error_title"), msg, [
          { text: t("common.close"), onPress: () => setIsReturnProcessing(false) },
        ], { type: "error" });
      }
    },
    [afterSuccess, navigation, queryClient, t]
  );

  if (!checkoutUrl) {
    return null;
  }

  if (isReturnProcessing || isNavigatingAfterSuccess) {
    return (
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={brandPrimary} />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.flex}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingWrap}>
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
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: neutral.canvasMuted },
  loadingWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: neutral.textSecondary, marginTop: 10 },
});
