import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, AppState, Image, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
  const [isLoading, setIsLoading] = useState(false);
  const isProcessing = useRef(false);

  // Reset trạng thái khi màn hình được focus lại (ví dụ: quay lại từ browser nhưng không login)
  useFocusEffect(
    useCallback(() => {
      isProcessing.current = false;
      setIsLoading(false);
    }, [])
  );

  // Hàm xử lý deep link callback từ Keycloak
  const handleDeepLink = async (event: { url: string }) => {
    if (isProcessing.current) {
        return;
    }

    const code = handleKeycloakCallback(event.url);
    
    if (code) {
      isProcessing.current = true;
      setIsLoading(true);

      // Thêm timeout an toàn: sau 15s nếu chưa xong thì tự reset
      const timeoutId = setTimeout(() => {
        if (isProcessing.current) {
          isProcessing.current = false;
          setIsLoading(false);
          Alert.alert("Lỗi", "Quá thời gian đăng nhập. Vui lòng thử lại.");
        }
      }, 15000);

      try {
        const payload = await exchangeCodeForToken(code);
        clearTimeout(timeoutId); // Xóa timeout nếu thành công
        useAuthStore.getState().login(payload);
        // Không cần navigation.replace("Main")
      } catch (error) {
        clearTimeout(timeoutId); // Xóa timeout nếu lỗi
        setIsLoading(false);
        isProcessing.current = false;
        Alert.alert(
          "Đăng nhập thất bại", 
          error instanceof Error ? error.message : "Có lỗi xảy ra"
        );
      }
    } else {
      // Kiểm tra lỗi từ URL
      try {
        const url = new URL(event.url);
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        if (error) {
          Alert.alert("Lỗi đăng nhập", errorDescription || error);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  };

  // Lắng nghe deep link callback từ Keycloak
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      handleDeepLink(event);
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    // Kiểm tra URL khi app mở từ deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url }); 
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  // Đã xóa AppState listener vì Linking.addEventListener đã đủ để bắt deep link khi app resume


  const handleKeycloakLogin = async () => {
    try {
      // Gọi mở browser đăng nhập
      const result = await openKeycloakLogin();
      
      // Xử lý kết quả trả về ngay lập tức (Chủ động)
      if (result && result.type === "success" && result.url) {
        // Gọi hàm xử lý deep link với URL trả về
        handleDeepLink({ url: result.url });
      } else if (result && result.type === "cancel") {
        // Người dùng hủy đăng nhập
      }
    } catch (error) {
      Alert.alert(
        "Lỗi", 
        `Không thể mở trang đăng nhập: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#3bb582" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang đăng nhập...</Text>
      </View>
    );
  }

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
            activeOpacity={0.8} //đây là thuộc tính để đặt độ mờ của button khi nhấn vào.
          >
            <Text style={loginStyles.buttonText}>Đăng nhập với tài khoản ISUMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default LoginScreen;