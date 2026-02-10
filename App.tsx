import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './src/shared/i18n'; // Import configuration i18n
import Navigation from './src/navigation/navigation';

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

export default function App() {
  // SafeAreaProvider được sử dụng để đảm bảo nội dung hiển thị đúng trong vùng an toàn của thiết bị (ví dụ: tránh phần notch, thanh trạng thái trên iPhone X trở lên).
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
          <Navigation />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
