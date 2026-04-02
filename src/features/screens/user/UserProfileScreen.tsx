import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { CustomAlert as Alert } from "../../../shared/components/alert";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { logoutKeycloak, openChangePasswordPage } from "../../../shared/services/keycloakAuth";
import { UserProfileResponse } from "../../../shared/types/api";
import { RootStackParamList } from "../../../shared/types";
import { getUserProfile } from "../../../shared/services/userApi";
import Icons from "../../../shared/theme/icon";
import {
  BRAND_DANGER,
  brandGradientSolid,
  brandTintBg,
  neutral,
} from "../../../shared/theme/color";
import { useTranslation } from "react-i18next";
import { useTenantContext } from "../../../shared/hooks";
import { getTenantAccessBlock, isHandoverDateReached } from "../../../shared/utils";

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, role, idToken, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [userInfo, setUserInfo] = useState<UserProfileResponse | null>(null);

  const { house, isLoading: tenantAccessLoading } = useTenantContext();
  const accessBlock = useMemo(() => {
    if (tenantAccessLoading) return null;
    if (!house) return null;
    return getTenantAccessBlock(house);
  }, [tenantAccessLoading, house]);
  const isTenantAccessRestricted = Boolean(accessBlock);
  /**
   * Ẩn thông tin nhạy cảm khi chưa bàn giao.
   * Bao gồm cả lúc đang tải context để tránh lóe dữ liệu trong vài frame đầu.
   */
  const isPreHandoverRestricted = useMemo(() => {
    if (tenantAccessLoading) return true;
    if (!house) return true;
    const status = String(house.accessStatus ?? "").trim().toUpperCase();
    if (status === "PENDING_HANDOVER") return true;
    return !isHandoverDateReached(house.handoverDate);
  }, [tenantAccessLoading, house]);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getUserProfile();
      if (data) {
        setUserInfo(data);
      }
    };
    fetchProfile();
  }, []);

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
            // Không chờ vô hạn logout SSO: nếu Keycloak không redirect về app,
            // vẫn cho phép app logout cục bộ và quay lại màn Login.
            const logoutTimeoutMs = 7000;
            await Promise.race([
              logoutKeycloak(idToken),
              new Promise<void>((resolve) => setTimeout(resolve, logoutTimeoutMs)),
            ]);
            logout();
          },
        },
      ]
    );
  };

  const getRoleDisplayName = (roleStr: string | null) => {
    if (roleStr === "technical") return t('profile.role_technical');
    if (roleStr === "tenant") return t('profile.role_tenant');
    return t('profile.role_guest');
  };

  // Logic hiển thị role: ưu tiên từ API (userInfo.roles), nếu không có thì fallback về store (role)
  const displayRole = () => {
    if (userInfo?.roles && userInfo.roles.length > 0) {
      // Giả sử lấy role đầu tiên để hiển thị, có thể map lại nếu cần
      const apiRole = userInfo.roles[0].toLowerCase();
      // Map các role từ API về key hiển thị (nếu giống store thì dùng lại logic cũ)
      if (apiRole.includes("technical") || apiRole.includes("staff")) return t('profile.role_technical');
      if (apiRole.includes("tenant") || apiRole.includes("user")) return t('profile.role_tenant');
      return apiRole; 
    }
    return getRoleDisplayName(role);
  };

  // hàm lấy khi tự đầu tiên của tên là hình nền
  const getAvatarInitials = (name: string | null) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  const displayName = userInfo?.name || user || t('profile.role_guest');
  const displayEmail = userInfo?.email || "";
  const displayPhone = userInfo?.phoneNumber || "";

  const goHome = () => {
    const nav: any = navigation;
    if (typeof nav?.jumpTo === "function") {
      nav.jumpTo("Dashboard");
      return;
    }
    nav.navigate("Dashboard");
  };

  const goTenantTicketList = () => {
    const parentNav = navigation.getParent() as NavigationProp<RootStackParamList> | undefined;
    parentNav?.navigate("TenantTicketList");
  };

  const goTenantQuestionList = () => {
    const parentNav = navigation.getParent() as NavigationProp<RootStackParamList> | undefined;
    parentNav?.navigate("TenantQuestionList");
  };

  const goTenantInvoiceList = () => {
    const parentNav = navigation.getParent() as NavigationProp<RootStackParamList> | undefined;
    parentNav?.navigate("TenantInvoiceList");
  };

  return (
    <View style={userProfileStyles.container}>
      <ScrollView
        contentContainerStyle={[
          userProfileStyles.contentContainer,
          
        ]}
      >
        {/* Header Background */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goHome}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[...brandGradientSolid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={userProfileStyles.headerBackground}
          >
            <Text style={userProfileStyles.headerTitle}>{t('profile.title')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={userProfileStyles.profileCard}>
          <View style={userProfileStyles.avatarContainer}>
            <Text style={userProfileStyles.avatarText}>{getAvatarInitials(displayName)}</Text>
          </View>
          <Text style={userProfileStyles.userName}>{displayName}</Text>
          <View style={userProfileStyles.userRoleContainer}>
            <Text style={userProfileStyles.userRole}>{displayRole()}</Text>
          </View>
        </View>

        {/* Section: Thông tin chung (Từ BE) */}
        {!isPreHandoverRestricted ? (
          <View style={userProfileStyles.sectionContainer}>
            <Text style={userProfileStyles.sectionTitle}>{t("profile.contact_info")}</Text>

            <View style={userProfileStyles.infoItem}>
              <View style={userProfileStyles.infoIcon}>
                <Icons.mail size={20} color="#666" />
              </View>
              <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>{t("profile.email")}</Text>
                <Text style={userProfileStyles.infoValue}>{displayEmail}</Text>
              </View>
            </View>

            <View style={[userProfileStyles.infoItem, { borderBottomWidth: 0 }]}>
              <View style={userProfileStyles.infoIcon}>
                <Icons.call size={20} color="#666" />
              </View>
              <View style={userProfileStyles.infoContent}>
                <Text style={userProfileStyles.infoLabel}>{t("profile.phone")}</Text>
                <Text style={userProfileStyles.infoValue}>{displayPhone}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Section: Bảo mật (Custom Page) */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>{t('profile.security')}</Text>

          <TouchableOpacity 
            style={userProfileStyles.menuItem} 
            onPress={openChangePasswordPage}
          >
            <View style={[userProfileStyles.menuIcon, { backgroundColor: brandTintBg }]}>
              <Icons.shield size={22} color="#666" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t('profile.change_password')}</Text>
              <Text style={userProfileStyles.menuDescription}>{t('profile.change_password_desc')}</Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
          </TouchableOpacity>
        </View>

        {/* Section: Ứng dụng */}
        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>{t('profile.app_settings')}</Text>

          <TouchableOpacity style={userProfileStyles.menuItem} onPress={goTenantInvoiceList}>
            <View style={[userProfileStyles.menuIcon, { backgroundColor: brandTintBg }]}>
              <Icons.invoice size={22} color="#666" />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t('profile.my_invoices')}</Text>
              <Text style={userProfileStyles.menuDescription}>{t('profile.my_invoices_desc')}</Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
          </TouchableOpacity>

          {!isTenantAccessRestricted ? (
            <>
              <TouchableOpacity
                style={userProfileStyles.menuItem}
                onPress={() => navigation.navigate("Notification")}
              >
                <View style={[userProfileStyles.menuIcon, { backgroundColor: brandTintBg }]}>
                  <Icons.notification size={22} color="#666" />
                </View>
                <View style={userProfileStyles.menuContent}>
                  <Text style={userProfileStyles.menuLabel}>{t("profile.notifications")}</Text>
                  <Text style={userProfileStyles.menuDescription}>{t("profile.notifications_desc")}</Text>
                </View>
                <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
              </TouchableOpacity>

              <TouchableOpacity style={userProfileStyles.menuItem} onPress={goTenantTicketList}>
                <View style={[userProfileStyles.menuIcon, { backgroundColor: brandTintBg }]}>
                  <Icons.ticket size={22} color="#666" />
                </View>
                <View style={userProfileStyles.menuContent}>
                  <Text style={userProfileStyles.menuLabel}>{t("profile.my_tickets")}</Text>
                  <Text style={userProfileStyles.menuDescription}>{t("profile.my_tickets_desc")}</Text>
                </View>
                <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
              </TouchableOpacity>

              <TouchableOpacity style={userProfileStyles.menuItem} onPress={goTenantQuestionList}>
                <View style={[userProfileStyles.menuIcon, { backgroundColor: brandTintBg }]}>
                  <Icons.brain size={22} color="#666" />
                </View>
                <View style={userProfileStyles.menuContent}>
                  <Text style={userProfileStyles.menuLabel}>{t("profile.qa_answers")}</Text>
                  <Text style={userProfileStyles.menuDescription}>{t("profile.qa_answers_desc")}</Text>
                </View>
                <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={userProfileStyles.logoutButton} onPress={handleLogout}>
            <Icons.logOut size={20} color={BRAND_DANGER} />
            <Text style={userProfileStyles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default UserProfileScreen;
