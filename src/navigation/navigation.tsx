import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../features/auth/screens/LoginScreen";
import OnBoarding from "../features/auth/screens/onBoarding";
import { useAuthStore } from "../store/useAuthStore";
import { RootStackParamList } from "../shared/types";
import { TenantTabs, StaffTabs } from "../shared/components/footerNavigator";
import CameraScreen from "../screens/modal/CameraScreen";
import DeviceDetail from "../features/devices/deviceDetail";
import TicketScreen from "../features/ticket/ticket";
import BuildingDetailScreen from "../features/staff/screens/BuildingDetailScreen";
import TicketDetailScreen from "../features/staff/screens/TicketDetailScreen";
import { StaffScheduleProvider } from "../features/staff/context/StaffScheduleContext";

// Wrapper components để bọc Provider cho các screen cần useStaffSchedule
const BuildingDetailScreenWrapper = () => (
  <StaffScheduleProvider>
    <BuildingDetailScreen />
  </StaffScheduleProvider>
);

const TicketDetailScreenWrapper = () => (
  <StaffScheduleProvider>
    <TicketDetailScreen />
  </StaffScheduleProvider>
);

const Stack = createNativeStackNavigator<RootStackParamList>();

const RoleNavigator = () => {
  const role = useAuthStore((state) => state.role);

  // if (role === "landlord") {
  //   return <LandlordTabs />;
  // }
  // if (role === "manager") {
  //   return <ManagerTabs />;
  // }
  if (role === "Technical") {
    return <StaffTabs />;
  }
  return <TenantTabs />;
};

const Navigation = () => {
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

  if (!isReady) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {/* Hiển thị loading khi đang đọc state từ AsyncStorage vào store(cái vòng tròn xoay */}
              <ActivityIndicator size="large" color="#3bb582" /> 
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
            // User cũ (đã có trong onboardedUsers) -> Vào thẳng Main
            <>
              <Stack.Screen name="Main" component={RoleNavigator} />
              <Stack.Screen
                name="Camera"
                component={CameraScreen}
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="DeviceDetail" component={DeviceDetail} />
              <Stack.Screen 
                name="Ticket" 
                component={TicketScreen}
                options={{ presentation: "modal" }}
              />
              {role === "Technical" ? (
                <>
                  <Stack.Screen name="BuildingDetail" component={BuildingDetailScreenWrapper} />
                  <Stack.Screen name="TicketDetail" component={TicketDetailScreenWrapper} />
                </>
              ) : (
                <>
                  <Stack.Screen name="BuildingDetail" component={BuildingDetailScreen} />
                  <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
                </>
              )}
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
