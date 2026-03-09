import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import Icons from "../../../../shared/theme/icon";
import { RootStackParamList } from "../../../../shared/types";
import type { FunctionalAreaFromApi } from "../../../../shared/types/api";
import tenantHouseStyles from "./tenantHouseStyles";

type TenantHouseRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;
type TenantHouseNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "BuildingDetail"
>;

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
    functionalAreas: rawFunctionalAreas,
  } = route.params;

  const functionalAreas = useMemo<FunctionalAreaFromApi[]>(() => {
    const list = rawFunctionalAreas ?? [];
    return [...list].sort((a, b) => {
      const floorA = a.floorNo ?? "";
      const floorB = b.floorNo ?? "";
      if (floorA !== floorB) {
        return String(floorA).localeCompare(String(floorB), undefined, {
          numeric: true,
        });
      }
      return (a.name ?? "").localeCompare(b.name ?? "", undefined, {
        sensitivity: "base",
      });
    });
  }, [rawFunctionalAreas]);

  const getHouseStatusLabel = (statusValue?: string) => {
    if (!statusValue) {
      return t("staff_building_detail.house_status_other", { status: "-" });
    }
    const key =
      statusValue === "AVAILABLE"
        ? "house_status_available"
        : statusValue === "RENTED"
          ? "house_status_rented"
          : "house_status_other";
    return t(`staff_building_detail.${key}`, { status: statusValue });
  };

  const getAreaTypeLabel = (areaType: string) => {
    const key = `staff_building_detail.area_type_${areaType}`;
    const translated = t(key);
    if (translated === key) {
      return t("staff_building_detail.area_type_OTHER");
    }
    return translated;
  };

  return (
    <View style={tenantHouseStyles.container}>
      <View
        style={[
          tenantHouseStyles.topBar,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          style={tenantHouseStyles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icons.chevronBack size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={tenantHouseStyles.topTitle} numberOfLines={1}>
          {buildingName}
        </Text>
      </View>

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

          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>
              {t("home.house_info.address")}
            </Text>
            <Text style={tenantHouseStyles.houseValue}>{buildingAddress}</Text>
          </View>

          {(city || commune || ward) && (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>
                {t("home.house_info.address")}
              </Text>
              <Text style={tenantHouseStyles.houseValue}>
                {[ward, commune, city].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {description && (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>
                {t("home.house_info.description")}
              </Text>
              <Text style={tenantHouseStyles.houseValue}>{description}</Text>
            </View>
          )}

          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>
              {t("home.house_info.status")}
            </Text>
            <Text style={tenantHouseStyles.houseValue}>
              {getHouseStatusLabel(status)}
            </Text>
          </View>
        </View>

        <Text style={tenantHouseStyles.sectionTitle}>
          {t("staff_building_detail.functional_areas_title")}
        </Text>

        {functionalAreas.length === 0 ? (
          <Text style={tenantHouseStyles.emptyText}>
            {t("staff_building_detail.functional_areas_empty")}
          </Text>
        ) : (
          functionalAreas.map((area) => (
            <View key={area.id} style={tenantHouseStyles.areaCard}>
              <View style={tenantHouseStyles.areaTitleRow}>
                <Text style={tenantHouseStyles.areaName}>{area.name}</Text>
                <Text style={tenantHouseStyles.areaType}>
                  {getAreaTypeLabel(area.areaType)}
                </Text>
              </View>
              <Text style={tenantHouseStyles.areaFloor}>
                {t("staff_building_detail.functional_area_floor", {
                  floor: area.floorNo || "-",
                })}
              </Text>
              {area.description && (
                <Text style={tenantHouseStyles.areaDescription}>
                  {area.description}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default TenantHouseDescription;

