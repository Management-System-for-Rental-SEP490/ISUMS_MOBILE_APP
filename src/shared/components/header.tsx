
import { ColorValue, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import headerStyles from "../styles/headerStyles";
import Icons from "../theme/icon";
import { HeaderVariant, MainTabParamList } from "../types";
import { NavigationProp, useNavigation } from "@react-navigation/native";

//1. const gradientMaps: Record<HeaderVariant, [ColorValue, ColorValue]> = { ... }
//    - Định nghĩa một object tên là gradientMaps để map mỗi kiểu "variant" của header với một mảng gồm 2 màu gradient.
//    - Sử dụng Record để đảm bảo các key chỉ là các giá trị hợp lệ của HeaderVariant.

// 2. const Header = ({ variant = "default" }: { variant?: HeaderVariant }) => { ... }
//    - Đây là khai báo một functional component tên Header.
//    - Component này nhận một prop tuỳ chọn "variant" (kiểu HeaderVariant), default là "default".

// 3. const insets = useSafeAreaInsets();
//    - Lấy thông tin lề an toàn của màn hình thiết bị (ví dụ: để không bị che bởi tai thỏ hoặc cạnh cong).
//    - Dùng hook useSafeAreaInsets trả về các giá trị lề (top, bottom, left, right).

// 4. <LinearGradient ...>
//    - Tạo một thành phần với nền gradient dùng LinearGradient từ expo.
//    - props:
//        - colors: sử dụng 2 màu gradient dựa theo variant (từ gradientMaps).
//        - start, end: xác định hướng gradient (từ trên trái về dưới phải).
//        - style: dùng style headerStyles.gradient và tăng paddingTop theo lề an toàn (insets.top + 12).
const gradientMaps: Record<HeaderVariant, [ColorValue, ColorValue]> = {
  default: ["#3bb582", "rgba(12, 106, 181, 0.7)"],
  electric: ["#008001", "rgba(33, 152, 33, 0.9)"],
  water: ["#0072cf", "rgba(9, 128, 225, 0.9)"],
};

const Header = ({ variant = "default" }: { variant?: HeaderVariant }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  return (
    <LinearGradient
      colors={gradientMaps[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[headerStyles.gradient, { paddingTop: insets.top + 12 }]}
    >
      <View style={headerStyles.headerRow}>
        <TouchableOpacity
          style={headerStyles.brandRow}
          activeOpacity={0.75}
          onPress={() => navigation.navigate("Dashboard")}
        >
          <View style={headerStyles.logoWrapper}>
            <Icons.logoHome size={40} />
          </View>
          <Text style={headerStyles.brandTitle}>ISUMS</Text>
        </TouchableOpacity>
        <View style={headerStyles.searchContainer}>
          <Icons.search size={20} color="#1e293b" />
          <TextInput
            style={headerStyles.searchInput}
            placeholder="Tìm kiếm hợp đồng, tài liệu..."
            placeholderTextColor="rgba(15, 23, 42, 0.45)"
            returnKeyType="search"
          />
        </View>
      </View>
    </LinearGradient>
  );
};

export default Header;
