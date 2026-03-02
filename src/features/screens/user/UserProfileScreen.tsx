import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { logoutKeycloak, openChangePasswordPage } from "../../../shared/services/keycloakAuth";
import { UserProfileResponse } from "../../../shared/types/api";
import Icons from "../../../shared/theme/icon";
import { useTranslation } from "react-i18next";
const UserProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, role, idToken, logout } = useAuthStore();

  // Mock data hoặc lấy từ Store/API sau này
  const userInfo: Partial<UserProfileResponse> = {
    fullName: user || t('profile.role_guest'),
    email: `${user}@example.com`, // Thay bằng email thật từ token/API
    phoneNumber: "0987654321", // Thay bằng phone thật
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout_confirm_title'),
      t('profile.logout_confirm_msg'),
      [
        { text: t('profile.cancel'), style: "cancel" },
        {
          text: t('profile.logout'),
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
    if (role === "technical") return t('profile.role_technical');
    if (role === "tenant") return t('profile.role_tenant');
    return t('profile.role_guest');
  };
// hàm lấy khi tự đầu tiên của tên là hình nền
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
          <Text style={userProfileStyles.headerTitle}>{t('profile.title')}</Text>
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
          <Text style={userProfileStyles.sectionTitle}>{t('profile.contact_info')}</Text>
          
          <View style={userProfileStyles.infoItem}>
            <View style={userProfileStyles.infoIcon}>
                <Icons.mail size={20} color="#666" />
            </View>
            <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>{t('profile.email')}</Text>
                <Text style={userProfileStyles.infoValue}>{userInfo.email}</Text>
            </View>
          </View>

          <View style={[userProfileStyles.infoItem, { borderBottomWidth: 0 }]}>
            <View style={userProfileStyles.infoIcon}>
                <Icons.call size={20} color="#666" />
            </View>
            <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>{t('profile.phone')}</Text>
                <Text style={userProfileStyles.infoValue}>{userInfo.phoneNumber}</Text>
            </View>
          </View>
        </View>

        {/* Section: Bảo mật (Custom Page) */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>{t('profile.security')}</Text>

          <TouchableOpacity 
            style={userProfileStyles.menuItem} 
            onPress={openChangePasswordPage}
          >
            <View style={[userProfileStyles.menuIcon, { backgroundColor: "#E3F2FD" }]}>
              <Icons.shield size={22} color="#0c6ab5" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t('profile.change_password')}</Text>
              <Text style={userProfileStyles.menuDescription}>{t('profile.change_password_desc')}</Text>
            </View>
            <Icons.chevronForward size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Section: Ứng dụng */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>{t('profile.app_settings')}</Text>

          <TouchableOpacity style={userProfileStyles.menuItem} onPress={() => navigation.navigate("Notification")}>
            <View style={[userProfileStyles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
              <Icons.notification size={22} color="#F57C00" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t('profile.notifications')}</Text>
              <Text style={userProfileStyles.menuDescription}>{t('profile.notifications_desc')}</Text>
            </View>
            <Icons.chevronForward size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={userProfileStyles.logoutButton} onPress={handleLogout}>
            <Icons.logOut size={20} color="#D32F2F" />
            <Text style={userProfileStyles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default UserProfileScreen;
