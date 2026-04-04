import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Platform,
  AppState,
  type AppStateStatus,
} from "react-native";
import WebView from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomAlert } from "../shared/components/alert";
import Login from "../features/screens/authentication/LoginScreen";
import OnBoarding from "../features/screens/onBoarding/onBoarding";
import { useAuthStore } from "../store/useAuthStore";
import {
  logoutKeycloak,
  getKeycloakRedirectUri,
  keycloakInAppNotifyAppRedirect,
  keycloakInAppUserDismissed,
} from "../shared/services/keycloakAuth";
import loginStyles from "../features/screens/authentication/loginStyles";
import { RootStackParamList } from "../shared/types";
import { TenantTabs } from "../shared/components/footerNavigator";
import CameraScreen from "../features/modal/camera/CameraScreen";
import TenantItemDescriptionScreen from "../features/tenant/screens/tenantItem/TenantItemDescription";
import TicketScreen from "../features/tenant/screens/tenantTicket/ticket";
import TenantTicketListScreen from "../features/tenant/screens/tenantTicket/tenantTicketList";
import TenantTicketDetailScreen from "../features/tenant/screens/tenantTicket/tenantTicketDetail";
import TenantQuestionListScreen from "../features/tenant/screens/tenantQuestion/tenantQuestionList";
import TenantQuestionDetailScreen from "../features/tenant/screens/tenantQuestion/tenantQuestionDetail";
import TenantHouseDescription from "../features/tenant/screens/tenantHouse/tenantHouseDescription";
import TenantRentPaymentScreen from "../features/tenant/screens/tenantPayment/TenantRentPaymentScreen";
import TenantInvoiceListScreen from "../features/tenant/screens/tenantInvoice/TenantInvoiceListScreen";
import TenantInvoiceDetailScreen from "../features/tenant/screens/tenantInvoice/TenantInvoiceDetailScreen";
import { brandPrimary } from "../shared/theme/color";
import { ensureTenantMainHouseSynced } from "../shared/services/userApi";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navStyles = StyleSheet.create({
  root: { flex: 1 },
  keycloakOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    zIndex: 99999,
    elevation: 99999,
    flexDirection: "column",
  },
  keycloakWebView: { flex: 1 },
});

