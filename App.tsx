import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from './src/navigation/navigation';

export default function App() {
  // SafeAreaProvider được sử dụng để đảm bảo nội dung hiển thị đúng trong vùng an toàn của thiết bị (ví dụ: tránh phần notch, thanh trạng thái trên iPhone X trở lên).
  return (
    <SafeAreaProvider>
        <Navigation />
    </SafeAreaProvider>
  );
}
