import { View, Text, TextInput, TouchableOpacity, Alert, ImageBackground } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import registerStyles from "../styles/authenticationScreen/registerStyles";
import { RootStackParamList } from "../types";
import { useRegisterStore } from "../stores/useAuthStore";


type AuthRegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthRegister">;
const AuthRegister = () => {
    const { username, email, password, setUsername, setEmail, setPassword } = useRegisterStore();
    const navigation = useNavigation<AuthRegisterNavigationProp>();

    const handleRegister = () => {
        if (!username.trim() || !email.trim() || !password) {
            Alert.alert("Thông tin thiếu", "Vui lòng điền đầy đủ tên, email và mật khẩu.");
            return;
        }
        useRegisterStore.getState().setUsername(username.trim());
        useRegisterStore.getState().setEmail(email.trim());
        useRegisterStore.getState().setPassword(password.trim());
        navigation.replace("Home", { username: username.trim() });
        Alert.alert("Đăng ký thành công", "Chuyển tới trang chính...", [
            {
                text: "OK",
                onPress: () => navigation.replace("Home", { username: username.trim() }),
            },
        ]);
    };

    const goToLogin = () => {
        navigation.navigate("AuthLogin");
    };
    return (
        <ImageBackground
            source={require("../../assets/bg.png")}
            style={registerStyles.background}
            resizeMode="cover"
        >
            <View style={registerStyles.overlay}>
                <View style={registerStyles.form}>
                    <Text style={registerStyles.title}>Đăng ký</Text>
                    <Text style={registerStyles.label}>Tên người dùng</Text>
                    <TextInput
                        style={registerStyles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Tên đăng nhập"
                        placeholderTextColor="#a0a0a0"
                    />
                    <Text style={registerStyles.label}>Email</Text>
                    <TextInput
                        style={registerStyles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#a0a0a0"
                        keyboardType="email-address"
                    />
                    <Text style={registerStyles.label}>Mật khẩu</Text>
                    <TextInput
                        style={registerStyles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mật khẩu"
                        placeholderTextColor="#a0a0a0"
                        secureTextEntry
                    />
                    <TouchableOpacity style={registerStyles.button} onPress={handleRegister}>
                        <Text style={registerStyles.buttonText}>Tạo tài khoản</Text>
                    </TouchableOpacity>
                    <View style={registerStyles.linkRow}>
                        <TouchableOpacity onPress={goToLogin}>
                            <Text style={registerStyles.linkText}>Đã có tài khoản? Quay lại đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

export default AuthRegister;