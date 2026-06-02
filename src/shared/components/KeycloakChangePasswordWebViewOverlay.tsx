import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, BackHandler, Platform, Keyboard, StatusBar, Linking, StyleSheet } from "react-native";
import WebView, { WebViewMessageEvent, WebViewNavigation } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/useAuthStore";
import loginStyles from "../../features/screens/authentication/loginStyles";
import {
  getKeycloakRedirectUri,
  getKeycloakAcceptLanguageHeader,
  KEYCLOAK_WEBVIEW_HITBOX_REPAINT_JS,
  KEYCLOAK_WEBVIEW_VIEWPORT_HEIGHT_RESET_JS,
  finalizeChangePasswordOAuthRedirect,
  finalizeChangePasswordFromInfoPageSuccess,
  consumeFirstLoginAutoFill,
  hasPendingFirstLoginAutoFill,
  buildKeycloakAutoSubmitLoginJs,
  KEYCLOAK_CP_PAGE_DETECT_JS,
} from "../services/keycloakAuth";
import { RefreshLogoOverlay } from "./RefreshLogoOverlay";
import { useAndroidKeycloakWebViewSystemUi } from "../hooks/useAndroidKeycloakWebViewSystemUi";

function normalizeAuthCallbackUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.pathname.includes("expo-development-client")) {
      const nestedUrl = parsed.searchParams.get("url");
      if (nestedUrl) {
        return decodeURIComponent(nestedUrl);
      }
    }
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

/**
 * WebView toàn màn cho luồng đổi mật khẩu Keycloak (`kc_action=UPDATE_PASSWORD`), đồng bộ với LoginScreen.
 */