const Navigation = () => {
  const { t } = useTranslation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const onboardedUsers = useAuthStore((state) => state.onboardedUsers);
  const keycloakSession = useAuthStore((state) => state.keycloakInAppSession);
  const queryClient = useQueryClient();
  const wasLoggedInRef = useRef(isLoggedIn);
  const loginEdgeHandledRef = useRef(isLoggedIn);

  const [isReady, setIsReady] = useState(false);
  const [isSyncingMainHouseOnLogin, setIsSyncingMainHouseOnLogin] = useState(false);

  const handleKeycloakWebViewRequest = useCallback((request: { url: string }) => {
    const redirectUri = getKeycloakRedirectUri();
    if (request.url.startsWith(redirectUri)) {
      void keycloakInAppNotifyAppRedirect(request.url);
      return false;
    }
    return true;
  }, []);

  // Kiểm tra xem User hiện tại đã xem Onboarding chưa
  const showOnboarding = isLoggedIn && user && !onboardedUsers.includes(user);
  // đọc state từ AsyncStorage vào store
  useEffect(() => {
    const rehydrate = async () => {
        if (useAuthStore.persist && useAuthStore.persist.hasHydrated) { //Middleware của Zustand giúp lưu state vào AsyncStorage (ổ cứng điện thoại).
             if (useAuthStore.persist.hasHydrated()) {
                 setIsReady(true);
             } else {
                 useAuthStore.persist.onFinishHydration(() => setIsReady(true));
             }
        } else {
             setTimeout(() => setIsReady(true), 500); 
        }
    };
    rehydrate();
  }, []);

  // Khi logout (kể cả do user bấm logout hay interceptor tự logout), dọn sạch cache React Query
  // để tránh user mới thấy dữ liệu phiên trước.
  useEffect(() => {
    const wasLoggedIn = wasLoggedInRef.current;
    if (wasLoggedIn && !isLoggedIn) {
      queryClient.clear();
    }
    wasLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn, queryClient]);

  // Tenant app: nếu có session cũ với role technical (persisted) → logout, thông báo, xóa Keycloak session
  useEffect(() => {
    if (!isReady) return;
    const state = useAuthStore.getState();
    if (state.isLoggedIn && state.role === "technical") {
      const idToken = state.idToken;
      useAuthStore.getState().logout();
      logoutKeycloak(idToken).catch(() => {});
      CustomAlert.alert(
        t("technical_blocked_title"),
        t("technical_blocked_message"),
        [{ text: t("common.close") }]
      );
    }
  }, [isReady, isLoggedIn, role, t]);

  // Đồng bộ nhà chính (GET /users/me + PUT /users/main-house khi cần) sau đăng nhập / mở lại app.
  useEffect(() => {
    if (!isReady || !isLoggedIn || role !== "tenant") return;
    void ensureTenantMainHouseSynced();
  }, [isReady, isLoggedIn, role, user]);

  // Mỗi lần tenant login mới: reset houseId, sync mainHouseId từ /users/me,
  // và giữ loading cho tới khi sync xong để không nháy nhà phụ cũ.
  useEffect(() => {
    if (!isReady) return;
    const prev = loginEdgeHandledRef.current;
    loginEdgeHandledRef.current = isLoggedIn;

    if (!prev && isLoggedIn && role === "tenant") {
      let cancelled = false;
      setIsSyncingMainHouseOnLogin(true);
      useAuthStore.getState().setHouseId(null);
      void ensureTenantMainHouseSynced().finally(() => {
        if (!cancelled) setIsSyncingMainHouseOnLogin(false);
      });
      return () => { cancelled = true; };
    }

    if (prev && !isLoggedIn) {
      setIsSyncingMainHouseOnLogin(false);
    }
  }, [isReady, isLoggedIn, role]);

  // Tenant nhiều nhà: khi quay lại app (sau thanh toán / đổi nhà chính trên BE) lấy lại mainHouseId → houseId trong store.
  useEffect(() => {
    if (!isReady || !isLoggedIn || role !== "tenant") return;
    const onChange = (next: AppStateStatus) => {
      if (next === "active") void ensureTenantMainHouseSynced();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [isReady, isLoggedIn, role]);

  // Android: cho phép bấm nút Back để đóng overlay Keycloak khi session cho phép đóng tay.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!keycloakSession?.allowManualClose) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      keycloakInAppUserDismissed();
      return true;
    });

    return () => subscription.remove();
  }, [keycloakSession]);

  if (!isReady) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {/* Hiển thị loading khi đang đọc state từ AsyncStorage vào store(cái vòng tròn xoay */}
              <ActivityIndicator size="large" color={brandPrimary} /> 
          </View>
      );
  }

  if (isLoggedIn && role === "tenant" && isSyncingMainHouseOnLogin) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={brandPrimary} />
      </View>
    );
  }

  return (
    <View style={navStyles.root}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            showOnboarding ? (
              <Stack.Screen name="OnBoarding" component={OnBoarding} />
            ) : (
              <>
                <Stack.Screen name="Main" component={TenantTabs} />
                <Stack.Screen
                  name="Camera"
                  component={CameraScreen}
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen
                  name="TenantItemDetail"
                  component={TenantItemDescriptionScreen}
                />
                <Stack.Screen
                  name="Ticket"
                  component={TicketScreen}
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen name="TenantTicketList" component={TenantTicketListScreen} />
                <Stack.Screen name="TenantTicketDetail" component={TenantTicketDetailScreen} />
                <Stack.Screen name="TenantQuestionList" component={TenantQuestionListScreen} />
                <Stack.Screen name="TenantQuestionDetail" component={TenantQuestionDetailScreen} />
                <Stack.Screen name="BuildingDetail" component={TenantHouseDescription} />
                <Stack.Screen name="TenantInvoiceList" component={TenantInvoiceListScreen} />
                <Stack.Screen name="TenantInvoiceDetail" component={TenantInvoiceDetailScreen} />
                <Stack.Screen
                  name="TenantRentPayment"
                  component={TenantRentPaymentScreen}
                  options={{ presentation: "modal" }}
                />
              </>
            )
          ) : (
            <Stack.Screen name="AuthLogin" component={Login} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {keycloakSession ? (
        <View style={navStyles.keycloakOverlay}>
          {keycloakSession.allowManualClose ? (
            <View style={loginStyles.webViewHeader}>
              <TouchableOpacity
                onPress={keycloakInAppUserDismissed}
                activeOpacity={0.7}
              >
                <Text style={loginStyles.webViewCloseText}>
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <WebView
            style={navStyles.keycloakWebView}
            source={{ uri: keycloakSession.url }}
            onShouldStartLoadWithRequest={handleKeycloakWebViewRequest}
            startInLoadingState
            renderLoading={() => (
              <View style={loginStyles.webViewLoadingOverlay}>
                <ActivityIndicator size="large" color={brandPrimary} />
                <Text
                  style={{ color: "#666", textAlign: "center", marginTop: 10 }}
                >
                  {t("common.loading")}
                </Text>
              </View>
            )}
          />
        </View>
      ) : null}
    </View>
  );
};

export default Navigation;
