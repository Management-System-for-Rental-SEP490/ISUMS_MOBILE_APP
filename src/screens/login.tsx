import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import loginStyles from "../styles/authenticationScreen/loginStyles";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    Alert.alert("Đăng nhập", `Tên: ${username || "(chưa nhập)"}`);
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