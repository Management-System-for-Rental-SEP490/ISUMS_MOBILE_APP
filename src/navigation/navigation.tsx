import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../features/auth/screens/LoginScreen";
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
  if (role === "staff") {
    return <StaffTabs />;
  }
  return <TenantTabs />;
};

const Navigation = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);




  return (
    <NavigationContainer>
      <Stack.Navigator
        key={isLoggedIn ? "logged-in" : "auth"}
        initialRouteName={isLoggedIn ? "Main" : "AuthLogin"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AuthLogin" component={Login} />
        <Stack.Screen name="Main" component={RoleNavigator} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="DeviceDetail" component={DeviceDetail} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;

