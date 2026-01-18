import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthForgotPassword from "../features/auth/screens/ForgotPasswordScreen";
import AuthRegister from "../features/auth/screens/RegisterScreen";
import Login from "../features/auth/screens/LoginScreen";
import { useAuthStore } from "../store/useAuthStore";
import { RootStackParamList } from "../shared/types";
import { LandlordTabs, ManagerTabs, TenantTabs, StaffTabs } from "../shared/components/footerNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RoleNavigator = () => {
  const role = useAuthStore((state) => state.role);

  if (role === "landlord") {
    return <LandlordTabs />;
  }
  if (role === "manager") {
    return <ManagerTabs />;
  }
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
        <Stack.Screen name="AuthRegister" component={AuthRegister} />
        <Stack.Screen name="AuthForgotPassword" component={AuthForgotPassword} />
        <Stack.Screen name="Main" component={RoleNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;

