import { View, Text, ImageBackground, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForgotPasswordStore } from "../../../store/useAuthStore";
import forgotPasswordStyles from "../../../shared/styles/authenticationScreen/forgotPasswordStyles";
import { RootStackParamList } from "../../../shared/types";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthForgotPassword">;

const ForgotPasswordScreen = () => {
    const { email, setEmail, sendEmail } = useForgotPasswordStore();
    const navigation = useNavigation<ForgotPasswordNavigationProp>();
    const handleSendEmail = () => {
        sendEmail();
        Alert.alert("Đã gửi mail", "Vui lòng kiểm tra hộp thư đến của bạn.");
    };

    const goToLogin = () => {
        navigation.navigate("AuthLogin");
    };

    return (
        <ImageBackground
            source={require("../../../../assets/icon.png")}
            style={forgotPasswordStyles.background}
            resizeMode="cover"
        >
            <View style={forgotPasswordStyles.overlay}>
                <View style={forgotPasswordStyles.form}>
                    <Text style={forgotPasswordStyles.title}>Quên mật khẩu</Text>
                    <Text style={forgotPasswordStyles.label}>Email</Text>
                    <TextInput
                        style={forgotPasswordStyles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        placeholderTextColor="#a0a0a0"
                    />
                    <TouchableOpacity style={forgotPasswordStyles.button} onPress={handleSendEmail}>
                        <Text style={forgotPasswordStyles.buttonText}>Gửi email</Text>
                    </TouchableOpacity>
                    <View style={forgotPasswordStyles.linkRow}>
                        <TouchableOpacity onPress={goToLogin}>
                            <Text style={forgotPasswordStyles.linkText}>Quay lại đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ImageBackground>
    );
};

export default ForgotPasswordScreen;