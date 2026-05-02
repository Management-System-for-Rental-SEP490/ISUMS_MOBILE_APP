import React from "react";
import { Modal, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./src/shared/i18n"; // Import configuration i18n
import Navigation from "./src/navigation/navigation";
import { useAuthStore } from "./src/store/useAuthStore";
import { RefreshLogoOverlay } from "./src/shared/components/RefreshLogoOverlay";
import { neutral } from "./src/shared/theme/color";
import { GlobalAlert } from "./src/shared/components/alert";

// Tạo một instance của QueryClient
// Đây là "bộ não" quản lý cache của React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Thử lại 2 lần nếu request thất bại trước khi báo lỗi
      staleTime: 1000 * 60 * 5, // Data được coi là "tươi" trong 5 phút (không fetch lại trừ khi cần thiết)
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

export default function App() {
  // SafeAreaProvider được sử dụng để đảm bảo nội dung hiển thị đúng trong vùng an toàn của thiết bị (ví dụ: tránh phần notch, thanh trạng thái trên iPhone X trở lên).
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <Navigation />
          <GlobalAlert />
          <LogoutRouteCoverPortal />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
