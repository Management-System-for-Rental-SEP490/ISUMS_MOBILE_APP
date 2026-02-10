import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert, Linking, Image, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import loginStyles from "../../../shared/styles/authenticationScreen/loginStyles";
import { RootStackParamList } from "../../../shared/types";
import { useAuthStore } from "../../../store/useAuthStore";
import { openKeycloakLogin, handleKeycloakCallback, exchangeCodeForToken } from "../../../shared/services/keycloakAuth";
import { useTranslation } from "react-i18next";

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthLogin">; //đây là khai báo kiểu để useNavigation có type an toàn khi dùng trong LoginScreen.

const LoginScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<LoginNavigationProp>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const isProcessing = useRef(false); //useRef là một hook trong React để lưu trữ giá trị không thay đổi (immutable) trong suốt cả quá trình render của component.

  // Reset trạng thái khi màn hình được focus lại (ví dụ: quay lại từ browser nhưng không login):
  //Đoạn code này là một cơ chế dọn dẹp và reset trạng thái an toàn dành riêng cho việc điều hướng giữa các màn hình 
  // trong React Native, đảm bảo UI không bị treo ở trạng thái loading khi người dùng quay lại màn hình này.
  useFocusEffect(
    useCallback(() => {
      isProcessing.current = false; //set giá trị của isProcessing về false để không xử lý deep link callback khi màn hình được focus lại.
      setIsLoading(false); //set giá trị của isLoading về false để không hiển thị loading khi màn hình được focus lại.
    }, [])
  );
  // Hàm đổi ngôn ngữ
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  // Hàm xử lý deep link callback từ Keycloak, bắt deep link, giải nghĩa lấy code để đổi lấy token
  const handleDeepLink = async (event: { url: string }) => {
    if (isProcessing.current) {
        return; //nếu isProcessing.current là true thì không xử lý deep link callback.
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

  // hàm để app bắt thông tin đăng nhập khi cả chạy ngầm và đã tắt
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
      const result = await openKeycloakLogin(i18n.language); //mở một cái "In-App Browser" (trình duyệt nhúng trong App).
      
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
        <Text style={{ marginTop: 10, color: "#666" }}>{t('loading')}</Text>
      </View>
    );
  }

  const languages = [
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' }
  ];

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

        {/* Language Selector */}
        <View style={loginStyles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                loginStyles.languageButton,
                i18n.language === lang.code && loginStyles.languageButtonActive
              ]}
              onPress={() => changeLanguage(lang.code)}
            >
              <Text style={[
                loginStyles.languageText,
                i18n.language === lang.code && loginStyles.languageTextActive
              ]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={loginStyles.form}>
          <Text style={loginStyles.title}>{t('welcome')}</Text>
          <Text style={loginStyles.description}>
            {t('description')}
          </Text>
          
          <TouchableOpacity 
            style={loginStyles.button} 
            onPress={handleKeycloakLogin}
            activeOpacity={0.8} //đây là thuộc tính để đặt độ mờ của button khi nhấn vào.
          >
            <Text style={loginStyles.buttonText}>{t('login_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default LoginScreen;