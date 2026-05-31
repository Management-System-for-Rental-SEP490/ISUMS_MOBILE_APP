import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Pressable } from "react-native";
import { CustomAlert as Alert } from "../../../shared/components/alert";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../shared/types";
import userProfileStyles from "./UserProfileScreenStyles";
import { useAuthStore } from "../../../store/useAuthStore";
import { logoutKeycloak, openChangePasswordPage } from "../../../shared/services/keycloakAuth";
import Icons from "../../../shared/theme/icon";
import {
  BRAND_DANGER,
  brandPrimary,
  brandSecondary,
  neutral,
} from "../../../shared/theme/color";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  useHouseNamesByIds,
  useMyEContracts,
  useTenantContext,
  useTenantHouses,
  useUserProfile,
  useRefreshControlGate,
} from "../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import type { TenantEContractFromApi } from "../../../shared/types/api";
import { isHandoverDateReached, shortHouseIdForDisplay, tenantAccessibleHouseIdSet } from "../../../shared/utils";
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

const EMPTY_ECONTRACTS: TenantEContractFromApi[] = [];
/** Số hợp đồng hiển thị trước khi bấm “Xem thêm”. */
const E_CONTRACTS_PREVIEW_MAX = 2;

const UserProfileScreen = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, role } = useAuthStore();
  const [eContractsListExpanded, setEContractsListExpanded] = useState(false);

  const {
    data: userInfo,
    isPending: profilePending,
    isRefetching: profileRefetching,
    refetch: refetchProfile,
  } = useUserProfile();
  const profileLoaded = !profilePending;

  const { house, isLoading: tenantAccessLoading } = useTenantContext();

  const {
    data: contractsRaw,
    isLoading: contractsLoading,
    isError: contractsError,
    refetch: refetchContracts,
    isRefetching: contractsRefetching,
  } = useMyEContracts();
  const {
    data: tenantHousesRes,
    refetch: refetchTenantHouses,
    isRefetching: tenantHousesRefetching,
  } = useTenantHouses();

  const contracts = contractsRaw ?? EMPTY_ECONTRACTS;

  const visibleContracts = useMemo(() => {
    if (contracts.length <= E_CONTRACTS_PREVIEW_MAX || eContractsListExpanded) {
      return contracts;
    }
    return contracts.slice(0, E_CONTRACTS_PREVIEW_MAX);
  }, [contracts, eContractsListExpanded]);

  const eContractsExtraCount =
    contracts.length > E_CONTRACTS_PREVIEW_MAX
      ? contracts.length - E_CONTRACTS_PREVIEW_MAX
      : 0;

  useEffect(() => {
    if (contracts.length <= E_CONTRACTS_PREVIEW_MAX) {
      setEContractsListExpanded(false);
    }
  }, [contracts.length]);

  const orphanContractHouseIds = useMemo(() => {
    const rows =
      tenantHousesRes?.success && Array.isArray(tenantHousesRes.data)
        ? tenantHousesRes.data
        : [];
    const accessSet = tenantAccessibleHouseIdSet(rows);
    const s = new Set<string>();
    for (const c of contracts) {
      const hid = String(c.houseId ?? "").trim();
      if (hid && !accessSet.has(hid)) s.add(hid);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [tenantHousesRes, contracts]);

  const { namesById: orphanContractHouseNames } = useHouseNamesByIds(orphanContractHouseIds);

  const houseNameById = useMemo(() => {
    const m = new Map<string, string>();
    const rows =
      tenantHousesRes?.success && Array.isArray(tenantHousesRes.data)
        ? tenantHousesRes.data
        : [];
    for (const h of rows) {
      const id = String(h.id ?? "").trim();
      if (!id) continue;
      const n = String(h.name ?? "").trim();
      m.set(id, n || id);
    }
    for (const c of contracts) {
      const hid = String(c.houseId ?? "").trim();
      if (!hid || m.has(hid)) continue;
      const api = orphanContractHouseNames.get(hid)?.trim();
      m.set(hid, api || shortHouseIdForDisplay(hid));
    }
    return m;
  }, [tenantHousesRes, contracts, orphanContractHouseNames]);

  const listRefetching = contractsRefetching || tenantHousesRefetching || profileRefetching;

  const onRefreshAll = useCallback(async () => {
    await Promise.all([
      refetchProfile(),
      refetchContracts(),
      refetchTenantHouses(),
    ]);
  }, [refetchProfile, refetchContracts, refetchTenantHouses]);

  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();

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

  /**
   * Đăng xuất: khóa UI màn tải ngay → xóa cache React Query + token cục bộ → gọi Keycloak SSO
   * (Custom Tab có thể hiện trên cùng; sau đó một lần mở khóa → Login, không nháy dữ liệu phiên cũ).
   */
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
            const logoutTimeoutMs = 7000;
            const tokenSnapshot = useAuthStore.getState().idToken;
            useAuthStore.getState().setLogoutUiLocked(true);
            try {
              queryClient.clear();
              useAuthStore.getState().logout();
              await Promise.race([
                logoutKeycloak(tokenSnapshot),
                new Promise<void>((resolve) => setTimeout(resolve, logoutTimeoutMs)),
              ]);
            } finally {
              useAuthStore.getState().setLogoutUiLocked(false);
            }
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
    <View style={[userProfileStyles.container, { position: "relative" }]}>
      <RefreshLogoOverlay visible={listRefetching} />
      <ScrollView
        contentContainerStyle={[userProfileStyles.contentContainer]}
        onScroll={onScrollForRefreshGate}
        scrollEventThrottle={16}
        refreshControl={
          <PullToRefreshControl
            refreshing={listRefetching}
            onRefresh={onRefreshAll}
            scrollAtTop={scrollAtTop}
          />
        }
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
        <View style={[userProfileStyles.profileCard, { position: "relative", minHeight: !profileLoaded ? 160 : undefined }]}>
          {!profileLoaded ? (
            <View style={[userProfileStyles.profileCardLoader, { minHeight: 160 }]}>
              <RefreshLogoOverlay visible mode="page" />
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
              <View style={userProfileStyles.sectionLoader}>
                <RefreshLogoInline logoPx={22} showLabel />
              </View>
            ) : (
              <>
                <View style={userProfileStyles.infoItem}>
                  <View style={userProfileStyles.infoIcon}>
                    <Icons.mail size={20} color={neutral.iconMuted} />
                  </View>
                  <View style={userProfileStyles.infoContent}>
                    <Text style={userProfileStyles.infoLabel}>{t("profile.email")}</Text>
                    <Text style={userProfileStyles.infoValue}>{displayEmail}</Text>
                  </View>
                </View>

                <View style={[userProfileStyles.infoItem, userProfileStyles.infoItemLast]}>
                  <View style={userProfileStyles.infoIcon}>
                    <Icons.call size={20} color={neutral.iconMuted} />
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
            <View style={userProfileStyles.menuIconAccent}>
              <Icons.shield size={22} color={neutral.iconMuted} />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t('profile.change_password')}</Text>
              <Text style={userProfileStyles.menuDescription}>{t('profile.change_password_desc')}</Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
          </TouchableOpacity>
        </View>

        <View style={userProfileStyles.sectionContainer}>
          <Text style={userProfileStyles.sectionTitle}>{t("profile.app_settings")}</Text>

          <TouchableOpacity
            style={userProfileStyles.menuItem}
            onPress={() => navigation.navigate("SettingsScreen")}
            activeOpacity={0.78}
          >
            <View style={userProfileStyles.menuIconAccent}>
              <Icons.settings size={22} color={neutral.iconMuted} />
            </View>
            <View style={userProfileStyles.menuContent}>
              <Text style={userProfileStyles.menuLabel}>{t("profile.settings")}</Text>
              <Text style={userProfileStyles.menuDescription}>{t("profile.settings_desc")}</Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
          </TouchableOpacity>
        </View>

        {role === "tenant" ? (
          <View style={userProfileStyles.sectionContainer}>
            <Text style={userProfileStyles.sectionTitle}>
              {t("profile.e_contracts_section")}
            </Text>
            {contractsLoading && contracts.length === 0 ? (
              <View style={userProfileStyles.eContractsLoader}>
                <RefreshLogoInline logoPx={22} showLabel />
              </View>
            ) : null}
            {contractsError ? (
              <Text style={[userProfileStyles.menuDescription, userProfileStyles.eContractsMessage]}>
                {t("profile.e_contracts_load_error")}
              </Text>
            ) : null}
            {!contractsLoading && !contractsError && contracts.length === 0 ? (
              <Text style={[userProfileStyles.menuDescription, userProfileStyles.eContractsMessage]}>
                {t("profile.e_contracts_empty")}
              </Text>
            ) : null}
            {visibleContracts.map((c) => {
              const hid = String(c.houseId ?? "").trim();
              const houseLabel = (hid ? houseNameById.get(hid) : undefined) ?? c.name ?? hid;
              const title = t("profile.e_contract_for_house", { name: houseLabel });
              return (
                <Pressable
                  key={c.id}
                  style={userProfileStyles.menuItem}
                  onPress={() => navigation.navigate("UserContractDetail", { contract: c })}
                >
                  <View style={userProfileStyles.menuIconAccent}>
                    <Icons.eContract size={22} color={brandSecondary} />
                  </View>
                  <View style={userProfileStyles.menuContent}>
                    <Text style={userProfileStyles.menuLabel}>{title}</Text>
                    {c.name ? (
                      <Text style={userProfileStyles.menuDescription} numberOfLines={2}>
                        {c.name}
                      </Text>
                    ) : null}
                  </View>
                  <Icons.chevronForward size={20} color={neutral.textOnDarkSoft} />
                </Pressable>
              );
            })}
            {eContractsExtraCount > 0 && !eContractsListExpanded ? (
              <TouchableOpacity
                style={userProfileStyles.eContractsToggleRow}
                onPress={() => setEContractsListExpanded(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("profile.e_contracts_show_more", { count: eContractsExtraCount })}
              >
                <Text style={userProfileStyles.eContractsToggleLabel}>
                  {t("profile.e_contracts_show_more", { count: eContractsExtraCount })}
                </Text>
                <Icons.chevronDown size={22} color={brandPrimary} />
              </TouchableOpacity>
            ) : null}
            {eContractsExtraCount > 0 && eContractsListExpanded ? (
              <TouchableOpacity
                style={userProfileStyles.eContractsToggleRow}
                onPress={() => setEContractsListExpanded(false)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("profile.e_contracts_show_less")}
              >
                <Text style={userProfileStyles.eContractsToggleLabel}>
                  {t("profile.e_contracts_show_less")}
                </Text>
                <Icons.chevronUp size={22} color={brandPrimary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

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
