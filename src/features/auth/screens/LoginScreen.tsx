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

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthLogin">;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const insets = useSafeAreaInsets();

  // Hàm xử lý deep link callback từ Keycloak
  const handleDeepLink = async (event: { url: string }) => {
    const code = handleKeycloakCallback(event.url);
    
    if (code) {
      try {
        const payload = await exchangeCodeForToken(code);
        useAuthStore.getState().login(payload);
        navigation.replace("Main");
      } catch (error) {
        Alert.alert(
          "Đăng nhập thất bại", 
          error instanceof Error ? error.message : "Có lỗi xảy ra"
        );
      }
    } else {
      // Kiểm tra xem có error không
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
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Kiểm tra URL khi app mở từ deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  // Lắng nghe khi app quay lại foreground (sau khi đăng nhập trên browser)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
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
      await openKeycloakLogin();
    } catch (error) {
      Alert.alert(
        "Lỗi", 
        `Không thể mở trang đăng nhập: ${error instanceof Error ? error.message : "Unknown error"}`
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
              accessibilityLabel="ISUMS logo"
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