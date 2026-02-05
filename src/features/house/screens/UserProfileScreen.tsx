import { View, Text, Alert, Button, TouchableOpacity } from "react-native";
import Header from "../../../shared/components/header";
import { openAccountManagement } from '../../../shared/services/keycloakAuth';
import UserProfileScreenStyles from './UserProfileScreenStyles';



const UserProfileScreen = () => {
    const handleChangePassword = async () => {
      try {
        await openAccountManagement();
      } catch (error) {
        Alert.alert("Lỗi", "Không thể mở trang đổi mật khẩu");
      }
    };
  return (
    <View style={UserProfileScreenStyles.container}>
      <Header variant="default" />
      <View style={UserProfileScreenStyles.screen}>
        <Text>User Profile</Text>
        <TouchableOpacity style={UserProfileScreenStyles.button} onPress={handleChangePassword}>
          <Text style={UserProfileScreenStyles.buttonText}>Đổi mật khẩu / Quản lý tài khoản</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default UserProfileScreen;