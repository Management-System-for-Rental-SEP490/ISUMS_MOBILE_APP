import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { logoutKeycloak, openChangePasswordPage } from "../../../shared/services/keycloakAuth";
import { UserProfileResponse } from "../../../shared/services/userService";

const UserProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, role, idToken, logout } = useAuthStore();

  // Mock data hoặc lấy từ Store/API sau này
  const userInfo: Partial<UserProfileResponse> = {
    fullName: user || "Người dùng",
    email: `${user}@example.com`, // Thay bằng email thật từ token/API
    phoneNumber: "0987654321", // Thay bằng phone thật
  };

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
            await logoutKeycloak(idToken);
            logout();
          },
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string | null) => {
    if (role === "technical") return "Kỹ thuật viên";
    if (role === "tenant") return "Cư dân";
    return "Người dùng";
  };

  const getAvatarInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <View style={userProfileStyles.container}>
      <ScrollView contentContainerStyle={userProfileStyles.contentContainer}>
        {/* Header Background */}
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
            <Text style={userProfileStyles.avatarText}>{getAvatarInitials(userInfo.fullName || "")}</Text>
          </View>
          <Text style={userProfileStyles.userName}>{userInfo.fullName}</Text>
          <View style={userProfileStyles.userRoleContainer}>
            <Text style={userProfileStyles.userRole}>{getRoleDisplayName(role)}</Text>
          </View>
        </View>

        {/* Section: Thông tin chung (Từ BE) */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>Thông tin liên hệ</Text>
          
          <View style={userProfileStyles.infoItem}>
            <View style={userProfileStyles.infoIcon}>
                <Ionicons name="mail-outline" size={20} color="#666" />
            </View>
            <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>Email</Text>
                <Text style={userProfileStyles.infoValue}>{userInfo.email}</Text>
            </View>
          </View>

          <View style={[userProfileStyles.infoItem, { borderBottomWidth: 0 }]}>
            <View style={userProfileStyles.infoIcon}>
                <Ionicons name="call-outline" size={20} color="#666" />
            </View>
            <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>Số điện thoại</Text>
                <Text style={userProfileStyles.infoValue}>{userInfo.phoneNumber}</Text>
            </View>
          </View>
        </View>

        {/* Section: Bảo mật (Custom Page) */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>Bảo mật</Text>

          <TouchableOpacity 
            style={userProfileStyles.menuItem} 
            onPress={openChangePasswordPage}
          >
            <View style={[userProfileStyles.menuIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#0c6ab5" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>Đổi mật khẩu</Text>
              <Text style={userProfileStyles.menuDescription}>Cập nhật mật khẩu bảo vệ tài khoản</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Section: Ứng dụng */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>Ứng dụng</Text>

          <TouchableOpacity style={userProfileStyles.menuItem} onPress={() => navigation.navigate("Notification")}>
            <View style={[userProfileStyles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="notifications-outline" size={22} color="#F57C00" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>Thông báo</Text>
              <Text style={userProfileStyles.menuDescription}>Cài đặt nhận tin</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={userProfileStyles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{marginRight: 8}} />
            <Text style={userProfileStyles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default UserProfileScreen;
