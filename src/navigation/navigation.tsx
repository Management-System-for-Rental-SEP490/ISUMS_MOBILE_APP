import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { CustomAlert } from "../shared/components/alert";
import Login from "../features/screens/authentication/LoginScreen";
import OnBoarding from "../features/screens/onBoarding/onBoarding";
import { useAuthStore } from "../store/useAuthStore";
import { logoutKeycloak } from "../shared/services/keycloakAuth";
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
import { brandPrimary } from "../shared/theme/color";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const { t } = useTranslation();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const onboardedUsers = useAuthStore((state) => state.onboardedUsers);
  
  const [isReady, setIsReady] = useState(false);

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

  if (!isReady) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {/* Hiển thị loading khi đang đọc state từ AsyncStorage vào store(cái vòng tròn xoay */}
              <ActivityIndicator size="large" color={brandPrimary} /> 
          </View>
      );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          showOnboarding ? (
             // User mới (chưa có trong onboardedUsers) -> Hiện Onboarding
             <Stack.Screen name="OnBoarding" component={OnBoarding} />
          ) : (
            // User cũ (đã có trong onboardedUsers) -> Vào thẳng Main (chỉ Tenant)
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
            </>
          )
        ) : (
          // Chưa đăng nhập -> Hiện Login
          <Stack.Screen name="AuthLogin" component={Login} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
