import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import loginStyles from "../styles/authenticationScreen/loginStyles";
import { RootStackParamList } from "../types";
import { validateCredentials } from "../services";
import useAuthStore from "../stores/useAuthStore";




type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;
                            // kiểu dùng để định hình các prop điều hướng cho màn hình stack
const Login = () => {
  const [username, setUsername] = useState("");
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

  const handleLogin = () => {
    if (validateCredentials(username.trim(), password)) {
      useAuthStore.getState().login(username.trim());
      navigation.replace("Home", { username: username.trim() });
    } else {
      Alert.alert("Lỗi đăng nhập", "Tên hoặc mật khẩu không đúng.");
    }
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
        </View>
      </View>
    </ImageBackground>
  );
};

export default Login;