import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // Sử dụng icon từ Expo
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { openAccountManagement, logoutKeycloak } from "../../../shared/services/keycloakAuth";

const UserProfileScreen = () => {
  const navigation = useNavigation<any>();
  
  // Lấy thông tin user từ store
  const { user, role, idToken, logout } = useAuthStore();

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            // 1. Gọi logout Keycloak (mở browser để xóa session)
            // Truyền idToken để Keycloak logout triệt để mà không bị lỗi server
            await logoutKeycloak(idToken);
            
            // 2. Xóa data local (Điều này sẽ kích hoạt Conditional Rendering ở Navigation)
            // -> App tự động chuyển về màn hình Login
            logout();
          },
        },
      ]
    );
  };

  // Hàm mở trang quản lý tài khoản Keycloak
  const handleManageAccount = async () => {
    try {
      await openAccountManagement();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở trang quản lý tài khoản.");
    }
  };

  // Hiển thị tên role đẹp hơn
  const getRoleDisplayName = (role: string | null) => {
    if (role === "technical") return "Kỹ thuật viên";
    if (role === "tenant") return "Cư dân";
    return "Người dùng";
  };

  // Lấy chữ cái đầu của tên để làm avatar
  const getAvatarInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <View style={userProfileStyles.container}>
      <ScrollView contentContainerStyle={userProfileStyles.contentContainer}>
        {/* Header Background Gradient */}
        <LinearGradient
          colors={["#3bb582", "#0c6ab5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={userProfileStyles.headerBackground}
        >
          <Text style={userProfileStyles.headerTitle}>Hồ sơ cá nhân</Text>
        </LinearGradient>

        {/* Profile Card */}
        <View style={userProfileStyles.profileCard}>
          <View style={userProfileStyles.avatarContainer}>
            <Text style={userProfileStyles.avatarText}>{getAvatarInitials(user)}</Text>
          </View>
          <Text style={userProfileStyles.userName}>{user || "Chưa cập nhật"}</Text>
          <View style={userProfileStyles.userRoleContainer}>
            <Text style={userProfileStyles.userRole}>{getRoleDisplayName(role)}</Text>
          </View>
        </View>

        {/* Menu Actions */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>Tài khoản</Text>

          {/* Nút Quản lý tài khoản (Đổi mật khẩu, Info) */}
          <TouchableOpacity style={userProfileStyles.menuItem} onPress={handleManageAccount}>
            <View style={userProfileStyles.menuIcon}>
              <Ionicons name="settings-outline" size={24} color="#0c6ab5" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>Quản lý tài khoản</Text>
              <Text style={userProfileStyles.menuDescription}>Đổi mật khẩu, cập nhật thông tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>Ứng dụng</Text>

          <TouchableOpacity style={userProfileStyles.menuItem} onPress={() => navigation.navigate("Notification")}>
            <View style={userProfileStyles.menuIcon}>
              <Ionicons name="notifications-outline" size={24} color="#F57C00" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}
              onPress={() => navigation.navigate("Notification")}>Thông báo</Text>
              <Text style={userProfileStyles.menuDescription} onPress={() => navigation.navigate("Notification")}>Cài đặt nhận tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={userProfileStyles.menuItem}>
            <View style={userProfileStyles.menuIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#3bb582" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>Trợ giúp & Hỗ trợ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={userProfileStyles.logoutButton} onPress={handleLogout}>
          <Text style={userProfileStyles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>

     
    </View>
  );
};

export default UserProfileScreen;