const KeycloakChangePasswordWebViewOverlay = () => {
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.keycloakInAppSession);
  const setKeycloakInAppSession = useAuthStore((s) => s.setKeycloakInAppSession);

  const [webViewPageLoading, setWebViewPageLoading] = useState(true);
  /**
   * Đã inject auto-fill chưa — tránh inject lại khi Keycloak redirect nội bộ
   * (e.g. page error → Keycloak login lại → onLoadEnd bắn thêm lần nữa).
   */
  const autoFillInjectedRef = useRef(false);
  /**
   * Cover loading trắng che toàn bộ WebView trong lúc auto-login + redirect.
   * Chỉ bật khi luồng first-login có credential auto-fill; tắt khi:
   *  - WebView báo đã tới trang đổi MK (postMessage page=change_password), hoặc
   *  - sai mật khẩu tạm (page=login + hasError) → để user thấy lỗi, hoặc
   *  - quá timeout an toàn (fallback, tránh kẹt màn trắng).
   */
  const [coverVisible, setCoverVisible] = useState(false);
  const [bottomPadding, setBottomPadding] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const hardResetPaddingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRedirect = useRef(false);
  const infoPageSuccessHandled = useRef(false);

  const active =
    session != null && session.flow === "change_password" && Platform.OS !== "web";

  useAndroidKeycloakWebViewSystemUi(Boolean(active));

  useEffect(() => {
    if (active) {
      setWebViewPageLoading(true);
      infoPageSuccessHandled.current = false;
      autoFillInjectedRef.current = false; // reset cho session mới
      // Bật cover chỉ khi có credential auto-fill (luồng first-login auto submit).
      // Nếu không có (vd. user mở đổi MK thủ công từ Settings) → không che, hiện luôn WebView.
      setCoverVisible(hasPendingFirstLoginAutoFill());
    } else {
      setCoverVisible(false);
    }
  }, [active, session?.url]);

  /**
   * Timeout an toàn: nếu sau 12s vẫn chưa nhận được tín hiệu trang đổi MK / lỗi
   * (mạng chậm, theme Keycloak custom đổi selector…) → tắt cover để user không kẹt màn trắng.
   */
  useEffect(() => {
    if (!coverVisible) return;
    const id = setTimeout(() => setCoverVisible(false), 12_000);
    return () => clearTimeout(id);
  }, [coverVisible]);

  const webViewSource = useMemo(() => {
    if (!session || session.flow !== "change_password") return undefined;
    return {
      uri: session.url,
      headers: {
        "Accept-Language": getKeycloakAcceptLanguageHeader(i18n.language),
      },
    };
  }, [session, i18n.language]);

  const closeWebViewOnRedirect = useCallback(
    (rawUrl: string) => {
      const redirectUri = getKeycloakRedirectUri();
      if (!rawUrl.startsWith(redirectUri)) {
        return false;
      }
      if (isProcessingRedirect.current) {
        return true;
      }
      isProcessingRedirect.current = true;
      const normalizedUrl = normalizeAuthCallbackUrl(rawUrl);
      setKeycloakInAppSession(null);
      void finalizeChangePasswordOAuthRedirect(normalizedUrl).finally(() => {
        isProcessingRedirect.current = false;
      });
      return true;
    },
    [setKeycloakInAppSession]
  );

  useEffect(() => {
    if (!active) return;

    const onUrl = (event: { url: string }) => {
      if (!useAuthStore.getState().keycloakInAppSession) return;
      const redirectUri = getKeycloakRedirectUri();
      const normalized = normalizeAuthCallbackUrl(event.url);
      if (normalized.startsWith(redirectUri)) {
        closeWebViewOnRedirect(normalized);
      }
    };

    const sub = Linking.addEventListener("url", onUrl);
    return () => sub.remove();
  }, [active, closeWebViewOnRedirect]);

  useEffect(() => {
    if (!active) {
      if (hardResetPaddingTimerRef.current) {
        clearTimeout(hardResetPaddingTimerRef.current);
        hardResetPaddingTimerRef.current = null;
      }
      setBottomPadding(0);
    }
  }, [active]);

  useEffect(() => {
    if (!active || Platform.OS !== "android") return;

    const onKeyboardDidHide = () => {
      if (hardResetPaddingTimerRef.current) {
        clearTimeout(hardResetPaddingTimerRef.current);
        hardResetPaddingTimerRef.current = null;
      }

      webViewRef.current?.injectJavaScript(KEYCLOAK_WEBVIEW_VIEWPORT_HEIGHT_RESET_JS);
      webViewRef.current?.injectJavaScript(KEYCLOAK_WEBVIEW_HITBOX_REPAINT_JS);

      setBottomPadding(1);
      hardResetPaddingTimerRef.current = setTimeout(() => {
        setBottomPadding(0);
        hardResetPaddingTimerRef.current = null;
      }, 50);
    };

    const sub = Keyboard.addListener("keyboardDidHide", onKeyboardDidHide);
    return () => {
      sub.remove();
      if (hardResetPaddingTimerRef.current) {
        clearTimeout(hardResetPaddingTimerRef.current);
        hardResetPaddingTimerRef.current = null;
      }
    };
  }, [active]);

  useEffect(() => {
    if (!active || Platform.OS !== "android") return;
    const onHardwareBack = () => {
      setKeycloakInAppSession(null);
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
    return () => subscription.remove();
  }, [active, setKeycloakInAppSession]);

  const handleWebViewRequest = useCallback(
    (request: { url: string }) => {
      const handled = closeWebViewOnRedirect(request.url);
      return !handled;
    },
    [closeWebViewOnRedirect]
  );

  const handleNavStateChange = useCallback(
    (navState: WebViewNavigation) => {
      closeWebViewOnRedirect(navState.url);
    },
    [closeWebViewOnRedirect]
  );

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      if (!useAuthStore.getState().keycloakInAppSession) return;
      let data: { type?: string; page?: string; hasError?: boolean };
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return; // ignore non-JSON
      }

      // Tín hiệu phát hiện loại trang — quyết định khi nào tắt cover loading.
      if (data?.type === "isums_kc_page") {
        if (data.page === "change_password") {
          // Đã tới form đổi MK → tắt cover, hiện form thật cho user.
          setCoverVisible(false);
        } else if (data.page === "login" && data.hasError) {
          // Sai mật khẩu tạm → tắt cover để user thấy lỗi & nhập lại.
          setCoverVisible(false);
        }
        // page="login" (no error) / "other" → giữ cover, auto-submit đang chạy.
        return;
      }

      if (infoPageSuccessHandled.current) return;
      if (data?.type === "isums_kc_info_success") {
        infoPageSuccessHandled.current = true;
        setKeycloakInAppSession(null);
        finalizeChangePasswordFromInfoPageSuccess();
      }
    },
    [setKeycloakInAppSession]
  );

  if (!active || !webViewSource) {
    return null;
  }

  return (
    <View style={loginStyles.webViewOverlay} collapsable={false}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Banner giải thích — cover loading đã che bước auto-login phía trước,
          khi banner này lộ ra thì user đang ở form đổi mật khẩu. */}
      <View style={overlayStyles.banner}>
        <Text style={overlayStyles.bannerTitle}>
          {t("login_first_change_password_title", "Đổi mật khẩu lần đầu")}
        </Text>
        <Text style={overlayStyles.bannerSub}>
          {session?.username
            ? t("login_first_change_password_sub_with_user",
                "Đặt mật khẩu mới để kích hoạt tài khoản {{username}}",
                { username: session.username }
              )
            : t("login_first_change_password_sub",
                "Đặt mật khẩu mới để kích hoạt tài khoản"
              )
          }
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          overflow: "hidden",
          paddingBottom: bottomPadding,
        }}
      >
        <WebView
          ref={webViewRef}
          style={{ flex: 1, backgroundColor: "transparent" }}
          containerStyle={{ flex: 1, backgroundColor: "transparent" }}
          contentInsetAdjustmentBehavior="never"
          source={webViewSource}
          onShouldStartLoadWithRequest={handleWebViewRequest}
          onNavigationStateChange={handleNavStateChange}
          onMessage={handleWebViewMessage}
          onLoadStart={() => setWebViewPageLoading(true)}
          onLoadEnd={() => {
            setWebViewPageLoading(false);
            // Báo loại trang hiện tại về RN (mỗi lần load) → quyết định tắt cover.
            webViewRef.current?.injectJavaScript(KEYCLOAK_CP_PAGE_DETECT_JS);
            // Tự động điền + submit form đăng nhập Keycloak — chỉ 1 lần đầu.
            // consumeFirstLoginAutoFill() trả null nếu đã dùng rồi hoặc không có.
            if (!autoFillInjectedRef.current) {
              const creds = consumeFirstLoginAutoFill();
              if (creds) {
                autoFillInjectedRef.current = true;
                const js = buildKeycloakAutoSubmitLoginJs(creds.username, creds.password);
                webViewRef.current?.injectJavaScript(js);
              }
            }
          }}
          startInLoadingState={false}
          setSupportMultipleWindows={false}
          nestedScrollEnabled
          scrollEnabled
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView
          scalesPageToFit={false}
          androidLayerType="hardware"
          overScrollMode="never"
        />
        {webViewPageLoading ? (
          <View style={loginStyles.webViewLoadingOverlay} pointerEvents="none">
            <RefreshLogoOverlay visible mode="page" />
          </View>
        ) : null}
      </View>

      {/* Cover trắng che TOÀN BỘ (banner + WebView) trong lúc auto-login + redirect.
          pointerEvents="auto" chặn user chạm vào trang login phía dưới.
          Tắt khi WebView báo đã tới trang đổi MK / lỗi / timeout. */}
      {coverVisible ? (
        <View style={overlayStyles.fullCover} pointerEvents="auto">
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : null}
    </View>
  );
};

const overlayStyles = StyleSheet.create({
  /** Cover trắng full-screen che WebView trong lúc auto-login + redirect */
  fullCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },
  /** Banner phía trên WebView giải thích mục đích màn hình */
  banner: {
    backgroundColor: "#1A6B4A",   // màu brandPrimary tối hơn để tương phản với WebView
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 4,
  },
  bannerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
});

export default KeycloakChangePasswordWebViewOverlay;
