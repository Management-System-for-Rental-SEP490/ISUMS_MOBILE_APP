import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./src/shared/i18n";
import Navigation from "./src/navigation/navigation";
import { useAuthStore } from "./src/store/useAuthStore";
import { RefreshLogoOverlay } from "./src/shared/components/RefreshLogoOverlay";
import { neutral } from "./src/shared/theme/color";
import { GlobalAlert } from "./src/shared/components/alert";
import { QUERY_DEFAULT_STALE_TIME_MS } from "./src/shared/api/config";
import { ThemeProvider, useTheme } from "./src/shared/design/ThemeProvider";
import { KeycloakWebViewModal } from "./src/shared/components/KeycloakWebViewModal";

// Tạo một instance của QueryClient — quản lý cache React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: QUERY_DEFAULT_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const logoutCoverStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: neutral.background },
});

/**
 * Modal full-screen native (trên toàn bộ Navigator) — che màn khi SSO logout đổi stack,
 * tránh nháy chuyển hướng trong luồng đăng xuất. Custom Tab Keycloak khi đó là activity khác,
 * nhưng khi quay về app thì chỉ thấy màn tải rồi Login.
 */
function LogoutRouteCoverPortal() {
  /** Bracket notation: tránh ReferenceError Hermes khi persist/rehydrate tạm thời thiếu field. */
  const logoutUiLocked = useAuthStore(
    (s) => Boolean((s as Record<string, unknown>)["logoutUiLocked"])
  );
  return (
    <Modal
      visible={logoutUiLocked}
      animationType="none"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={() => {}}
    >
      <View style={logoutCoverStyles.root}>
        <RefreshLogoOverlay visible mode="page" />
      </View>
    </Modal>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} animated />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ThemeProvider>
            <ThemedStatusBar />
            <Navigation />
            <GlobalAlert />
            <LogoutRouteCoverPortal />
            <KeycloakWebViewModal />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
