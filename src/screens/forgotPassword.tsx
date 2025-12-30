import { View, Text, ImageBackground, TextInput, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useForgotPasswordStore } from "../stores/useAuthStore";
import forgotPasswordStyles from "../styles/authenticationScreen/forgotPasswordStyles";
import { RootStackParamList } from "../types";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<RootStackParamList, "AuthForgotPassword">;

const ForgotPassword = () => {
    const { email, setEmail, sendEmail } = useForgotPasswordStore();
    const navigation = useNavigation<ForgotPasswordNavigationProp>();
    const handleSendEmail = () => {
        sendEmail();
    };

    const goToLogin = () => {
        navigation.navigate("AuthLogin");
    };

    return (
        <ImageBackground
            source={require("../../assets/bg.png")}
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

export default ForgotPassword;