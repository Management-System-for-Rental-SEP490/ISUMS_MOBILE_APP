import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../../../store/useAuthStore";
import Header from "../../../shared/components/header";
import { MainTabParamList } from "../../../shared/types";

type HomeScreenProps = BottomTabScreenProps<MainTabParamList, "Dashboard">;
const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, role } = useAuthStore();
  /*
    Giải thích:
    - Nếu role có giá trị, thì lấy ký tự đầu tiên bằng role.charAt(0).toUpperCase() (viết hoa chữ cái đầu),
      nối với phần còn lại role.slice(1) (từ ký tự thứ 2 trở đi, giữ nguyên chữ thường).
    - Nếu role không có giá trị (null hoặc undefined), trả về "Khách".
    => Kết quả: biến roleLabel sẽ chứa tên role với chữ cái đầu viết hoa (ví dụ: "Tenant", "Landlord", "Manager"), hoặc "Khách" nếu chưa đăng nhập.
  */
  const roleLabel = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Khách";
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text style={styles.title}>Chào mừng, {user ?? "đối tác"}</Text>
        <Text style={styles.subtitle}>
          Bạn đang đăng nhập dưới vai trò {roleLabel}. Dashboard sẽ hiển thị thông tin phù hợp cho role này.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#374151",
  },
});

export default HomeScreen;

