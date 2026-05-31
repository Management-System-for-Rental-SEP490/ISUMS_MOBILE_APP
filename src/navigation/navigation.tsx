import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, AppState, type AppStateStatus } from "react-native";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { navigationRef } from "./navigationRef";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomAlert } from "../shared/components/alert";
import Login from "../features/screens/authentication/LoginScreen";
import LoginFormScreen from "../features/screens/authentication/LoginFormScreen";
import OnBoarding from "../features/screens/onBoarding/onBoarding";
import { useAuthStore } from "../store/useAuthStore";
import { logoutKeycloak } from "../shared/services/keycloakAuth";
import { RootStackParamList } from "../shared/types";
import HomeScreen from "../features/tenant/screens/tenantHome/HomeScreen";
import CameraScreen from "../features/modal/camera/CameraScreen";
import TenantItemDescriptionScreen from "../features/tenant/screens/tenantItem/TenantItemDescription";
import TicketScreen from "../features/tenant/screens/tenantTicket/ticket";
import TenantTicketListScreen from "../features/tenant/screens/tenantTicket/tenantTicketList";
import TenantTicketDetailScreen from "../features/tenant/screens/tenantTicket/tenantTicketDetail";
import TenantQuestionListScreen from "../features/tenant/screens/tenantQuestion/tenantQuestionList";
import TenantQuestionDetailScreen from "../features/tenant/screens/tenantQuestion/tenantQuestionDetail";
import TenantHouseDescription from "../features/tenant/screens/tenantHouse/tenantHouseDescription";
import TenantInvoiceListScreen from "../features/tenant/screens/tenantInvoice/TenantInvoiceListScreen";
import TenantInvoiceDetailScreen from "../features/tenant/screens/tenantInvoice/TenantInvoiceDetailScreen";
import TenantIssueInvoiceScreen from "../features/tenant/screens/tenantTicket/tenantIssueInvoice";
import TenantVnpayCheckoutScreen from "../features/tenant/screens/tenantInvoice/TenantVnpayCheckoutScreen";
import { RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";
import { neutral } from "../shared/theme/color";
import { ensureTenantMainHouseSynced } from "../shared/services/userApi";
import KeycloakChangePasswordWebViewOverlay from "../shared/components/KeycloakChangePasswordWebViewOverlay";
import NotificationScreen from "../features/tenant/screens/tenantNotification/NotificationScreen";
import UserProfileScreen from "../features/screens/user/UserProfileScreen";
import UserContractDetailScreen from "../features/screens/user/userContractDetail";
import SettingsScreen from "../features/screens/settings/SettingsScreen";
import NotificationPreferencesScreen from "../features/tenant/screens/notificationPreferences/NotificationPreferencesScreen";
import VoiceCallHistoryScreen from "../features/tenant/screens/notificationPreferences/VoiceCallHistoryScreen";
import ConsumptionScreen from "../features/tenant/screens/tenantConsumption/ConsumptionScreen";
import SmartHomeScreen from "../features/tenant/screens/tenantConsumption/v2/SmartHomeScreen";
import IotAlertDetailScreen from "../features/tenant/screens/tenantNotification/IotAlertDetailScreen";
import { useSetupIotNotifications } from "../features/tenant/components/IotPushAlertOverlay";
import { TenantIotAlertOverlay } from "../features/tenant/components/TenantIotAlertOverlay";
import { useNotificationDeviceTokenLifecycle } from "../shared/hooks/useNotificationDeviceTokenLifecycle";
import {
  APP_BACKGROUND_SOFT_INVALIDATE_DELAY_MS,
  isIssueTicketStaffOrTenantListQueryKey,
} from "../shared/api/config";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navStyles = StyleSheet.create({
  root: { flex: 1 },
});

const Navigation = () => {
  const { t } = useTranslation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const onboardedUsers = useAuthStore((state) => state.onboardedUsers);
  const queryClient = useQueryClient();
  const wasLoggedInRef = useRef(isLoggedIn);
  const loginEdgeHandledRef = useRef(isLoggedIn);

  const [isReady, setIsReady] = useState(false);
  const [isSyncingMainHouseOnLogin, setIsSyncingMainHouseOnLogin] = useState(false);

  useSetupIotNotifications();

  /** Đăng ký / hủy FCM token nghiệp vụ khi tenant đăng nhập — tôn trọng EXPO_PUBLIC_NOTIFICATION_DEVICE_TOKEN_ENABLED. */
  useNotificationDeviceTokenLifecycle(Boolean(isLoggedIn && role === "tenant"));

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

  /**
   * Làm mới cache nền sau mở app (không refetch hai query danh sách ticket tenant — poll/tay riêng).
   */
  useEffect(() => {
    if (!isReady || !isLoggedIn || role !== "tenant") return;
    const id = setTimeout(() => {
      void queryClient.invalidateQueries({
        predicate: (q) => !isIssueTicketStaffOrTenantListQueryKey(q.queryKey as readonly unknown[]),
      });
    }, APP_BACKGROUND_SOFT_INVALIDATE_DELAY_MS);
    return () => clearTimeout(id);
  }, [isReady, isLoggedIn, role, queryClient]);

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

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: neutral.background,
        }}
      >
        <RefreshLogoOverlay visible mode="page" />
      </View>
    );
  }

  if (isLoggedIn && role === "tenant" && isSyncingMainHouseOnLogin) {
    return (
      <View
        style={{
          flex: 1,
          position: "relative",
          backgroundColor: neutral.background,
        }}
      >
        <RefreshLogoOverlay visible mode="page" />
      </View>
    );
  }

  return (
    <View style={navStyles.root}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            /**
             * Android: `edgeToEdgeEnabled` trong app.json — không truyền statusBarTranslucent /
             * navigationBar* vào screen options (bị bỏ qua và cảnh báo bởi react-native-edge-to-edge).
             * Nội dung sau system bars: SafeArea + `<StatusBar />` trên từng màn.
             */
          }}
        >
          {isLoggedIn ? (
            showOnboarding ? (
              <Stack.Screen
                name="OnBoarding"
                component={OnBoarding}
                options={{
                  /** Gradient tối → icon status bar sáng (màu nền/status translucent do edge-to-edge quản lý). */
                  statusBarStyle: "light",
                }}
              />
            ) : (
              <>
                <Stack.Screen name="Main" component={HomeScreen} />
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
                <Stack.Screen name="TenantIssueInvoice" component={TenantIssueInvoiceScreen} />
                <Stack.Screen
                  name="VnpayCheckout"
                  component={TenantVnpayCheckoutScreen}
                  options={{ presentation: "modal" }}
                />
                <Stack.Screen name="ConsumptionScreen" component={ConsumptionScreen} />
                <Stack.Screen name="SmartHomeScreen" component={SmartHomeScreen} />
                <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
                <Stack.Screen name="IotAlertDetail" component={IotAlertDetailScreen} />
                <Stack.Screen name="ProfileScreen" component={UserProfileScreen} />
                <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
                <Stack.Screen
                  name="NotificationPreferencesScreen"
                  component={NotificationPreferencesScreen}
                  options={{ title: "Cài đặt thông báo" }}
                />
                <Stack.Screen
                  name="VoiceCallHistoryScreen"
                  component={VoiceCallHistoryScreen}
                  options={{ title: "Lịch sử cuộc gọi" }}
                />
                <Stack.Screen name="UserContractDetail" component={UserContractDetailScreen} />
              </>
            )
          ) : (
            <>
              <Stack.Screen name="AuthLogin" component={Login} />
              <Stack.Screen name="AuthLoginForm" component={LoginFormScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isLoggedIn && role === "tenant" && !showOnboarding ? <TenantIotAlertOverlay /> : null}
      <KeycloakChangePasswordWebViewOverlay />
    </View>
  );
};

export default Navigation;
