import { useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, AppState, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import loginStyles from "../../../shared/styles/authenticationScreen/loginStyles";
import { RootStackParamList } from "../../../shared/types";
import { useAuthStore } from "../../../store/useAuthStore";
import { openKeycloakLogin, handleKeycloakCallback, exchangeCodeForToken } from "../../../shared/services/keycloakAuth";

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthLogin">; //đây là khai báo kiểu để useNavigation có type an toàn khi dùng trong LoginScreen.

const LoginScreen = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const insets = useSafeAreaInsets();

  // Hàm xử lý deep link callback từ Keycloak
  const handleDeepLink = async (event: { url: string }) => {
    const code = handleKeycloakCallback(event.url);
    
    if (code) {
      try {
        const payload = await exchangeCodeForToken(code); //đây là hàm để trao đổi authorization code lấy access token. await là để đợi kết quả trả về từ hàm exchangeCodeForToken.
        useAuthStore.getState().login(payload);
        navigation.replace("Main");
      } catch (error) {
        Alert.alert(
          "Đăng nhập thất bại", 
          error instanceof Error ? error.message : "Có lỗi xảy ra" //đây là kiểm tra xem error có phải là một đối tượng Error không, nếu có thì sẽ hiển thị message của error, nếu không thì sẽ hiển thị "Có lỗi xảy ra".
        );
      }
    } else {
      // Kiểm tra xem có error không
      try {
        const url = new URL(event.url); //đây là hàm để tạo một đối tượng URL từ chuỗi URL.
        const error = url.searchParams.get("error"); //đây là hàm để lấy giá trị của tham số error từ URL.
        const errorDescription = url.searchParams.get("error_description"); //đây là hàm để lấy giá trị của tham số error_description từ URL.
        if (error) {
          Alert.alert("Lỗi đăng nhập", errorDescription || error); //đây là hàm để hiển thị thông báo lỗi đăng nhập.
        }
      } catch (e) {
        // Ignore parsing errors //đây là hàm để bỏ qua lỗi khi phân tích URL.
      }
    }
  };

  // Lắng nghe deep link callback từ Keycloak
  useEffect(() => { //Tạo side-effect chạy khi component mount và khi dependency thay đổi.
    const subscription = Linking.addEventListener("url", handleDeepLink);//addEventListener là hàm để lắng nghe sự kiện url. "url" là tên event. Event này phát ra mỗi khi app nhận được một URL (vd: isums://callback?...). handleDeepLink là hàm để xử lý deep link callback từ Keycloak.

    // Kiểm tra URL khi app mở từ deep link
    Linking.getInitialURL().then((url) => { //Linking là API của React Native để làm việc với deep link (mở app qua URL). "url" là tên event. Event này phát ra mỗi khi app nhận được một URL (vd: isums://callback?...).
      if (url) { //Kiểm tra xem url có tồn tại không.
        handleDeepLink({ url }); 
      }
    });

    return () => {
      subscription.remove(); //remove là hàm để xóa event listener.
    };
  }, [navigation]);

  // Lắng nghe khi app quay lại foreground (sau khi đăng nhập trên browser),
  // mục đích là bắt lại khi user đăng nhập qua trình duyệt rồi quay về app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => { //addEventListener là hàm để lắng nghe sự kiện change. "change" là tên event. Event này phát ra mỗi khi trạng thái app thay đổi (vd: active, inactive, background, ...). nextAppState là trạng thái app mới.
      if (nextAppState === 'active') { //Kiểm tra xem trạng thái app mới có phải là active không.
        Linking.getInitialURL().then((url) => {
          if (url && url.includes('isums://callback')) {
            handleDeepLink({ url }); 
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleKeycloakLogin = async () => {
    try {
      await openKeycloakLogin(); //openKeycloakLogin là hàm để mở trang đăng nhập Keycloak.
    } catch (error) {
      Alert.alert(
        "Lỗi", 
        `Không thể mở trang đăng nhập: ${error instanceof Error ? error.message : "Unknown error"}` //đây là hàm để hiển thị thông báo lỗi khi mở trang đăng nhập Keycloak.
      );
    }
  };

  return (
    <LinearGradient
      colors={["#3bb582", "rgba(12, 106, 181, 0.7)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[loginStyles.container, { paddingTop: insets.top }]}
    >
      <View style={loginStyles.content}>
        <View style={loginStyles.logoContainer}>
          <View style={loginStyles.logoWrapper}>
            <Image
              source={require("../../../../assets/logob.png")}
              style={loginStyles.logoImage}
              accessibilityLabel="ISUMS logo" //đây là thuộc tính để đánh dấu logo ISUMS để screen reader có thể đọc.
            />
          </View>
          <Text style={loginStyles.brandTitle}>ISUMS</Text>
          <Text style={loginStyles.subtitle}>Hệ thống quản lý điều hành trực tuyến</Text>
        </View>

        <View style={loginStyles.form}>
          <Text style={loginStyles.title}>Chào mừng bạn đến với ISUMS</Text>
          <Text style={loginStyles.description}>
            Vui lòng đăng nhập để tiếp tục sử dụng ứng dụng
          </Text>
          
          <TouchableOpacity 
            style={loginStyles.button} 
            onPress={handleKeycloakLogin}
            activeOpacity={0.8}
          >
            <Text style={loginStyles.buttonText}>Đăng nhập với Tài khoản ISUMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default LoginScreen;