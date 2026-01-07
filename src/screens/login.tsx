import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import loginStyles from "../styles/authenticationScreen/loginStyles";
import { RootStackParamList } from "../types";
import { mockLogin } from "../services";
import { useAuthStore } from "../stores/useAuthStore";




type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthLogin">;
                            // kiểu dùng để định hình các prop điều hướng cho màn hình stack
const Login = () => {
  /*
    Những dòng này:
      const [username, setUsername] = useState("");
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
    vẫn cần thiết dù bạn đã dùng Zustand để quản lý state đăng nhập, bởi vì:
    
    - useAuthStore của Zustand thường chỉ lưu trạng thái người dùng đã đăng nhập (user, isLoggedIn) và các action (login, logout), chứ không lưu từng giá trị nhập liệu trên form mỗi khi người dùng còn chưa đăng nhập (username/email/password).
    - Các state useState này phục vụ cho form điều khiển (controlled component) của input: giúp giá trị TextInput luôn đồng bộ với giao diện UI. Khi người dùng nhập/chỉnh thì setUsername/setEmail/setPassword sẽ update tạm thời tức thì.
    - Khi user bấm nút đăng nhập, chỉ khi đó bạn sẽ dùng các giá trị này để xác thực tài khoản (validateCredentials), rồi nếu đúng thì mới gọi useAuthStore để cập nhật global state.
    - Nếu lưu dữ liệu nhập ngay trong Zustand thì các lỗi nhập liệu/clear form/reset field sẽ phức tạp hơn, gây side-effect không cần thiết cho global state (dùng cho cả app).
    
    => useState phục vụ UI nhập liệu tạm thời/ngắn hạn cho riêng màn hình, Zustand dùng để lưu trạng thái đăng nhập thật sự (global cho toàn app) khi đăng nhập thành công.
  */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<LoginNavigationProp>();

  /*
    useAuthStore.getState().login(username.trim());

    Giải thích:
    - `useAuthStore` là custom hook/state store quản lý trạng thái đăng nhập bằng thư viện Zustand (đã khai báo ở file stores/useAuthStore.ts).
    - `.getState()` là hàm Zustand cung cấp, trả về object state hiện tại của store (bao gồm các giá trị như user, isLoggedIn, cùng các hàm như login, logout).
    - `.login(username.trim())` là gọi hàm action "login" được định nghĩa trong store, truyền vào username đã loại bỏ khoảng trắng đầu cuối (dùng trim()).
    - Khi gọi như vậy, state toàn cục lưu trong Zustand sẽ cập nhật: user = username.trim(), isLoggedIn = true.
    - Nhờ vậy, bất kỳ component nào khác dùng useAuthStore cũng sẽ biết được trạng thái đăng nhập thay đổi.

    => Dòng này thực hiện logic cập nhật trạng thái login toàn app một cách nhất quán và tức thì nhờ Zustand.
  */

  const handleLogin = async () => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      const payload = await mockLogin(trimmedUsername, password);
      useAuthStore.getState().login(payload);
      navigation.replace("Main");
    } catch (error) {
      Alert.alert("Đăng nhập thất bại", error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const goToRegister = () => {
    navigation.navigate("AuthRegister", { username: username.trim(), email: email.trim(), password: password.trim() });
  };

  const goToForgot = () => {
    navigation.navigate("AuthForgotPassword", { email: email.trim() });
  };

  // resizeMode="cover" nghĩa là hình nền sẽ được phóng to hoặc thu nhỏ sao cho toàn bộ background được bao phủ bởi ảnh, có thể sẽ bị cắt bớt ở hai cạnh nếu tỉ lệ ảnh không khớp với màn hình.
  return (
    <ImageBackground
      source={require("../../assets/bg.png")}
      style={loginStyles.background}
      resizeMode="cover" // "cover" means the background image will resize to cover the entire background, possibly cropping the image to fit.
    >
      <View style={loginStyles.overlay}>
        <View style={loginStyles.form}>
          <Text style={loginStyles.title}>Đăng nhập</Text>
          <Text style={loginStyles.label}>Tên đăng nhập</Text>
          <TextInput
            style={loginStyles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Nhập tên đăng nhập"
            placeholderTextColor="#a0a0a0"
          />
          <Text style={loginStyles.label}>Mật khẩu</Text>
          <TextInput
            style={loginStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#a0a0a0"
            secureTextEntry
          />
          <TouchableOpacity style={loginStyles.button} onPress={handleLogin}>
            <Text style={loginStyles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
          <View style={loginStyles.linkRow}>
            <TouchableOpacity onPress={goToRegister}>
              <Text style={loginStyles.linkText}>Đăng ký tài khoản</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToForgot}>
              <Text style={loginStyles.linkText}>Quên mật khẩu?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Login;