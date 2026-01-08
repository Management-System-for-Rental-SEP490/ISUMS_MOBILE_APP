import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthForgotPassword from "../screens/forgotPassword";
import AuthRegister from "../screens/register";
import Login from "../screens/login";
import { useAuthStore } from "../stores/useAuthStore";
import { RootStackParamList } from "../types";
import { LandlordTabs, AdminTabs, TenantTabs } from "../components/footer";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RoleNavigator = () => {
  const role = useAuthStore((state) => state.role);

  if (role === "landlord") {
    return <LandlordTabs />;
  }
  if (role === "admin") {
    return <AdminTabs />;
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

