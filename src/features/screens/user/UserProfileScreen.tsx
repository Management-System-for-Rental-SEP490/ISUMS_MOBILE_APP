import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { CustomAlert as Alert } from "../../../shared/components/alert";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../shared/types";
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { logoutKeycloak, openChangePasswordPage } from "../../../shared/services/keycloakAuth";
import { UserProfileResponse } from "../../../shared/types/api";
import { getUserProfile } from "../../../shared/services/userApi";
import Icons from "../../../shared/theme/icon";
import {
  BRAND_DANGER,
  brandPrimary,
  brandTintBg,
  neutral,
} from "../../../shared/theme/color";
import { useTranslation } from "react-i18next";
import { useTenantContext } from "../../../shared/hooks";
import { isHandoverDateReached } from "../../../shared/utils";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../shared/components/StackScreenTitleBadge";

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, role, idToken, logout } = useAuthStore();
  const [userInfo, setUserInfo] = useState<UserProfileResponse | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const { house, isLoading: tenantAccessLoading } = useTenantContext();
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
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (!cancelled && data) {
          setUserInfo(data);
        }
      } finally {
        if (!cancelled) {
          setProfileLoaded(true);
        }
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
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

  const displayName =
    profileLoaded ? userInfo?.name || user || t("profile.role_guest") : "";
  const displayEmail = profileLoaded ? userInfo?.email || "" : "";
  const displayPhone = profileLoaded ? userInfo?.phoneNumber || "" : "";

  const goHome = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof parent.navigate === "function") {
      parent.navigate("Main" as never);
      return;
    }
    try {
      navigation.navigate("Main" as never);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={userProfileStyles.container}>
      <ScrollView
        contentContainerStyle={[
          userProfileStyles.contentContainer,
          
        ]}
      >
        <StackScreenTitleHeaderStrip>
          <View style={stackScreenTitleRowStyle}>
            <View style={stackScreenTitleSideSlotStyle}>
              <Pressable
                style={stackScreenTitleBackBtnOnBrand}
                onPress={() => navigation.goBack()}
              >
                <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
              </Pressable>
            </View>
            <View style={stackScreenTitleCenterSlotStyle}>
              <Pressable onPress={goHome}>
                <StackScreenTitleBadge numberOfLines={1}>
                  {t("profile.title")}
                </StackScreenTitleBadge>
              </Pressable>
            </View>
            <StackScreenTitleBarBalance />
          </View>
        </StackScreenTitleHeaderStrip>

        {/* Profile Card — chờ GET /users/me để tránh lóe username/role từ Keycloak */}
        <View style={userProfileStyles.profileCard}>
          {!profileLoaded ? (
            <View style={{ paddingVertical: 32, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={brandPrimary} accessibilityLabel={t("common.loading")} />
            </View>
          ) : (
            <>
              <Text style={userProfileStyles.userName}>{displayName}</Text>
              <View style={userProfileStyles.userRoleContainer}>
                <Text style={userProfileStyles.userRole}>{displayRole()}</Text>
              </View>
            </>
          )}
        </View>

        {/* Section: Thông tin chung (Từ BE) */}
        {!isPreHandoverRestricted ? (
          <View style={userProfileStyles.sectionContainer}>
            <Text style={userProfileStyles.sectionTitle}>{t("profile.contact_info")}</Text>

            {!profileLoaded ? (
              <View style={{ paddingVertical: 24, alignItems: "center" }}>
                <ActivityIndicator color={brandPrimary} accessibilityLabel={t("common.loading")} />
              </View>
            ) : (
              <>
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
              </>
            )}
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
