import { Text, View, StyleSheet } from "react-native";
import { useAuthStore } from "../../../store/useAuthStore";
import Header from "../../../shared/components/header";
import { HomeScreenProps } from "../../../shared/types";
import { useTranslation } from "react-i18next";



const HomeScreen = ({ navigation }: HomeScreenProps) => { // HomeScreen là một function component nhận vào props có kiểu HomeScreenProps.
  const { user, role } = useAuthStore();
  const { t } = useTranslation();
  /*
    Giải thích:
    - Nếu role có giá trị, thì lấy ký tự đầu tiên bằng role.charAt(0).toUpperCase() (viết hoa chữ cái đầu),
      nối với phần còn lại role.slice(1) (từ ký tự thứ 2 trở đi, giữ nguyên chữ thường).
    - Nếu role không có giá trị (null hoặc undefined), trả về "Khách".
    => Kết quả: biến roleLabel sẽ chứa tên role với chữ cái đầu viết hoa (ví dụ: "Tenant", "Landlord", "Manager"), hoặc "Khách" nếu chưa đăng nhập.
  */
  // const roleLabel = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Khách";
  const roleLabel = role ? t(`profile.role_${role}`) : t('profile.role_guest');

  return (
      <View style={styles.container}>
        <Header variant="default" />
        <View style={styles.screen}>
          <Text>{t('home.welcome_role', { role: roleLabel })}</Text>
        </View>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
    },
    screen: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default HomeScreen;

