import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import WebView, { type WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Icons from "../theme/icon";
import { brandPrimary, neutral } from "../theme/color";

/**
 * Result of an in-app VNPay payment session.
 *
 * `success` reflects {@code vnp_ResponseCode == "00"} — the canonical VNPay
 * success code. The full querystring is forwarded as `rawUrl` so the caller
 * can route to a specific result page or surface error reasons by code.
 */
export type InAppPaymentResult = {
  success: boolean;
  responseCode?: string;
  transactionStatus?: string;
  rawUrl: string;
};

type Props = {
  /** Whether the modal is shown — caller controls visibility. */
  visible: boolean;
  /** Signed VNPay payment URL returned by Payment-Service. */
  url: string | null;
  /** Optional title shown on the header (defaults to localised "Thanh toán"). */
  title?: string;
  /**
   * VNPay return URL the BE configured (e.g. {@code https://outsystem.isums.pro/payments/result}).
   * When the WebView navigates to a URL starting with this, we treat it as
   * payment completion and pop the modal. Defaulting here keeps callers
   * simple — only override if a non-default return URL is in play.
   */
  returnUrlPrefix?: string;
  /** User dismissed without completing — close + cleanup, no payment result. */
  onClose: () => void;
  /** VNPay redirected to the return URL — caller handles success/failure UX. */
  onPaymentResult: (result: InAppPaymentResult) => void;
};

const DEFAULT_RETURN_URL_PREFIX = "https://outsystem.isums.pro/payments/result";

/**
 * Parses VNPay's redirect URL and extracts the response/transaction codes.
 * Returns null when the URL doesn't look like a VNPay return — caller skips.
 */
function parseVnpayReturn(rawUrl: string): InAppPaymentResult | null {
  try {
    const parsed = new URL(rawUrl);
    const responseCode = parsed.searchParams.get("vnp_ResponseCode") ?? undefined;
    const transactionStatus = parsed.searchParams.get("vnp_TransactionStatus") ?? undefined;
    if (!responseCode && !transactionStatus) return null;
    return {
      success: responseCode === "00",
      responseCode,
      transactionStatus,
      rawUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Full-screen modal that hosts a VNPay payment session inside the app shell —
 * no external Custom Tabs / SFSafariViewController, no exposed URL bar.
 *
 * The header collapses the URL behind a single localised title ("Thanh toán
 * VNPay"); the WebView's own URL chrome stays hidden because we're driving
 * react-native-webview directly. When VNPay 302s to the configured return
 * URL we pop the modal and fire {@link Props.onPaymentResult} so the caller
 * can refresh subscription state / show a native success toast.
 *
 * Hardware-back on Android navigates the WebView (if it has history) before
 * closing the modal — avoids users getting kicked out mid-OTP.
 */
export default function InAppPaymentWebView({
  visible,
  url,
  title,
  returnUrlPrefix = DEFAULT_RETURN_URL_PREFIX,
  onClose,
  onPaymentResult,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const handledRef = useRef(false);

  // Reset session state when (re)opening — guards against stale handledRef
  // from a previous payment attempt blocking the next one.
  useEffect(() => {
    if (visible) {
      handledRef.current = false;
      setLoading(true);
      setCanGoBack(false);
    }
  }, [visible, url]);

  // Android hardware back: walk WebView history first, fall back to close.
  // VNPay's bank selection flow deep-links several pages, so blanket-close
  // would frustrate users mid-flow.
  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, canGoBack, onClose]);

  const handleNavStateChange = useCallback(
    (nav: WebViewNavigation) => {
      setCanGoBack(nav.canGoBack);
      if (handledRef.current) return;
      if (!nav.url || !nav.url.startsWith(returnUrlPrefix)) return;
      const result = parseVnpayReturn(nav.url);
      if (!result) return;
      handledRef.current = true;
      // Defer close until the React Native bridge has settled the nav event,
      // otherwise WebView may try to render the result page before unmount.
      setTimeout(() => onPaymentResult(result), 0);
    },
    [returnUrlPrefix, onPaymentResult]
  );

  // First-pass URL-based interception: catch the return URL before the
  // WebView loads it (saves a wasted page load and a flash of the partner
  // result page).
  const handleShouldStartLoad = useCallback(
    (request: { url: string }) => {
      if (!request.url || !request.url.startsWith(returnUrlPrefix)) return true;
      if (handledRef.current) return false;
      const result = parseVnpayReturn(request.url);
      if (!result) return true;
      handledRef.current = true;
      setTimeout(() => onPaymentResult(result), 0);
      return false;
    },
    [returnUrlPrefix, onPaymentResult]
  );

  const source = useMemo(() => (url ? { uri: url } : undefined), [url]);

  return (
    <Modal
      visible={visible && !!url}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.root}>
        <StatusBar
          translucent={Platform.OS === "android"}
          backgroundColor={brandPrimary}
          barStyle="light-content"
        />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
              } else {
                onClose();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t("common.back", "Quay lại")}
          >
            <Icons.chevronBack size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title ?? t("payment.in_app_title", "Thanh toán VNPay")}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {t("payment.in_app_subtitle", "Phiên giao dịch an toàn")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", "Đóng")}
          >
            <Icons.close size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.webBody}>
          {source ? (
            <WebView
              ref={webViewRef}
              source={source}
              style={{ flex: 1, backgroundColor: "#fff" }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onNavigationStateChange={handleNavStateChange}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              startInLoadingState={false}
              setSupportMultipleWindows={false}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              originWhitelist={["*"]}
            />
          ) : null}
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={brandPrimary} />
              <Text style={styles.loadingText}>
                {t("payment.in_app_loading", "Đang kết nối VNPay...")}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandPrimary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: brandPrimary,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 2,
  },
  webBody: {
    flex: 1,
    backgroundColor: "#fff",
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  loadingText: {
    marginTop: 12,
    color: neutral.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
});
