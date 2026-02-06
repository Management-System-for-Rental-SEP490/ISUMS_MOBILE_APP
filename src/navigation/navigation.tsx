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

const Stack = createNativeStackNavigator<RootStackParamList>();

const RoleNavigator = () => {
  const role = useAuthStore((state) => state.role);

  // if (role === "landlord") {
  //   return <LandlordTabs />;
  // }
  // if (role === "manager") {
  //   return <ManagerTabs />;
  // }
  if (role === "technical") {
    return <StaffTabs />;
  }
  return <TenantTabs />;
};

const Navigation = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const onboardedUsers = useAuthStore((state) => state.onboardedUsers);
  
  const [isReady, setIsReady] = useState(false);

  // Kiểm tra xem User hiện tại đã xem Onboarding chưa
  const showOnboarding = isLoggedIn && user && !onboardedUsers.includes(user);

  useEffect(() => {
    const rehydrate = async () => {
        if (useAuthStore.persist && useAuthStore.persist.hasHydrated) {
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
