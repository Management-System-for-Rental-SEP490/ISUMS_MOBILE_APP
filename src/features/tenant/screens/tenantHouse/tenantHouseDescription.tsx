/**
 * Chi tiết nhà (tenant): hiện chỉ hiển thị thông tin nhà.
 * Sau này bổ sung link hợp đồng và các mục khác khi BE/UI sẵn sàng.
 */
import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import Icons from "../../../../shared/theme/icon";
import { RootStackParamList } from "../../../../shared/types";
import tenantHouseStyles from "./tenantHouseStyles";
import { formatHouseStatusForDisplay } from "../../../../shared/utils";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";

type TenantHouseRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;
type TenantHouseNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "BuildingDetail"
>;

/** Nếu BE trả `address` đã gồm phường/quận/TP thì không hiển thị thêm một dòng trùng nội dung. */
function isAdminDivisionInsideAddress(
  address: string,
  ward?: string,
  commune?: string,
  city?: string
): boolean {
  const a = address.trim().toLowerCase();
  if (!a) return false;
  const parts = [ward, commune, city]
    .map((x) => (x ?? "").trim().toLowerCase())
    .filter((x) => x.length >= 2);
  if (parts.length === 0) return false;
  return parts.every((p) => a.includes(p));
}

const TenantHouseDescription = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TenantHouseNavProp>();
  const route = useRoute<TenantHouseRouteProp>();

  const {
    buildingName,
    buildingAddress,
    description,
    ward,
    commune,
    city,
    status,
  } = route.params;

  /** Chuỗi từ `ward`, `commune`, `city` (đúng thứ tự BE). */
  const adminDivisionLine = useMemo(
    () =>
      [ward, commune, city]
        .map((x) => (x ?? "").trim())
        .filter(Boolean)
        .join(", "),
    [ward, commune, city]
  );
  const streetLine = (buildingAddress ?? "").trim();
  const adminRedundant =
    streetLine.length > 0 &&
    adminDivisionLine.length > 0 &&
    isAdminDivisionInsideAddress(streetLine, ward, commune, city);
  const showAdminRow =
    streetLine.length > 0 &&
    adminDivisionLine.length > 0 &&
    !adminRedundant;
  const hasLocationLine =
    streetLine.length > 0 || adminDivisionLine.length > 0;

  return (
    <View style={tenantHouseStyles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("home.house_detail_screen_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={tenantHouseStyles.content}
        contentContainerStyle={[
          tenantHouseStyles.contentContainer,
          { paddingBottom: tenantHouseStyles.contentContainer.paddingBottom + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={tenantHouseStyles.card}>
          <Text style={tenantHouseStyles.houseName}>{buildingName}</Text>

          {hasLocationLine && (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>
                {t("home.house_info.address")}
              </Text>
              <Text style={tenantHouseStyles.houseValue}>
                {streetLine || adminDivisionLine}
              </Text>
            </View>
          )}

          {showAdminRow && (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>
                {t("home.house_info.admin_division")}
              </Text>
              <Text style={tenantHouseStyles.houseValue}>{adminDivisionLine}</Text>
            </View>
          )}

          {description ? (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>
                {t("home.house_info.description")}
              </Text>
              <Text style={tenantHouseStyles.houseValue}>{description}</Text>
            </View>
          ) : null}

          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>
              {t("home.house_info.status")}
            </Text>
            <Text style={tenantHouseStyles.houseValue}>
              {formatHouseStatusForDisplay(status, t)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TenantHouseDescription;
